from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

from app.core.config import get_settings

settings = get_settings()

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

connect_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class DocumentDB(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content_snippet = Column(String)
    source = Column(String)
    tenant_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ConversationDB(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True)
    bot_id = Column(Integer, index=True, nullable=True) # Optional for now
    status = Column(String, default="new") # new, open, pending, resolved
    priority = Column(String, default="medium") # low, medium, high
    agent_requested = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    messages = relationship("MessageDB", back_populates="conversation")

class MessageDB(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), index=True)
    sender = Column(String) # 'user' or 'bot'
    text = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    conversation = relationship("ConversationDB", back_populates="messages")

class TenantDB(Base):
    __tablename__ = "tenants"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    plan = Column(String, default="starter") # starter, pro, enterprise
    is_active = Column(Boolean, default=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class TenantUsageDB(Base):
    __tablename__ = "tenant_usage"
    tenant_id = Column(String, primary_key=True, index=True)
    messages_sent = Column(Integer, default=0)
    documents_indexed = Column(Integer, default=0)
    last_reset = Column(DateTime, default=datetime.utcnow)

class LeadFormDB(Base):
    __tablename__ = "lead_forms"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id"), index=True)
    title = Column(String, default="Contact Us")
    fields = Column(String)  # JSON string of field definitions
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LeadDB(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True)
    bot_id = Column(Integer, index=True)
    conversation_id = Column(Integer, index=True)
    data = Column(String)  # JSON string of submitted data
    country = Column(String, nullable=True)
    source = Column(String, default="Direct") # e.g. "Google", "Widget", "Direct"
    created_at = Column(DateTime, default=datetime.utcnow)

class EmailSettingsDB(Base):
    __tablename__ = "email_settings"
    tenant_id = Column(String, primary_key=True, index=True)
    smtp_host = Column(String)
    smtp_port = Column(Integer)
    smtp_user = Column(String)
    smtp_pass = Column(String)
    sender_email = Column(String)
    is_enabled = Column(Boolean, default=False)

def init_db():
    import logging
    db_logger = logging.getLogger("TangentCloud")
    # Import all models here to ensure they are registered with Base metadata
    from app.models.bot import Bot
    Base.metadata.create_all(bind=engine)
    db_logger.info("database_initialized", extra={
        "database_url": SQLALCHEMY_DATABASE_URL.split("///")[-1],
        "tables": list(Base.metadata.tables.keys())
    })

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
