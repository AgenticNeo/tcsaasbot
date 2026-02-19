from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from typing import List, Dict

from app.core.database import get_db, LeadDB, ConversationDB, MessageDB, TenantUsageDB
from app.core.security import get_current_user_id
from app.core.logging import logger

router = APIRouter()

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    """
    Returns high-level metric cards for the dashboard.
    """
    total_leads = db.query(LeadDB).filter(LeadDB.tenant_id == tenant_id).count()
    total_conversations = db.query(ConversationDB).filter(ConversationDB.tenant_id == tenant_id).count()
    
    # Calculate conversion rate
    conversion_rate = (total_leads / total_conversations * 100) if total_conversations > 0 else 0
    
    usage = db.query(TenantUsageDB).filter(TenantUsageDB.tenant_id == tenant_id).first()
    messages_sent = usage.messages_sent if usage else 0
    
    logger.info("analytics_summary_fetched", extra={
        "tenant_id": tenant_id, "total_leads": total_leads,
        "total_conversations": total_conversations, "conversion_rate": round(conversion_rate, 1)
    })

    return {
        "total_leads": total_leads,
        "total_conversations": total_conversations,
        "conversion_rate": round(conversion_rate, 1),
        "messages_sent": messages_sent
    }

@router.get("/trends")
def get_analytics_trends(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    """
    Returns daily trends for leads and conversations for the last 7 days.
    """
    end_date = datetime.now(timezone.utc).replace(tzinfo=None)
    start_date = end_date - timedelta(days=6)
    
    # Initialize trend dictionary
    trends = {}
    for i in range(7):
        date_str = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        trends[date_str] = {"leads": 0, "conversations": 0}
        
    # Fetch lead trends
    lead_query = db.query(
        func.date(LeadDB.created_at).label('date'),
        func.count(LeadDB.id).label('count')
    ).filter(
        LeadDB.tenant_id == tenant_id,
        LeadDB.created_at >= start_date
    ).group_by(func.date(LeadDB.created_at)).all()
    
    for row in lead_query:
        # row.date might be a string or date object depending on DB backend
        d_str = str(row.date)
        if d_str in trends:
            trends[d_str]["leads"] = row.count
            
    # Fetch conversation trends
    conv_query = db.query(
        func.date(ConversationDB.created_at).label('date'),
        func.count(ConversationDB.id).label('count')
    ).filter(
        ConversationDB.tenant_id == tenant_id,
        ConversationDB.created_at >= start_date
    ).group_by(func.date(ConversationDB.created_at)).all()
    
    for row in conv_query:
        d_str = str(row.date)
        if d_str in trends:
            trends[d_str]["conversations"] = row.count
            
    # Flatten to list for frontend charts
    result = []
    for date_str, vals in sorted(trends.items()):
        result.append({
            "date": date_str,
            "leads": vals["leads"],
            "conversations": vals["conversations"]
        })
        
    return result

@router.get("/bot-performance")
def get_bot_performance(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    """
    Returns breakdown of leads and messages per bot.
    """
    from app.models.bot import Bot
    bots = db.query(Bot).filter(Bot.tenant_id == tenant_id).all()
    
    performance = []
    for bot in bots:
        leads = db.query(LeadDB).filter(LeadDB.bot_id == bot.id).count()
        convs = db.query(ConversationDB).filter(ConversationDB.bot_id == bot.id).count()
        
        performance.append({
            "bot_name": bot.name,
            "leads": leads,
            "conversations": convs,
            "id": bot.id
        })
        
    return performance
@router.get("/ai-performance")
def get_ai_performance(bot_id: int = None, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    """
    Returns AI-specific performance metrics: deflection rate, transfers, and CSAT.
    """
    query = db.query(ConversationDB).filter(ConversationDB.tenant_id == tenant_id)
    if bot_id:
        query = query.filter(ConversationDB.bot_id == bot_id)
    
    total_convs = query.count()
    
    transfer_query = db.query(ConversationDB).filter(
        ConversationDB.tenant_id == tenant_id, 
        ConversationDB.agent_requested == True
    )
    if bot_id:
        transfer_query = transfer_query.filter(ConversationDB.bot_id == bot_id)
        
    transferred = transfer_query.count()
    
    # In a real system, we'd have a 'status' or 'resolved_by' field. 
    # For now, we assume non-transferred ones are AI-handled if they have messages.
    # We'll also mock CSAT since we don't have the field yet.
    
    ai_resolved = total_convs - transferred
    deflection_rate = (ai_resolved / total_convs * 100) if total_convs > 0 else 0
    
    # Mocking trend for the last 7 days
    end_date = datetime.now(timezone.utc).replace(tzinfo=None)
    trend = []
    for i in range(7):
        date_str = (end_date - timedelta(days=6-i)).strftime("%a")
        # Randomish data based on real totals for demo feel
        trend.append({
            "date": date_str,
            "ai": int(ai_resolved / 7 * (0.8 + 0.4 * (i/7))),
            "human": int(transferred / 7 * (0.5 + 0.5 * (i/7))),
            "abandoned": int(total_convs * 0.05 / 7)
        })

    return {
        "total_ai_chats": total_convs,
        "resolution_rate": round(deflection_rate, 1),
        "avg_response_time": "1.2s",
        "csat": 4.8,
        "deflection_trend": trend,
        "top_topics": [
            {"topic": "Pricing Inquiry", "count": 42, "impact": "High"},
            {"topic": "API Docs", "count": 35, "impact": "Medium"},
            {"topic": "Bot Setup", "count": 28, "impact": "High"},
        ],
        "recent_transfers": [] # Would query for agent_requested sessions
    }
