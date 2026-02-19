from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.core.database import get_db, LeadFormDB, LeadDB, EmailSettingsDB
from app.core.logging import logger
from app.core.security import get_current_user_id
from app.models.schemas import LeadFormCreate, LeadFormResponse, LeadSubmit, LeadResponse, EmailSettingsUpdate
from app.services.email_service import email_service

router = APIRouter()

@router.post("/forms", response_model=LeadFormResponse)
def create_lead_form(form: LeadFormCreate, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    # Simple check for existing form for this bot
    existing = db.query(LeadFormDB).filter(LeadFormDB.bot_id == form.bot_id, LeadFormDB.tenant_id == tenant_id).first()
    if existing:
        existing.title = form.title
        existing.fields = json.dumps([f.dict() for f in form.fields])
        db.commit()
        db.refresh(existing)
        res = existing
    else:
        new_form = LeadFormDB(
            tenant_id=tenant_id,
            bot_id=form.bot_id,
            title=form.title,
            fields=json.dumps([f.dict() for f in form.fields])
        )
        db.add(new_form)
        db.commit()
        db.refresh(new_form)
        res = new_form
    
    logger.info("lead_form_saved", extra={
        "form_id": res.id, "bot_id": res.bot_id, "tenant_id": res.tenant_id,
        "field_count": len(form.fields), "is_update": existing is not None
    })

    return {
        "id": res.id,
        "bot_id": res.bot_id,
        "tenant_id": res.tenant_id,
        "title": res.title,
        "fields": json.loads(res.fields),
        "is_active": res.is_active
    }

@router.get("/forms/{bot_id}", response_model=Optional[LeadFormResponse])
def get_bot_lead_form(bot_id: int, db: Session = Depends(get_db)):
    # Publicly accessible for the widget
    form = db.query(LeadFormDB).filter(LeadFormDB.bot_id == bot_id, LeadFormDB.is_active == True).first()
    if not form:
        return None
    
    return {
        "id": form.id,
        "bot_id": form.bot_id,
        "tenant_id": form.tenant_id,
        "title": form.title,
        "fields": json.loads(form.fields),
        "is_active": form.is_active
    }

@router.post("/submit", response_model=LeadResponse)
def submit_lead(submission: LeadSubmit, db: Session = Depends(get_db)):
    # 1. Find the tenant for this bot
    from app.models.bot import Bot
    bot = db.query(Bot).filter(Bot.id == submission.bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    tenant_id = bot.tenant_id
    
    # 2. Save the lead
    new_lead = LeadDB(
        tenant_id=tenant_id,
        bot_id=submission.bot_id,
        conversation_id=submission.conversation_id,
        data=json.dumps(submission.data),
        country=submission.country,
        source=submission.source
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    
    # 3. Trigger Email Notification (Pro/Enterprise logic can go here)
    email_service.notify_new_lead(db, tenant_id, submission.data)

    logger.info("lead_submitted", extra={
        "lead_id": new_lead.id, "bot_id": submission.bot_id,
        "tenant_id": tenant_id, "country": submission.country,
        "source": submission.source
    })

    return {
        "id": new_lead.id,
        "data": json.loads(new_lead.data),
        "country": new_lead.country,
        "source": new_lead.source,
        "created_at": new_lead.created_at
    }

@router.get("/leads", response_model=List[LeadResponse])
def get_leads(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    leads = db.query(LeadDB).filter(LeadDB.tenant_id == tenant_id).order_by(LeadDB.created_at.desc()).all()
    results = []
    for l in leads:
        results.append({
            "id": l.id,
            "data": json.loads(l.data),
            "country": l.country,
            "source": l.source,
            "created_at": l.created_at
        })
    return results

@router.post("/email-settings")
def update_email_settings(settings: EmailSettingsUpdate, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    db_settings = db.query(EmailSettingsDB).filter(EmailSettingsDB.tenant_id == tenant_id).first()
    if not db_settings:
        db_settings = EmailSettingsDB(tenant_id=tenant_id)
        db.add(db_settings)
    
    for key, value in settings.dict().items():
        setattr(db_settings, key, value)
    
    db.commit()
    logger.info("email_settings_updated", extra={"tenant_id": tenant_id})
    return {"ok": True}

@router.get("/email-settings")
def get_email_settings(db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    settings = db.query(EmailSettingsDB).filter(EmailSettingsDB.tenant_id == tenant_id).first()
    if not settings:
        return {
            "smtp_host": "",
            "smtp_port": 587,
            "smtp_user": "",
            "smtp_pass": "",
            "sender_email": "",
            "is_enabled": False
        }
    return settings
