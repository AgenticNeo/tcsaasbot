#!/usr/bin/env python3
"""
TangentCloud Demo Configuration
Comprehensive showcase of all platform features:
- Live Chat Management
- Story Builder with Visual Flows
- Canned Responses
- Small Talk Patterns
- Data Collection Forms
- Integrations
"""

import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.bot import Bot

def setup_demo_bot():
    """Configure the main demo bot with all features"""
    db = SessionLocal()
    
    try:
        # Get or create the demo bot (TangentCloud Assistant)
        demo_bot = db.query(Bot).filter(
            Bot.tenant_id == "admin@globalsolutions.com",
            Bot.name == "Support Sarah"
        ).first()
        
        if not demo_bot:
            print("Demo bot not found. Creating...")
            demo_bot = Bot(
                tenant_id="admin@globalsolutions.com",
                name="TangentCloud Assistant",
                description="Comprehensive demo showcasing all TangentCloud features",
                welcome_message="Welcome to TangentCloud. Ask me anything.",
                primary_color="#2563eb",
                prompt_template=(
                    "You are the TangentCloud Assistant, a comprehensive AI bot "
                    "demonstrating all platform capabilities. Help users understand "
                    "features like live chat, workflows, canned responses, lead capture, "
                    "and integrations."
                )
            )
            db.add(demo_bot)
            db.flush()
        
        # 1. Configure Canned Responses
        canned_responses = {
            "greetings": [
                {
                    "trigger": "hello",
                    "response": "Hey there! Welcome to TangentCloud. How can I assist you today?",
                    "tags": ["greeting", "welcome"],
                    "enabled": True
                },
                {
                    "trigger": "hi",
                    "response": "Hi! Great to see you. What can I help with?",
                    "tags": ["greeting"],
                    "enabled": True
                },
                {
                    "trigger": "hey",
                    "response": "Hey! Ready to help. What do you need?",
                    "tags": ["greeting"],
                    "enabled": True
                }
            ],
            "features": [
                {
                    "trigger": "story builder",
                    "response": "Story Builder is our visual workflow designer. You can create complex conversation flows with decision trees, conditions, and branching logic—no coding required!",
                    "tags": ["feature", "story-builder"],
                    "enabled": True
                },
                {
                    "trigger": "live chat",
                    "response": "Live Chat lets you monitor conversations in real-time, respond to users, and manage conversation threads seamlessly.",
                    "tags": ["feature", "live-chat"],
                    "enabled": True
                },
                {
                    "trigger": "canned responses",
                    "response": "Canned Responses are pre-written messages you can trigger instantly. Perfect for FAQ, greeting, or common issues.",
                    "tags": ["feature", "canned-responses"],
                    "enabled": True
                },
                {
                    "trigger": "small talk",
                    "response": "Small Talk enables casual conversation. Your bot can respond naturally to greetings, thanks, jokes, and everyday questions.",
                    "tags": ["feature", "small-talk"],
                    "enabled": True
                },
                {
                    "trigger": "data collection",
                    "response": "Data Collection lets you build lead forms directly into chat. Capture emails, phone numbers, company info—whatever you need.",
                    "tags": ["feature", "data-collection"],
                    "enabled": True
                },
                {
                    "trigger": "integrations",
                    "response": "Integrations connect your bot to external services: Slack, Microsoft Teams, Zapier, webhooks, and more.",
                    "tags": ["feature", "integrations"],
                    "enabled": True
                }
            ],
            "common_issues": [
                {
                    "trigger": "not working",
                    "response": "Can you tell me more? Is it a specific feature or a general issue? I can help troubleshoot.",
                    "tags": ["support"],
                    "enabled": True
                },
                {
                    "trigger": "error",
                    "response": "Sorry to hear that! Can you share the error message? That'll help me understand what happened.",
                    "tags": ["support"],
                    "enabled": True
                }
            ],
            "closing": [
                {
                    "trigger": "thanks",
                    "response": "My pleasure! Feel free to ask anything else.",
                    "tags": ["closing"],
                    "enabled": True
                },
                {
                    "trigger": "bye",
                    "response": "Goodbye! Always happy to help. Come back anytime!",
                    "tags": ["closing"],
                    "enabled": True
                }
            ]
        }
        
        # 2. Configure Small Talk Patterns
        small_talk_patterns = {
            "greetings": [
                {"pattern": r"hello|hi|hey", "response": "Hello! How can I help you?", "enabled": True},
                {"pattern": r"good morning|good evening", "response": "Good to see you! What brings you here?", "enabled": True}
            ],
            "gratitude": [
                {"pattern": r"thank|thanks|appreciate", "response": "You're welcome! Happy to help.", "enabled": True},
                {"pattern": r"thank you", "response": "My pleasure! Anything else?", "enabled": True}
            ],
            "farewells": [
                {"pattern": r"bye|goodbye|see you", "response": "Bye! Come back soon.", "enabled": True},
                {"pattern": r"talk soon", "response": "Looking forward to it!", "enabled": True}
            ],
            "general": [
                {"pattern": r"how are you|what's up", "response": "Doing great, ready to help! How about you?", "enabled": True},
                {"pattern": r"what can you do", "response": "I can help with support, features, setup, and integrations. What interests you?", "enabled": True}
            ]
        }
        
        # 3. Configure Data Collection Form
        lead_form_config = {
            "title": "Get Started with TangentCloud",
            "description": "Join thousands of companies automating conversations",
            "trigger_message": "I'd love to get you set up! Can I collect a few details?",
            "fields": [
                {
                    "id": "full_name",
                    "label": "Full Name",
                    "type": "text",
                    "required": True,
                    "placeholder": "John Doe"
                },
                {
                    "id": "work_email",
                    "label": "Work Email",
                    "type": "email",
                    "required": True,
                    "placeholder": "you@company.com"
                },
                {
                    "id": "company",
                    "label": "Company Name",
                    "type": "text",
                    "required": True,
                    "placeholder": "Acme Corp"
                },
                {
                    "id": "team_size",
                    "label": "Team Size",
                    "type": "select",
                    "required": False,
                    "options": [
                        {"label": "1-10", "value": "1-10"},
                        {"label": "11-50", "value": "11-50"},
                        {"label": "51-200", "value": "51-200"},
                        {"label": "200+", "value": "200+"}
                    ]
                },
                {
                    "id": "use_case",
                    "label": "Primary Use Case",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"label": "Customer Support", "value": "support"},
                        {"label": "Sales & Lead Generation", "value": "sales"},
                        {"label": "Onboarding", "value": "onboarding"},
                        {"label": "Content & Knowledge", "value": "content"}
                    ]
                }
            ],
            "success_message": "Thanks! We'll be in touch within 24 hours."
        }
        
        # 4. Configure Story Builder Flows
        story_flow = {
            "name": "Main Demo Flow",
            "description": "Comprehensive demo showcasing all TangentCloud features",
            "nodes": [
                {
                    "id": "trigger-1",
                    "type": "trigger",
                    "data": {
                        "label": "User starts chat",
                        "trigger_type": "conversation_start"
                    },
                    "position": {"x": 200, "y": 0}
                },
                {
                    "id": "msg-welcome",
                    "type": "message",
                    "data": {
                        "label": "Welcome Message",
                        "message": "Welcome to TangentCloud! 👋 I'm here to show you how our AI bot platform works. What interests you most?\n\n• Story Builder (Workflows)\n• Live Chat\n• Lead Capture\n• Integrations"
                    },
                    "position": {"x": 200, "y": 100}
                },
                {
                    "id": "question-feature",
                    "type": "question",
                    "data": {
                        "label": "Feature Interest",
                        "question": "What feature would you like to explore?",
                        "quick_replies": [
                            {"label": "Story Builder", "value": "story_builder"},
                            {"label": "Live Chat", "value": "live_chat"},
                            {"label": "Lead Forms", "value": "lead_forms"},
                            {"label": "Integrations", "value": "integrations"}
                        ]
                    },
                    "position": {"x": 200, "y": 200}
                },
                {
                    "id": "condition-route",
                    "type": "condition",
                    "data": {
                        "label": "Route to Feature",
                        "condition_type": "variable_match",
                        "variable": "feature_choice"
                    },
                    "position": {"x": 200, "y": 350}
                },
                # Story Builder Branch
                {
                    "id": "msg-story-builder",
                    "type": "message",
                    "data": {
                        "label": "Story Builder Explained",
                        "message": "✨ Story Builder: Visual Conversation Design\n\nWith Story Builder, you can:\n✅ Create complex workflows without code\n✅ Build decision trees and branching logic\n✅ Integrate AI responses with conditions\n✅ Test flows in real-time\n✅ Track user paths through conversations\n\nWant to see a demo flow?"
                    },
                    "position": {"x": 500, "y": 400}
                },
                # Live Chat Branch
                {
                    "id": "msg-live-chat",
                    "type": "message",
                    "data": {
                        "label": "Live Chat Explained",
                        "message": "💬 Live Chat: Real-time Conversation Management\n\nFeatures include:\n✅ Monitor all conversations in one dashboard\n✅ Switch between bot and human responses\n✅ View conversation history and context\n✅ Tag and filter conversations\n✅ Agent assignment and routing\n✅ Real-time notifications\n\nPerfect for human handoff!"
                    },
                    "position": {"x": -100, "y": 400}
                },
                # Lead Forms Branch
                {
                    "id": "msg-lead-forms",
                    "type": "message",
                    "data": {
                        "label": "Lead Collection Explained",
                        "message": "📝 Data Collection: Capture Leads in Chat\n\nBuild intelligent forms:\n✅ Conditional field display\n✅ Email, phone, text, dropdown fields\n✅ Required/optional validation\n✅ Auto-save to CRM or database\n✅ Trigger follow-up actions\n\nNo form fatigue—conversation feels natural!"
                    },
                    "position": {"x": 800, "y": 400}
                },
                # Integrations Branch
                {
                    "id": "msg-integrations",
                    "type": "message",
                    "data": {
                        "label": "Integrations Explained",
                        "message": "🔌 Integrations: Connect to Your Tools\n\nSupported platforms:\n✅ Slack & Microsoft Teams\n✅ Zapier & Make\n✅ Custom Webhooks\n✅ CRM Systems\n✅ Analytics Platforms\n✅ Email Services\n\nSync data and automate workflows!"
                    },
                    "position": {"x": 1100, "y": 400}
                },
                {
                    "id": "msg-next",
                    "type": "message",
                    "data": {
                        "label": "Next Steps",
                        "message": "Ready to get started? Let's capture your information so our team can reach out with a personalized demo!"
                    },
                    "position": {"x": 200, "y": 550}
                },
                {
                    "id": "action-lead-capture",
                    "type": "action",
                    "data": {
                        "label": "Capture Lead Info",
                        "action_type": "show_form",
                        "form_id": "lead-form"
                    },
                    "position": {"x": 200, "y": 650}
                },
                {
                    "id": "msg-thank-you",
                    "type": "message",
                    "data": {
                        "label": "Thank You",
                        "message": "🎉 Perfect! Thanks for the info. Our team will reach out within 24 hours with a personalized demo.\n\nIn the meantime, check out our docs: https://docs.tangentcloud.io"
                    },
                    "position": {"x": 200, "y": 750}
                }
            ],
            "edges": [
                {"id": "e1", "source": "trigger-1", "target": "msg-welcome"},
                {"id": "e2", "source": "msg-welcome", "target": "question-feature"},
                {"id": "e3", "source": "question-feature", "target": "condition-route"},
                {"id": "e4", "source": "condition-route", "target": "msg-story-builder", "label": "Story Builder"},
                {"id": "e5", "source": "condition-route", "target": "msg-live-chat", "label": "Live Chat"},
                {"id": "e6", "source": "condition-route", "target": "msg-lead-forms", "label": "Lead Forms"},
                {"id": "e7", "source": "condition-route", "target": "msg-integrations", "label": "Integrations"},
                {"id": "e8", "source": "msg-story-builder", "target": "msg-next"},
                {"id": "e9", "source": "msg-live-chat", "target": "msg-next"},
                {"id": "e10", "source": "msg-lead-forms", "target": "msg-next"},
                {"id": "e11", "source": "msg-integrations", "target": "msg-next"},
                {"id": "e12", "source": "msg-next", "target": "action-lead-capture"},
                {"id": "e13", "source": "action-lead-capture", "target": "msg-thank-you"}
            ]
        }
        
        # 5. Configure Integrations
        integrations_config = {
            "slack": {
                "enabled": True,
                "name": "Slack Integration",
                "description": "Receive bot conversations in a Slack channel",
                "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
                "channel": "#tangentcloud-bots"
            },
            "webhook": {
                "enabled": True,
                "name": "Custom Webhook",
                "description": "Send conversation data to your backend",
                "events": ["message_received", "conversation_ended", "lead_captured"],
                "endpoint": "https://your-api.com/webhooks/tangentcloud"
            },
            "zapier": {
                "enabled": True,
                "name": "Zapier Integration",
                "description": "Automate workflows across 6000+ apps",
                "documentation": "https://zapier.com/apps/tangentcloud"
            }
        }
        
        # Store configurations in bot metadata
        demo_bot.canned_responses = json.dumps(canned_responses)
        demo_bot.small_talk_config = json.dumps(small_talk_patterns)
        demo_bot.lead_form_config = json.dumps(lead_form_config)
        demo_bot.story_flow = json.dumps(story_flow)
        demo_bot.integrations = json.dumps(integrations_config)
        
        db.commit()
        
        print("✅ Demo Bot Configuration Complete!")
        print("=" * 60)
        print("📊 Configured Features:")
        print(f"  ✓ Canned Responses: {sum(len(v) for v in canned_responses.values())} responses")
        print(f"  ✓ Small Talk: {sum(len(v) for v in small_talk_patterns.values())} patterns")
        print(f"  ✓ Lead Form: {len(lead_form_config['fields'])} fields")
        print(f"  ✓ Story Flow: {len(story_flow['nodes'])} nodes, {len(story_flow['edges'])} connections")
        print(f"  ✓ Integrations: {len(integrations_config)} platforms")
        print("=" * 60)
        print("\n🎯 Ready for client demo!")
        print("📍 Access at: http://localhost:9101")
        print("🤖 Click SIMULATE on 'TangentCloud Assistant' bot\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Configuration failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    setup_demo_bot()
