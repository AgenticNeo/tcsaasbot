from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import json
import random
import time

from app.services.rag_service import rag_service
from app.services.agent_service import agent_service
from app.core.security import get_current_user_id
from app.core.database import get_db, ConversationDB, MessageDB, TenantUsageDB
from app.core.logging import logger
from app.models.bot import Bot
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter()

def _increment_usage(db: Session, tenant_id: str, field: str):
    usage = db.query(TenantUsageDB).filter(TenantUsageDB.tenant_id == tenant_id).first()
    if not usage:
        usage = TenantUsageDB(tenant_id=tenant_id)
        db.add(usage)
    
    current_val = getattr(usage, field) or 0
    setattr(usage, field, current_val + 1)
    db.commit()

def _get_or_create_conversation(db: Session, tenant_id: str, conversation_id: Optional[int], bot_id: Optional[int]):
    if conversation_id:
        conv = db.query(ConversationDB).filter(ConversationDB.id == conversation_id, ConversationDB.tenant_id == tenant_id).first()
        if conv:
            return conv
    
    conv = ConversationDB(tenant_id=tenant_id, bot_id=bot_id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    logger.info("conversation_created", extra={
        "conversation_id": conv.id, "tenant_id": tenant_id, "bot_id": bot_id
    })
    return conv

def _get_chat_history(db: Session, conversation_id: int):
    history_msgs = db.query(MessageDB).filter(MessageDB.conversation_id == conversation_id).order_by(MessageDB.created_at.desc()).limit(11).all()
    history_msgs.reverse()
    chat_history = []
    for m in history_msgs:
        if m.sender == 'user':
            chat_history.append(HumanMessage(content=m.text))
        else:
            chat_history.append(AIMessage(content=m.text))
    return chat_history

TRANSFER_KEYWORDS = ["talk to human", "speak to agent", "representative", "human help"]

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    bot_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    sender: str
    text: str
    created_at: datetime
    sources: Optional[List[Dict]] = None

class ActionButton(BaseModel):
    label: str
    value: str

class ChatResponse(BaseModel):
    answer: str
    conversation_id: int
    sources: List[Dict]
    actions: Optional[List[ActionButton]] = None
    agent_requested: Optional[bool] = False

def _check_agent_transfer(message: str, bot: Optional[Bot], conv, db: Session) -> Optional[dict]:
    """Check if the message triggers an agent transfer. Returns a response dict or None."""
    if not bot or not bot.agent_transfer_enabled:
        return None
    if not any(kw in message.lower() for kw in TRANSFER_KEYWORDS):
        return None
    conv.agent_requested = True
    conv.status = "open"
    transfer_msg = "I'm connecting you with a human agent who can help you better. Please wait a moment."
    db.add(MessageDB(conversation_id=conv.id, sender='bot', text=transfer_msg))
    db.commit()
    logger.info("agent_transfer_triggered", extra={
        "conversation_id": conv.id, "bot_id": bot.id, "tenant_id": bot.tenant_id
    })
    return {"answer": transfer_msg, "conversation_id": conv.id, "sources": [], "actions": []}

def _check_small_talk(message: str, bot: Optional[Bot], conv, db: Session) -> Optional[dict]:
    """Check if the message matches a small talk trigger. Returns a response dict or None."""
    if not bot or not bot.small_talk_responses:
        return None
    responses = bot.small_talk_responses if isinstance(bot.small_talk_responses, list) else json.loads(bot.small_talk_responses)
    msg_lower = message.lower()
    for entry in responses:
        trigger = entry.get('trigger')
        if not entry.get('enabled') or not trigger:
            continue
        if trigger.lower() not in msg_lower:
            continue
        ans = entry.get('response', '')
        if entry.get('variations'):
            ans = random.choice([ans] + entry.get('variations'))
        db.add(MessageDB(conversation_id=conv.id, sender='bot', text=ans))
        db.commit()
        logger.info("small_talk_matched", extra={
            "conversation_id": conv.id, "trigger": trigger, "bot_id": bot.id
        })
        return {"answer": ans, "conversation_id": conv.id, "sources": [], "actions": bot.quick_replies or []}
    return None

async def _get_ai_response(message: str, bot: Optional[Bot], conv, db: Session, tenant_id: str):
    """Generate an AI response using either the agent service or RAG."""
    start = time.perf_counter()
    tools = bot.tools if bot else None
    response_type = "agent" if (tools and tools != "[]") else "rag"

    if response_type == "agent":
        tool_list = json.loads(tools) if isinstance(tools, str) else tools
        answer = await agent_service.run_agent(message, tool_list, (bot.prompt_template if bot else None) or "You are a helpful assistant.")
        sources = []
    else:
        chat_history = _get_chat_history(db, conv.id)
        response = rag_service.query(message, collection_name=tenant_id, chat_history=chat_history)
        answer, sources = response['answer'], response.get('sources', [])

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    db.add(MessageDB(conversation_id=conv.id, sender='bot', text=answer))
    _increment_usage(db, tenant_id, "messages_sent")
    db.commit()

    logger.info("ai_response_generated", extra={
        "conversation_id": conv.id,
        "tenant_id": tenant_id,
        "bot_id": bot.id if bot else None,
        "response_type": response_type,
        "duration_ms": duration_ms,
        "answer_length": len(answer),
        "source_count": len(sources),
    })
    return answer, sources

def _get_bot_actions(bot: Optional[Bot]) -> list:
    """Get quick reply actions from a bot, handling both JSON and list types."""
    actions = bot.quick_replies if bot else []
    if isinstance(actions, str):
        actions = json.loads(actions)
    return actions or []

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest, 
    tenant_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        logger.info("chat_request_received", extra={
            "tenant_id": tenant_id, "bot_id": request.bot_id,
            "conversation_id": request.conversation_id, "message_length": len(request.message)
        })
        conv = _get_or_create_conversation(db, tenant_id, request.conversation_id, request.bot_id)
        db.add(MessageDB(conversation_id=conv.id, sender='user', text=request.message))
        
        bot = db.query(Bot).filter(Bot.id == request.bot_id).first() if request.bot_id else None
        
        transfer_result = _check_agent_transfer(request.message, bot, conv, db)
        if transfer_result:
            return transfer_result

        small_talk_result = _check_small_talk(request.message, bot, conv, db)
        if small_talk_result:
            return small_talk_result

        answer, sources = await _get_ai_response(request.message, bot, conv, db, tenant_id)
        return {"answer": answer, "conversation_id": conv.id, "sources": sources, "actions": _get_bot_actions(bot)}
    except Exception as e:
        error_msg = str(e)
        logger.error("chat_error", extra={
            "tenant_id": tenant_id, "bot_id": request.bot_id,
            "conversation_id": request.conversation_id, "error": error_msg
        })
        db.rollback()
        
        if "429" in error_msg or "ResourceExhausted" in error_msg or "quota" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="AI processing capacity temporarily exhausted. Please try again in a few moments."
            )
            
        raise HTTPException(status_code=500, detail="Internal AI error. Please try again.")

@router.post("/public", response_model=ChatResponse)
async def chat_public(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        logger.info("chat_public_request", extra={
            "bot_id": request.bot_id, "conversation_id": request.conversation_id,
            "message_length": len(request.message)
        })
        if not request.bot_id:
            raise HTTPException(status_code=400, detail="Bot ID required")
        bot = db.query(Bot).filter(Bot.id == request.bot_id).first()
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        conv = _get_or_create_conversation(db, bot.tenant_id, request.conversation_id, request.bot_id)
        db.add(MessageDB(conversation_id=conv.id, sender='user', text=request.message))
        
        transfer_result = _check_agent_transfer(request.message, bot, conv, db)
        if transfer_result:
            return transfer_result

        small_talk_result = _check_small_talk(request.message, bot, conv, db)
        if small_talk_result:
            return small_talk_result

        answer, sources = await _get_ai_response(request.message, bot, conv, db, bot.tenant_id)
        return {"answer": answer, "conversation_id": conv.id, "sources": sources, "actions": _get_bot_actions(bot)}
    except Exception as e:
        logger.error("chat_public_error", extra={
            "bot_id": request.bot_id, "error": str(e)
        })
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/public/history", response_model=List[MessageResponse])
async def get_history_public(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    messages = db.query(MessageDB).filter(MessageDB.conversation_id == conversation_id).order_by(MessageDB.created_at.asc()).all()
    return messages

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def add_agent_message(
    conversation_id: int,
    request: ChatRequest,
    tenant_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    conv = db.query(ConversationDB).filter(ConversationDB.id == conversation_id, ConversationDB.tenant_id == tenant_id).first()
    if not conv:
        logger.warning("agent_message_conversation_not_found", extra={
            "conversation_id": conversation_id, "tenant_id": tenant_id
        })
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db_msg = MessageDB(conversation_id=conversation_id, sender='agent', text=request.message)
    db.add(db_msg)
    
    # Update conversation status if it was open
    if conv.status == "open":
        conv.status = "pending"
        
    db.commit()
    db.refresh(db_msg)
    logger.info("agent_message_sent", extra={
        "conversation_id": conversation_id, "tenant_id": tenant_id,
        "message_length": len(request.message)
    })
    return db_msg

@router.get("/history", response_model=List[MessageResponse])
async def get_history(
    conversation_id: Optional[int] = None,
    bot_id: Optional[int] = None,
    tenant_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if not conversation_id:
        query = db.query(ConversationDB).filter(ConversationDB.tenant_id == tenant_id)
        if bot_id:
            query = query.filter(ConversationDB.bot_id == bot_id)
        last_conv = query.order_by(ConversationDB.created_at.desc()).first()
        if not last_conv: return []
        conversation_id = last_conv.id
    
    conv = db.query(ConversationDB).filter(ConversationDB.id == conversation_id, ConversationDB.tenant_id == tenant_id).first()
    if not conv: return []

    messages = db.query(MessageDB).filter(MessageDB.conversation_id == conversation_id).order_by(MessageDB.created_at.asc()).all()
    return messages
