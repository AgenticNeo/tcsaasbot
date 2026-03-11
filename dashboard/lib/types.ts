export interface Bot {
    id: number;
    tenant_id: string;
    name: string;
    description?: string;
    prompt_template?: string;
    response_mode?: 'knowledge_only' | 'knowledge_plus_reasoning';
    welcome_message?: string;
    primary_color?: string;
    avatar_url?: string;
    position?: string;
    placeholder_text?: string;
    bubble_greeting?: string;
    tools?: string[];
    quick_replies?: Array<{ label: string; value: string }>;
    canned_responses?: Array<{ id: string; title: string; shortcut: string; content: string; category: string; tags: string[]; enabled: boolean }>;
    small_talk_responses?: Array<{ id: string; trigger: string; response: string; variations: string[]; enabled: boolean }>;
    agent_transfer_enabled?: boolean;
    agent_email?: string;
    flow_data?: any;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface AnalyticsSummary {
    total_conversations: number;
    total_messages: number;
    active_bots: number;
    avg_response_time: number;
}

export interface Document {
    id: number;
    title: string;
    source: string;
    created_at: string;
    content_snippet: string;
}

export interface TenantSettings {
    id: string;
    name: string;
    plan: 'starter' | 'pro' | 'enterprise';
    messages_sent: number;
    documents_indexed: number;
    message_limit: number;
    document_limit: number;
    rate_limits?: Record<string, number>;
    rate_limit_summary?: {
        window_hours: number;
        total_throttled_requests: number;
        top_throttled_routes: Array<{ route_key: string; count: number }>;
        upgrade_recommended: boolean;
    };
    support?: {
        email: string;
        url: string;
        message?: string;
    };
}

export interface RateLimitOverview {
    tenant_id: string;
    plan: 'starter' | 'pro' | 'enterprise';
    window_hours: number;
    effective_limits: Record<string, number>;
    total_throttled_requests: number;
    top_throttled_routes: Array<{ route_key: string; count: number }>;
    recent_events: Array<{
        route_key: string;
        request_path: string;
        limit: number;
        retry_after_seconds: number;
        exceeded_at: string | null;
    }>;
    support: {
        email: string;
        url: string;
        message?: string;
    };
}

export interface RateLimitPolicy {
    id: number;
    scope: 'tenant' | 'plan';
    tenant_id: string | null;
    plan: 'starter' | 'pro' | 'enterprise' | null;
    route_key: string;
    rpm_limit: number;
    is_active: boolean;
    created_at?: string | null;
}

export interface RateLimitAlert {
    tenant_id: string;
    tenant_name: string;
    plan: string;
    route_key: string;
    hits: number;
    last_seen: string | null;
    severity: 'medium' | 'high';
    message: string;
    next_action: string;
    support: {
        email: string;
        url: string;
    };
}

export interface RateLimitNotificationSettings {
    tenant_id: string;
    rate_limit_email_enabled: boolean;
    rate_limit_email_recipient: string | null;
    rate_limit_webhook_enabled: boolean;
    rate_limit_webhook_url: string | null;
    rate_limit_min_hits: number;
    rate_limit_window_minutes: number;
    rate_limit_cooldown_minutes: number;
}

export interface RateLimitDeliveryRecord {
    tenant_id: string;
    tenant_name: string;
    plan: string;
    route_key: string;
    channel: 'email' | 'webhook';
    hits: number;
    last_sent_at: string | null;
    recent: boolean;
}

export interface PaginatedRateLimitDeliveries {
    pagination: {
        offset: number;
        limit: number;
        returned: number;
        total: number;
        has_more: boolean;
    };
    filters: {
        tenant_filter?: string | null;
        route_key?: string | null;
        channel?: string | null;
    };
    counts: {
        recent: number;
        email: number;
        webhook: number;
    };
    items: RateLimitDeliveryRecord[];
}

export interface RateLimitAuditRecord {
    id: number;
    tenant_id: string;
    actor_tenant_id: string;
    actor_role: string;
    action: string;
    target_type: string;
    target_id: string | null;
    metadata_json: string;
    created_at: string | null;
}

export interface PaginatedRateLimitAudit {
    pagination: {
        offset: number;
        limit: number;
        returned: number;
        total: number;
        has_more: boolean;
    };
    filters: {
        action?: string | null;
        target_type?: string | null;
    };
    items: RateLimitAuditRecord[];
}

export interface DashboardConversation {
    id: number;
    bot_id?: number | null;
    bot_name?: string | null;
    status: 'new' | 'open' | 'pending' | 'resolved';
    agent_requested: boolean;
    created_at: string;
    last_message?: string | null;
    last_message_sender?: 'user' | 'bot' | 'agent' | null;
    message_count: number;
}
