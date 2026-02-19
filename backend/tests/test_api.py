"""
Comprehensive API tests for TangentCloud AI Bots Backend.
Tests cover: Dashboard CRUD, Analytics, Leads, Flows, FAQs, Settings, and Health.
"""
import json
import pytest


TENANT_A = {"X-API-Key": "tenant_alpha_001"}
TENANT_B = {"X-API-Key": "tenant_beta_002"}

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def _create_bot(client, name="Test Bot", headers=None, **extra):
    headers = headers or TENANT_A
    payload = {
        "name": name,
        "description": f"Description for {name}",
        "prompt_template": "You are a helpful assistant.",
        "welcome_message": f"Hello from {name}!",
        "primary_color": "#2563eb",
        **extra,
    }
    return client.post("/api/v1/dashboard/", json=payload, headers=headers)


def _create_lead_form(client, bot_id, headers=None):
    headers = headers or TENANT_A
    return client.post("/api/v1/leads/forms", json={
        "bot_id": bot_id,
        "title": "Contact Us",
        "fields": [
            {"name": "full_name", "label": "Full Name", "type": "text", "required": True},
            {"name": "email", "label": "Email", "type": "email", "required": True},
        ]
    }, headers=headers)


# ─────────────────────────────────────────────
# 1. ROOT & HEALTH
# ─────────────────────────────────────────────

class TestHealth:
    def test_root_returns_welcome(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert "Welcome to" in resp.json()["message"]


# ─────────────────────────────────────────────
# 2. BOT CRUD (Dashboard)
# ─────────────────────────────────────────────

class TestBotCRUD:
    def test_create_bot(self, client):
        resp = _create_bot(client, "Support Sarah")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Support Sarah"
        assert data["tenant_id"] == "tenant_alpha_001"
        assert "id" in data

    def test_create_bot_with_avatar(self, client):
        resp = _create_bot(client, "Avatar Bot", avatar_url="https://example.com/avatar.png")
        assert resp.status_code == 200
        assert resp.json()["avatar_url"] == "https://example.com/avatar.png"

    def test_list_bots_returns_only_own_tenant(self, client):
        _create_bot(client, "Alpha Bot", headers=TENANT_A)
        _create_bot(client, "Beta Bot", headers=TENANT_B)

        resp_a = client.get("/api/v1/dashboard/", headers=TENANT_A)
        resp_b = client.get("/api/v1/dashboard/", headers=TENANT_B)

        assert resp_a.status_code == 200
        assert resp_b.status_code == 200
        names_a = [b["name"] for b in resp_a.json()]
        names_b = [b["name"] for b in resp_b.json()]
        assert "Alpha Bot" in names_a
        assert "Beta Bot" not in names_a
        assert "Beta Bot" in names_b

    def test_get_bot_by_id(self, client):
        create_resp = _create_bot(client, "Fetch Me")
        bot_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/dashboard/{bot_id}", headers=TENANT_A)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Fetch Me"

    def test_get_bot_not_found(self, client):
        resp = client.get("/api/v1/dashboard/9999", headers=TENANT_A)
        assert resp.status_code == 404

    def test_update_bot(self, client):
        create_resp = _create_bot(client, "Old Name")
        bot_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/v1/dashboard/{bot_id}",
            json={"name": "New Name", "primary_color": "#ff0000"},
            headers=TENANT_A,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"
        assert resp.json()["primary_color"] == "#ff0000"

    def test_delete_bot(self, client):
        create_resp = _create_bot(client, "Delete Me")
        bot_id = create_resp.json()["id"]

        resp = client.delete(f"/api/v1/dashboard/{bot_id}", headers=TENANT_A)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

        # Should be gone now
        resp = client.get(f"/api/v1/dashboard/{bot_id}", headers=TENANT_A)
        assert resp.status_code == 404

    def test_cross_tenant_isolation(self, client):
        """Tenant B should NOT be able to read Tenant A's bot."""
        create_resp = _create_bot(client, "Private Bot", headers=TENANT_A)
        bot_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/dashboard/{bot_id}", headers=TENANT_B)
        assert resp.status_code == 404

    def test_public_bot_access(self, client):
        """Public endpoint should return any bot regardless of tenant."""
        create_resp = _create_bot(client, "Public Bot", headers=TENANT_A)
        bot_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/dashboard/public/{bot_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Public Bot"


# ─────────────────────────────────────────────
# 3. FAQ CRUD
# ─────────────────────────────────────────────

class TestFAQCRUD:
    def test_create_faq(self, client):
        bot_resp = _create_bot(client, "FAQ Bot")
        bot_id = bot_resp.json()["id"]

        resp = client.post(f"/api/v1/dashboard/{bot_id}/faqs", json={
            "question": "How do I reset my password?",
            "answer": "Go to Settings > Security > Reset."
        }, headers=TENANT_A)
        assert resp.status_code == 200
        data = resp.json()
        assert data["question"] == "How do I reset my password?"
        assert data["bot_id"] == bot_id

    def test_list_faqs(self, client):
        bot_resp = _create_bot(client, "FAQ Bot 2")
        bot_id = bot_resp.json()["id"]

        client.post(f"/api/v1/dashboard/{bot_id}/faqs", json={
            "question": "Q1?", "answer": "A1"
        }, headers=TENANT_A)
        client.post(f"/api/v1/dashboard/{bot_id}/faqs", json={
            "question": "Q2?", "answer": "A2"
        }, headers=TENANT_A)

        resp = client.get(f"/api/v1/dashboard/{bot_id}/faqs", headers=TENANT_A)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_update_faq(self, client):
        bot_resp = _create_bot(client, "FAQ Bot 3")
        bot_id = bot_resp.json()["id"]

        faq_resp = client.post(f"/api/v1/dashboard/{bot_id}/faqs", json={
            "question": "Old Q?", "answer": "Old A"
        }, headers=TENANT_A)
        faq_id = faq_resp.json()["id"]

        resp = client.put(f"/api/v1/dashboard/{bot_id}/faqs/{faq_id}", json={
            "answer": "Updated A"
        }, headers=TENANT_A)
        assert resp.status_code == 200
        assert resp.json()["answer"] == "Updated A"

    def test_delete_faq(self, client):
        bot_resp = _create_bot(client, "FAQ Bot 4")
        bot_id = bot_resp.json()["id"]

        faq_resp = client.post(f"/api/v1/dashboard/{bot_id}/faqs", json={
            "question": "Delete me?", "answer": "Yes"
        }, headers=TENANT_A)
        faq_id = faq_resp.json()["id"]

        resp = client.delete(f"/api/v1/dashboard/{bot_id}/faqs/{faq_id}", headers=TENANT_A)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ─────────────────────────────────────────────
# 4. FLOWS
# ─────────────────────────────────────────────

class TestFlows:
    def test_create_flow(self, client):
        bot_resp = _create_bot(client, "Flow Bot")
        bot_id = bot_resp.json()["id"]

        flow_data = {
            "name": "Lead Capture",
            "description": "Collects email",
            "flow_data": {
                "nodes": [
                    {"id": "n1", "type": "trigger", "data": {"label": "Start"}},
                    {"id": "n2", "type": "message", "data": {"label": "Intro", "message": "Hello!"}},
                ],
                "edges": [{"id": "e1", "source": "n1", "target": "n2"}],
            },
        }
        resp = client.post(f"/api/v1/flows/{bot_id}/flows", json=flow_data, headers=TENANT_A)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Lead Capture"
        assert data["version"] == 1

    def test_update_flow_bumps_version(self, client):
        bot_resp = _create_bot(client, "Flow Bot 2")
        bot_id = bot_resp.json()["id"]

        create_resp = client.post(f"/api/v1/flows/{bot_id}/flows", json={
            "name": "V1 Flow",
            "flow_data": {"nodes": [], "edges": []},
        }, headers=TENANT_A)
        flow_id = create_resp.json()["id"]

        resp = client.put(f"/api/v1/flows/{bot_id}/flows/{flow_id}", json={
            "name": "V2 Flow",
            "flow_data": {"nodes": [{"id": "n1"}], "edges": []},
        }, headers=TENANT_A)
        assert resp.status_code == 200
        assert resp.json()["version"] == 2

    def test_delete_flow(self, client):
        bot_resp = _create_bot(client, "Flow Bot 3")
        bot_id = bot_resp.json()["id"]

        create_resp = client.post(f"/api/v1/flows/{bot_id}/flows", json={
            "name": "Temp Flow",
            "flow_data": {},
        }, headers=TENANT_A)
        flow_id = create_resp.json()["id"]

        resp = client.delete(f"/api/v1/flows/{bot_id}/flows/{flow_id}", headers=TENANT_A)
        assert resp.status_code == 200


# ─────────────────────────────────────────────
# 5. ANALYTICS
# ─────────────────────────────────────────────

class TestAnalytics:
    def test_summary_returns_zeroes_for_new_tenant(self, client):
        resp = client.get("/api/v1/analytics/summary", headers=TENANT_A)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_leads"] == 0
        assert data["total_conversations"] == 0

    def test_trends_returns_seven_days(self, client):
        resp = client.get("/api/v1/analytics/trends", headers=TENANT_A)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 7  # 7-day window

    def test_bot_performance_returns_per_bot(self, client):
        _create_bot(client, "Perf Bot", headers=TENANT_A)
        resp = client.get("/api/v1/analytics/bot-performance", headers=TENANT_A)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["bot_name"] == "Perf Bot"

    def test_ai_performance(self, client):
        resp = client.get("/api/v1/analytics/ai-performance", headers=TENANT_A)
        assert resp.status_code == 200
        data = resp.json()
        assert "resolution_rate" in data
        assert "csat" in data


# ─────────────────────────────────────────────
# 6. DASHBOARD ANALYTICS SUMMARY
# ─────────────────────────────────────────────

class TestDashboardAnalytics:
    def test_dashboard_analytics_summary(self, client):
        resp = client.get("/api/v1/dashboard/analytics/summary", headers=TENANT_A)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_conversations" in data
        assert "active_bots" in data


# ─────────────────────────────────────────────
# 7. LEADS
# ─────────────────────────────────────────────

class TestLeads:
    def test_create_lead_form(self, client):
        bot_resp = _create_bot(client, "Lead Bot")
        bot_id = bot_resp.json()["id"]

        resp = _create_lead_form(client, bot_id)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Contact Us"
        assert len(data["fields"]) == 2

    def test_get_lead_form_public(self, client):
        bot_resp = _create_bot(client, "Public Lead Bot")
        bot_id = bot_resp.json()["id"]
        _create_lead_form(client, bot_id)

        resp = client.get(f"/api/v1/leads/forms/{bot_id}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Contact Us"

    def test_submit_lead(self, client):
        bot_resp = _create_bot(client, "Submit Bot")
        bot_id = bot_resp.json()["id"]

        # Need a conversation first
        from app.core.database import ConversationDB
        # Create via direct DB or we just pass conv_id=1 and let it handle
        resp = client.post("/api/v1/leads/submit", json={
            "bot_id": bot_id,
            "conversation_id": 1,
            "data": {"full_name": "Elon Musk", "email": "elon@spacex.com"},
            "country": "US",
            "source": "Google Ads"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["data"]["full_name"] == "Elon Musk"
        assert data["country"] == "US"

    def test_get_leads_list(self, client):
        bot_resp = _create_bot(client, "Leads List Bot")
        bot_id = bot_resp.json()["id"]

        # Submit two leads
        for name in ["Alice", "Bob"]:
            client.post("/api/v1/leads/submit", json={
                "bot_id": bot_id,
                "conversation_id": 1,
                "data": {"full_name": name, "email": f"{name.lower()}@example.com"},
            })

        resp = client.get("/api/v1/leads/leads", headers=TENANT_A)
        assert resp.status_code == 200
        assert len(resp.json()) >= 2


# ─────────────────────────────────────────────
# 8. SETTINGS
# ─────────────────────────────────────────────

class TestSettings:
    def test_get_settings_creates_default(self, client):
        resp = client.get("/api/v1/dashboard/settings", headers=TENANT_A)
        assert resp.status_code == 200
        data = resp.json()
        assert data["plan"] == "starter"
        assert data["id"] == "tenant_alpha_001"

    def test_email_settings_default(self, client):
        resp = client.get("/api/v1/leads/email-settings", headers=TENANT_A)
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_enabled"] is False


# ─────────────────────────────────────────────
# 9. CONVERSATIONS
# ─────────────────────────────────────────────

class TestConversations:
    def test_list_conversations_empty(self, client):
        resp = client.get("/api/v1/dashboard/conversations", headers=TENANT_A)
        assert resp.status_code == 200
        assert resp.json() == []
