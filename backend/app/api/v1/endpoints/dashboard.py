from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app.core.logging import logger

from app.core.database import get_db, MessageDB, ConversationDB, TenantDB, TenantUsageDB
from app.models.bot import Bot, BotFAQ
from app.models.schemas import (
    BotCreate, BotUpdate, BotResponse, AnalyticsSummary, 
    MessageResponse, ConversationResponse, FAQCreate, FAQUpdate, 
    FAQResponse, TenantSettings
)
from app.core.security import get_current_user_id

router = APIRouter()

BOT_NOT_FOUND = "Bot not found"

@router.post("/", response_model=BotResponse)
def create_bot(bot: BotCreate, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    bot_data = bot.dict()
    # tools is already a list coming from Pydantic, and SQLAlchemy JSON type handles it
        
    db_bot = Bot(**bot_data, tenant_id=tenant_id)
    db.add(db_bot)
    db.commit()
    db.refresh(db_bot)
    logger.info("bot_created", extra={
        "bot_id": db_bot.id, "bot_name": db_bot.name, "tenant_id": tenant_id
    })
    return db_bot

@router.get("/", response_model=List[BotResponse])
def read_bots(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    bots = db.query(Bot).filter(Bot.tenant_id == tenant_id).offset(skip).limit(limit).all()
    return bots

@router.get("/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    total_conversations = db.query(ConversationDB).filter(ConversationDB.tenant_id == tenant_id).count()
    active_bots = db.query(Bot).filter(Bot.tenant_id == tenant_id, Bot.is_active == True).count()
    total_messages = db.query(MessageDB).join(ConversationDB).filter(ConversationDB.tenant_id == tenant_id).count()

    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "active_bots": active_bots,
        "avg_response_time": 1.5
    }

@router.get("/conversations", response_model=List[ConversationResponse])
def read_conversations(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    convs = db.query(
        ConversationDB,
        Bot.name.label("bot_name")
    ).outerjoin(Bot, ConversationDB.bot_id == Bot.id)\
     .filter(ConversationDB.tenant_id == tenant_id)\
     .order_by(ConversationDB.created_at.desc()).all()
    
    results = []
    for conv, bot_name in convs:
        last_msg = db.query(MessageDB).filter(MessageDB.conversation_id == conv.id).order_by(MessageDB.created_at.desc()).first()
        msg_count = db.query(MessageDB).filter(MessageDB.conversation_id == conv.id).count()
        
        results.append({
            "id": conv.id,
            "bot_id": conv.bot_id,
            "bot_name": bot_name,
            "created_at": conv.created_at,
            "last_message": last_msg.text if last_msg else "No messages",
            "message_count": msg_count
        })
        
    return results

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def read_conversation_messages(conversation_id: int, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    conv = db.query(ConversationDB).filter(ConversationDB.id == conversation_id, ConversationDB.tenant_id == tenant_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = db.query(MessageDB).filter(MessageDB.conversation_id == conversation_id).order_by(MessageDB.created_at.asc()).all()
    return messages

@router.get("/settings", response_model=TenantSettings)
def get_settings(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    tenant = db.query(TenantDB).filter(TenantDB.id == tenant_id).first()
    if not tenant:
        tenant = TenantDB(id=tenant_id, name="New User")
        db.add(tenant)
        db.commit()
    
    usage = db.query(TenantUsageDB).filter(TenantUsageDB.tenant_id == tenant_id).first()
    if not usage:
        usage = TenantUsageDB(tenant_id=tenant_id)
        db.add(usage)
        db.commit()
        db.refresh(usage)
        
    limits = {
        "starter": {"msgs": 100, "docs": 5},
        "pro": {"msgs": 5000, "docs": 50},
        "enterprise": {"msgs": 100000, "docs": 1000}
    }
    
    plan_limits = limits.get(tenant.plan, limits["starter"])
    
    return {
        "id": tenant.id,
        "name": tenant.name,
        "plan": tenant.plan,
        "messages_sent": usage.messages_sent,
        "documents_indexed": usage.documents_indexed,
        "message_limit": plan_limits["msgs"],
        "document_limit": plan_limits["docs"]
    }

@router.get("/public/{bot_id}", response_model=BotResponse)
def get_bot_public(bot_id: int, db: Session = Depends(get_db)):
    db_bot = db.query(Bot).filter(Bot.id == bot_id).first()
    if not db_bot:
        raise HTTPException(status_code=404, detail=BOT_NOT_FOUND)
    return db_bot

@router.get("/{bot_id}", response_model=BotResponse)
def read_bot(bot_id: int, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    db_bot = db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    if not db_bot:
        raise HTTPException(status_code=404, detail=BOT_NOT_FOUND)
    return db_bot

@router.put("/{bot_id}", response_model=BotResponse)
def update_bot(bot_id: int, bot_update: BotUpdate, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    db_bot = db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    if not db_bot:
        logger.warning("bot_not_found", extra={"bot_id": bot_id, "tenant_id": tenant_id, "action": "update"})
        raise HTTPException(status_code=404, detail=BOT_NOT_FOUND)
    
    update_data = bot_update.dict(exclude_unset=True)
    # tools is handled by JSON type
        
    for key, value in update_data.items():
        setattr(db_bot, key, value)
        
    db.commit()
    db.refresh(db_bot)
    logger.info("bot_updated", extra={
        "bot_id": bot_id, "tenant_id": tenant_id,
        "updated_fields": list(update_data.keys())
    })
    return db_bot

@router.delete("/{bot_id}")
def delete_bot(bot_id: int, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    db_bot = db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    if not db_bot:
        logger.warning("bot_not_found", extra={"bot_id": bot_id, "tenant_id": tenant_id, "action": "delete"})
        raise HTTPException(status_code=404, detail=BOT_NOT_FOUND)
        
    db.delete(db_bot)
    db.commit()
    logger.info("bot_deleted", extra={"bot_id": bot_id, "tenant_id": tenant_id})
    return {"ok": True}

@router.get("/{bot_id}/faqs", response_model=List[FAQResponse])
def get_bot_faqs(bot_id: int, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    db_bot = db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    if not db_bot:
        raise HTTPException(status_code=404, detail=BOT_NOT_FOUND)
    
    faqs = db.query(BotFAQ).filter(BotFAQ.bot_id == bot_id).all()
    return faqs

@router.post("/{bot_id}/faqs", response_model=FAQResponse)
def create_bot_faq(bot_id: int, faq: FAQCreate, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    db_bot = db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    if not db_bot:
        raise HTTPException(status_code=404, detail=BOT_NOT_FOUND)
    
    db_faq = BotFAQ(**faq.dict(), bot_id=bot_id)
    db.add(db_faq)
    db.commit()
    db.refresh(db_faq)
    logger.info("faq_created", extra={
        "faq_id": db_faq.id, "bot_id": bot_id, "tenant_id": tenant_id
    })
    return db_faq

@router.put("/{bot_id}/faqs/{faq_id}", response_model=FAQResponse)
def update_bot_faq(bot_id: int, faq_id: int, faq_update: FAQUpdate, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    db_bot = db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    if not db_bot:
        raise HTTPException(status_code=404, detail=BOT_NOT_FOUND)
    
    db_faq = db.query(BotFAQ).filter(BotFAQ.id == faq_id, BotFAQ.bot_id == bot_id).first()
    if not db_faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    update_data = faq_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_faq, key, value)
        
    db.commit()
    db.refresh(db_faq)
    return db_faq

@router.delete("/{bot_id}/faqs/{faq_id}")
def delete_bot_faq(bot_id: int, faq_id: int, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    db_bot = db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    if not db_bot:
        raise HTTPException(status_code=404, detail=BOT_NOT_FOUND)
    
    db_faq = db.query(BotFAQ).filter(BotFAQ.id == faq_id, BotFAQ.bot_id == bot_id).first()
    if not db_faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
        
    db.delete(db_faq)
    db.commit()
    logger.info("faq_deleted", extra={
        "faq_id": faq_id, "bot_id": bot_id, "tenant_id": tenant_id
    })
    return {"ok": True}
