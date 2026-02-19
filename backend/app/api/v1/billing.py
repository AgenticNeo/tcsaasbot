from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.logging import logger
from app.services.billing_service import billing_service
from pydantic import BaseModel

router = APIRouter()

class CheckoutRequest(BaseModel):
    plan: str

@router.post("/checkout")
async def create_checkout(request: CheckoutRequest, db: Session = Depends(get_db), tenant_id: str = Depends(get_current_user_id)):
    try:
        logger.info("checkout_initiated", extra={
            "tenant_id": tenant_id, "plan": request.plan
        })
        url = billing_service.create_checkout_session(db, tenant_id, request.plan)
        logger.info("checkout_session_created", extra={
            "tenant_id": tenant_id, "plan": request.plan
        })
        return {"url": url}
    except Exception as e:
        logger.error("checkout_failed", extra={
            "tenant_id": tenant_id, "plan": request.plan, "error": str(e)
        })
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        logger.warning("webhook_missing_signature")
        raise HTTPException(status_code=400, detail="Missing stripe-signature")
        
    success = billing_service.handle_webhook(db, payload, sig_header)
    if not success:
        logger.error("webhook_handling_failed")
        raise HTTPException(status_code=400, detail="Webhook handling failed")

    logger.info("webhook_processed_successfully")
    return {"status": "success"}

