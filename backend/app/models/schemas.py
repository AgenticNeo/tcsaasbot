from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class BotBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    prompt_template: Optional[str] = "You are a helpful assistant."
    welcome_message: Optional[str] = "Hi! How can I help you today?"
    primary_color: Optional[str] = "#2563eb"
    avatar_url: Optional[str] = None
    position: Optional[str] = "right"
    placeholder_text: Optional[str] = "Type a message..."
    bubble_greeting: Optional[str] = None
    tools: Optional[List[str]] = []
    quick_replies: Optional[List[Dict[str, Any]]] = []
    canned_responses: Optional[List[Dict[str, Any]]] = []
    small_talk_responses: Optional[Any] = []
    agent_transfer_enabled: Optional[bool] = False
    agent_email: Optional[str] = None
    flow_data: Optional[Dict[str, Any]] = {}

class BotCreate(BotBase):
    pass

class BotUpdate(BotBase):
    name: Optional[str] = None
    description: Optional[str] = None
    prompt_template: Optional[str] = None
    welcome_message: Optional[str] = None
    primary_color: Optional[str] = None
    avatar_url: Optional[str] = None
    position: Optional[str] = None
    placeholder_text: Optional[str] = None
    bubble_greeting: Optional[str] = None
    is_active: Optional[bool] = None
    tools: Optional[List[str]] = None
    quick_replies: Optional[List[Dict[str, Any]]] = None
    canned_responses: Optional[List[Dict[str, Any]]] = None
    small_talk_responses: Optional[List[Dict[str, Any]]] = None
    agent_transfer_enabled: Optional[bool] = None
    agent_email: Optional[str] = None
    flow_data: Optional[Dict[str, Any]] = None

class BotResponse(BotBase):
    id: int
    tenant_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class AnalyticsSummary(BaseModel):
    total_conversations: int
    total_messages: int
    active_bots: int
    avg_response_time: float

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    text: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    bot_id: Optional[int]
    bot_name: Optional[str] = "Deleted Bot"
    created_at: datetime
    last_message: Optional[str] = ""
    message_count: int = 0
    
    class Config:
        from_attributes = True

class TenantSettings(BaseModel):
    id: str
    name: Optional[str]
    plan: str
    messages_sent: int
    documents_indexed: int
    message_limit: int
    document_limit: int

class UsageUpdate(BaseModel):
    messages_sent: int
    documents_indexed: int

class LeadFormField(BaseModel):
    name: str
    label: str
    type: str  # text, email, tel, textarea
    required: bool = True

class LeadFormCreate(BaseModel):
    bot_id: int
    title: str = "Contact Us"
    fields: List[LeadFormField]

class LeadFormResponse(LeadFormCreate):
    id: int
    tenant_id: str
    is_active: bool

class LeadSubmit(BaseModel):
    bot_id: int
    conversation_id: int
    data: Dict[str, Any]
    country: Optional[str] = None
    source: Optional[str] = "Direct"

class LeadResponse(BaseModel):
    id: int
    data: Dict[str, Any]
    country: Optional[str] = None
    source: Optional[str] = "Direct"
    created_at: datetime

class EmailSettingsUpdate(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_pass: str
    sender_email: str
    is_enabled: bool
class FAQBase(BaseModel):
    question: str
    answer: str
    keywords: Optional[List[str]] = []
    category: Optional[str] = "General"
    is_active: Optional[bool] = True

class FAQCreate(FAQBase):
    pass

class FAQUpdate(FAQBase):
    question: Optional[str] = None
    answer: Optional[str] = None
    is_active: Optional[bool] = None

class FAQResponse(FAQBase):
    id: int
    bot_id: int
    usage_count: int
    success_rate: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
