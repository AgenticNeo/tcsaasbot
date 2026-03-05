#!/usr/bin/env python3
"""
Create comprehensive demo conversation examples for Live Chat
Shows realistic support, sales, and feature inquiry conversations
"""

import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, ConversationDB, MessageDB
from app.models.bot import Bot

DEMO_CONVERSATIONS = [
    {
        "title": "Support Request with Escalation",
        "messages": [
            ("user", "Hi, I'm having trouble with the API integration"),
            ("bot", "Hi there! I'd be happy to help with your API integration. Can you tell me what's not working?"),
            ("user", "The webhook isn't firing when conversations end"),
            ("bot", "I see. Let's troubleshoot this step by step:\n\n1️⃣ First, have you verified your webhook URL is correct in Settings?\n2️⃣ Check that you have 'conversation_ended' event enabled\n3️⃣ Look for any error logs in your webhook receiver\n\nWhich step should we focus on?"),
            ("user", "The URL seems right but I'm not sure about the events"),
            ("bot", "Perfect! To enable the 'conversation_ended' event:\n\n✅ Go to Bot Settings > Integrations\n✅ Find your Webhook\n✅ Check 'Conversation Ended' in the events list\n✅ Save\n\nTry that and let me know if webhooks start firing!"),
            ("user", "It's still not working. I think I need to talk to someone"),
            ("bot", "No problem! Let me get a specialist on this. One moment..."),
            ("bot", "I'm connecting you with our API specialist. They'll be with you shortly!")
        ]
    },
    {
        "title": "Sales Lead Qualification",
        "messages": [
            ("user", "Hi! I'm looking for a chatbot solution for my ecommerce store"),
            ("bot", "Awesome! 🚀 You've come to the right place. I'd love to help you find the perfect fit for your ecommerce store.\n\nFirst, how many conversations per month are you handling?"),
            ("user", "About 2000 conversations monthly"),
            ("bot", "That's solid volume! 💪 And what's your main goal with a chatbot?\n\n• 🛍️ Increase sales\n• 💬 Improve customer support\n• 📝 Capture leads\n• 🔧 All of the above"),
            ("user", "All of the above really"),
            ("bot", "Perfect! You're an ideal fit for TangentCloud. We specialize in exactly that.\n\nLet me collect some info so our sales team can give you a personalized demo:"),
            ("bot", "What's your email?"),
            ("user", "john@ecommerce.com"),
            ("bot", "Great! Your company name?"),
            ("user", "Fashion Forward Inc"),
            ("bot", "Perfect! Our team will reach out within 24 hours with a demo tailored to your ecommerce needs. You're going to love what TangentCloud can do! 🎉")
        ]
    },
    {
        "title": "Feature Inquiry with Story Builder Demo",
        "messages": [
            ("user", "Can your platform handle complex conversation flows?"),
            ("bot", "Absolutely! Our Story Builder is designed exactly for that. 🎯\n\nYou can create:\n✅ Multi-step conversation flows\n✅ Conditional branching (if/then logic)\n✅ User input collection\n✅ Dynamic responses based on context\n\nWant me to show you an example?"),
            ("user", "Yes please!"),
            ("bot", "Let me walk you through a typical flow:\n\n1. User enters chat → Welcome message\n2. We ask what they need → User picks an option\n3. Based on their choice:\n   - If 'Support' → AI troubleshooting guide\n   - If 'Sales' → Product features & pricing\n   - If 'Lead' → Capture form\n4. After each path → Offer human escalation\n\nAll no-code! You can build it in minutes."),
            ("user", "This is impressive. What about integrations?"),
            ("bot", "Great question! We integrate with:\n🔗 Slack, Microsoft Teams, Zapier\n🔗 Custom webhooks for your API\n🔗 CRM systems, analytics tools\n\nWould you like to schedule a full feature demo?"),
            ("user", "Yes, let's do it"),
            ("bot", "Fantastic! Just need your email and company name...")
        ]
    },
    {
        "title": "Small Talk & Casual Conversation",
        "messages": [
            ("user", "Hey how's it going?"),
            ("bot", "Hey! Doing great! 😊 Ready to help. What brings you here?"),
            ("user", "Just exploring your platform"),
            ("bot", "Awesome! Happy to show you around. TangentCloud makes building AI bots super easy.\n\nWhat interests you most?\n• How it works\n• Customer stories\n• Pricing\n• Free trial"),
            ("user", "thanks for the help"),
            ("bot", "Absolutely! My pleasure. Feel free to ask anything else. I'm here to help! 💪")
        ]
    },
    {
        "title": "Data Collection & Lead Capture",
        "messages": [
            ("user", "I want to set up a chatbot for leads"),
            ("bot", "Perfect! Lead generation is one of our superpowers. 🎯\n\nOur Data Collection feature lets you:\n✅ Build smart forms in chat\n✅ Capture emails, phone, company info\n✅ Gate content with conditional fields\n✅ Auto-save to your CRM\n\nWant to try capturing info right now?"),
            ("user", "Sure, let's do it"),
            ("bot", "Great! Let me gather a few details (this will be quick):\n\n1. What's your name?"),
            ("user", "Sarah Johnson"),
            ("bot", "Nice to meet you, Sarah! 👋\n\n2. What's your email?"),
            ("user", "sarah@company.com"),
            ("bot", "Got it! And your company?"),
            ("user", "TechCorp"),
            ("bot", "Perfect! 📊 I have all the info I need.\n\nSarah, our team will reach out to you at sarah@company.com within 24 hours. We're excited to help TechCorp with lead generation! 🚀")
        ]
    },
    {
        "title": "Integration Setup Question",
        "messages": [
            ("user", "How do I connect to Slack?"),
            ("bot", "Great question! Slack integration is super straightforward. 🔗\n\nHere's how:\n\n1. Go to Bot Settings > Integrations\n2. Click 'Add Slack Integration'\n3. Authorize TangentCloud to access your Slack workspace\n4. Choose which channel receives bot alerts\n5. Done!\n\nNeed more detail on any step?"),
            ("user", "That's clear, thanks!"),
            ("bot", "Glad I could help! Let me know if you have any other questions. Happy integrating! 🎉")
        ]
    }
]

def create_demo_conversations():
    db = SessionLocal()
    
    try:
        # Get the demo bot
        demo_bot = db.query(Bot).filter(
            Bot.tenant_id == "admin@globalsolutions.com",
            Bot.name == "TangentCloud Assistant"
        ).first()
        
        if not demo_bot:
            print("⚠️  Demo bot not found. Run setup_demo_configuration.py first")
            return
        
        # Create demo conversations
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        for idx, conv_template in enumerate(DEMO_CONVERSATIONS):
            # Create conversation
            conversation = ConversationDB(
                tenant_id=demo_bot.tenant_id,
                bot_id=demo_bot.id,
                status="resolved",
                priority="medium",
                created_at=now - timedelta(days=idx),
                metadata=json.dumps({"type": "demo", "title": conv_template["title"]})
            )
            db.add(conversation)
            db.flush()
            
            # Add messages
            for msg_idx, (sender, text) in enumerate(conv_template["messages"]):
                message = MessageDB(
                    conversation_id=conversation.id,
                    sender=sender,
                    text=text,
                    created_at=conversation.created_at + timedelta(minutes=msg_idx * 2)
                )
                db.add(message)
        
        db.commit()
        
        print("✅ Demo Conversations Created!")
        print("=" * 60)
        print(f"📝 Created {len(DEMO_CONVERSATIONS)} realistic demo conversations:")
        for i, conv in enumerate(DEMO_CONVERSATIONS, 1):
            print(f"  {i}. {conv['title']}")
        print("=" * 60)
        print("\n💬 These conversations are ready to show in Live Chat!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to create demo conversations: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_conversations()
