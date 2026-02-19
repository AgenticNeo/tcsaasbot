import stripe
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.database import TenantDB
import logging

settings = get_settings()
stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "sk_test_mock")

logger = logging.getLogger("TangentCloud")

class BillingService:
    def create_checkout_session(self, db: Session, tenant_id: str, plan: str):
        """
        Creates a Stripe Checkout Session for a tenant to upgrade their plan.
        """
        tenant = db.query(TenantDB).filter(TenantDB.id == tenant_id).first()
        if not tenant:
            raise ValueError("Tenant not found")

        # Map plan internal names to Stripe Price IDs (Usually from env)
        prices = {
            "pro": getattr(settings, "STRIPE_PRICE_PRO_ID", "price_mock_pro"),
            "enterprise": getattr(settings, "STRIPE_PRICE_ENT_ID", "price_mock_ent")
        }

        price_id = prices.get(plan)
        if not price_id:
            raise ValueError(f"Invalid plan: {plan}")

        try:
            # Create/Retrieve Stripe Customer
            if not tenant.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=f"{tenant_id}@customer.com", # In real app, use tenant email
                    metadata={"tenant_id": tenant_id}
                )
                tenant.stripe_customer_id = customer.id
                db.commit()

            session = stripe.checkout.Session.create(
                customer=tenant.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{'price': price_id, 'quantity': 1}],
                mode='subscription',
                success_url=f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/settings?success=true",
                cancel_url=f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/settings?canceled=true",
                metadata={"tenant_id": tenant_id, "plan": plan}
            )
            return session.url
        except Exception as e:
            logger.error(f"Stripe Session Error: {str(e)}")
            raise e

    def handle_webhook(self, db: Session, payload: str, sig_header: str):
        """
        Handles Stripe Webhook events to sync subscription status.
        """
        event = None
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, getattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_mock")
            )
        except Exception as e:
            logger.error(f"Webhook Signature Error: {str(e)}")
            return False

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            tenant_id = session['metadata'].get('tenant_id')
            plan = session['metadata'].get('plan')
            
            if tenant_id and plan:
                tenant = db.query(TenantDB).filter(TenantDB.id == tenant_id).first()
                if tenant:
                    tenant.plan = plan
                    tenant.stripe_subscription_id = session.get('subscription')
                    db.commit()
                    logger.info(f"Tenant {tenant_id} successfully upgraded to {plan}")

        return True

billing_service = BillingService()
