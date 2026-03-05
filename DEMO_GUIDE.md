# TangentCloud Client Demo Guide

## 🎯 Demo Overview
This comprehensive demo showcases all TangentCloud platform features through an interactive walkthrough of the **TangentCloud Assistant** bot.

**Access:** http://localhost:9101
**Demo Bot:** TangentCloud Assistant

---

## 📊 Demo Features Configured

### 1. **Assistant Configuration** ✅
The welcome message and bot settings are pre-configured:
- Welcome Message: "Welcome to TangentCloud. Ask me anything."
- Primary Color: Blue (#2563eb)
- Description: Comprehensive demo showcasing all TangentCloud features

**How to Show:**
1. Click on "TangentCloud Assistant" bot card
2. Click "CONFIGURE" button
3. Open "Assistant Configuration" tab (default tab)
4. Show the welcome message, color customization
5. Mention: "This is where clients customize their bot's personality"

---

### 2. **Live Chat Management** 💬
Pre-loaded with 6 realistic demo conversations showcasing:
- Support Request with Agent Escalation
- Sales Lead Qualification
- Feature Inquiry with Product Demo
- Small Talk & Casual Conversations
- Data Collection & Lead Capture
- Integration Setup Questions

**How to Show:**
1. Click "CONFIGURE" on TangentCloud Assistant
2. Click "Live Chat" tab
3. Show conversation list with different statuses
4. Click into a conversation (e.g., "Support Request with Escalation")
5. Walk through the conversation flow
6. Point out: "Notice how the bot handles escalation to humans"

**Key Points to Highlight:**
- Real-time conversation monitoring
- Status filtering (New, Open, Resolved, Pending)
- Search conversations by keywords
- Agent assignment and routing
- Complete conversation history with timestamps

---

### 3. **Story Builder - Visual Workflows** 📐
Pre-configured with a comprehensive demo flow (11 nodes, 13 connections):

**Flow Structure:**
```
User Starts Chat
     ↓
Welcome Message
     ↓
Feature Interest Question (Quick Replies)
     ↓
Routes to 4 Branches:
  1. Story Builder Explanation
  2. Live Chat Explanation
  3. Lead Collection Explanation
  4. Integrations Explanation
     ↓
Next Steps Message
     ↓
Lead Capture Form Action
     ↓
Thank You Message
```

**How to Show:**
1. Click "CONFIGURE" → "Story Builder" tab
2. Show "Main Demo Flow"
3. Walk through the canvas:
   - **Trigger nodes** (conversation start)
   - **Message nodes** (bot responses)
   - **Question nodes** (quick replies/user choices)
   - **Condition nodes** (routing logic)
   - **Action nodes** (form capture, integrations)
4. Click on nodes to show properties
5. Click "SIMULATION" button to test the flow
6. In simulation, ask "What's story builder?" and follow the flow

**Key Features to Demonstrate:**
- Drag-and-drop visual interface (no code required)
- Multiple node types (trigger, message, question, condition, action)
- Edge connections showing conversation flow
- Conditional routing based on user input
- Real-time simulation/testing
- Node properties panel

---

### 4. **Canned Responses - Quick Replies** 📝
**13 Pre-configured Response Categories:**

#### Greetings (3 responses)
- "hello" → "Hey there! Welcome to TangentCloud..."
- "hi" → "Hi! Great to see you..."
- "hey" → "Hey! Ready to help..."

#### Features (6 responses)
- "story builder" → Explanation of visual workflows
- "live chat" → Explanation of conversation management
- "canned responses" → Pre-written messages feature
- "small talk" → Casual conversation handling
- "data collection" → Lead form capabilities
- "integrations" → External service connections

#### Common Issues (2 responses)
- "not working" → Troubleshooting help
- "error" → Error handling support

#### Closing (2 responses)
- "thanks" → Acknowledgment
- "bye" → Farewell

**How to Show:**
1. Click "CONFIGURE" → "Canned Responses" tab
2. Show the response library organized by category
3. Demonstrate searching for responses
4. Show how to edit or add new responses
5. Point out: "Tags help organize and filter responses"

---

### 5. **Small Talk - Casual Conversation** 🗣️
**8 Pre-configured Conversation Patterns:**

#### Greeting Patterns
- Pattern: `hello|hi|hey`
- Response: "Hello! How can I help you?"

#### Gratitude Patterns
- Pattern: `thank|thanks|appreciate`
- Response: "You're welcome! Happy to help."

#### Farewell Patterns
- Pattern: `bye|goodbye|see you`
- Response: "Bye! Come back soon."

#### General Patterns
- "how are you" → Casual response
- "what can you do" → Feature overview

**How to Show:**
1. Click "CONFIGURE" → "Small Talk" tab
2. Show regex patterns for matching
3. Demonstrate response variations
4. Run simulation and trigger small talk (say "hello" or "thanks")
5. Explain: "Small talk makes bots feel more natural and human-like"

---

### 6. **Data Collection - Lead Forms** 📋
**Pre-configured Lead Capture Form:**

**Form Fields (5 fields):**
1. **Full Name** (text, required)
   - Placeholder: "John Doe"
   
2. **Work Email** (email, required)
   - Placeholder: "you@company.com"
   
3. **Company Name** (text, required)
   - Placeholder: "Acme Corp"
   
4. **Team Size** (dropdown, optional)
   - Options: 1-10, 11-50, 51-200, 200+
   
5. **Primary Use Case** (dropdown, required)
   - Options: Customer Support, Sales & Lead Generation, Onboarding, Content & Knowledge

**Form Configuration:**
- Title: "Get Started with TangentCloud"
- Description: "Join thousands of companies automating conversations"
- Trigger Message: "I'd love to get you set up!"
- Success Message: "Thanks! We'll be in touch within 24 hours."

**How to Show:**
1. Click "CONFIGURE" → "Data Collection" tab
2. Show the form builder interface
3. Point out: 
   - Field types (text, email, select, etc.)
   - Required vs. optional fields
   - Validation rules
4. Run simulation and trigger the form
5. Walk through filling it out
6. Show: "This is how you capture leads while maintaining conversation flow"

---

### 7. **Integrations - Connect External Services** 🔌
**3 Pre-configured Integration Examples:**

#### 1. **Slack Integration**
- Status: Enabled
- Channel: #tangentcloud-bots
- Purpose: Receive bot conversations in Slack

#### 2. **Custom Webhook**
- Status: Enabled
- Events: message_received, conversation_ended, lead_captured
- Endpoint: https://your-api.com/webhooks/tangentcloud

#### 3. **Zapier Integration**
- Status: Enabled
- Documentation: https://zapier.com/apps/tangentcloud
- Connects to 6000+ apps

**How to Show:**
1. Click "CONFIGURE" → "Integrations" tab
2. Show available integration options
3. Explain each integration:
   - Slack: Real-time alerts and sync
   - Webhooks: Custom API connections
   - Zapier: Automate across thousands of apps
4. Point out: "Integrations are what make TangentCloud flexible and powerful"

---

## 🎬 Full Demo Walkthrough Script

### Opening (1-2 min)
```
"Let me show you TangentCloud, our AI bot platform that helps companies 
automate conversations across support, sales, and onboarding.

This is a fully configured demo bot with all our features active.
I'll walk you through each capability."
```

### Section 1: Welcome & Overview (2-3 min)
1. Click "CONFIGURE" on TangentCloud Assistant
2. Show "Assistant Configuration" tab
3. Explain customization options

### Section 2: Live Chat Demo (3-4 min)
1. Switch to "Live Chat" tab
2. Show conversation list
3. Click into "Support Request with Escalation"
4. Walk through a complete conversation
5. Show: agent escalation, status management, search

### Section 3: Story Builder Demo (4-5 min)
1. Switch to "Story Builder" tab
2. Explain the visual flow
3. Click "SIMULATION" to test the flow
4. Have the client interact with it
5. Show: branching logic, conditional routing

### Section 4: Canned Responses Demo (2-3 min)
1. Switch to "Canned Responses" tab
2. Show the response library
3. Explain organization and tagging

### Section 5: Small Talk Demo (2-3 min)
1. Switch to "Small Talk" tab
2. Show patterns and responses
3. Run simulation, trigger small talk examples

### Section 6: Lead Capture Demo (3-4 min)
1. Switch to "Data Collection" tab
2. Show form builder and fields
3. Run simulation to demonstrate form in action
4. Fill out the form together
5. Show success message

### Section 7: Integrations Demo (2-3 min)
1. Switch to "Integrations" tab
2. Explain Slack, Webhooks, Zapier
3. Show how they connect to client's existing tools

### Closing (2-3 min)
```
"This is TangentCloud - your complete bot platform.

You get:
✅ Beautiful, intuitive interface (no coding required)
✅ Powerful workflows that scale with your needs
✅ Real conversation management with Live Chat
✅ Lead capture that works in natural conversation
✅ Integrations to your favorite tools

Questions?"
```

---

## 🚀 Quick Demo Shortcuts

### To Show Story Builder Flow in Action:
1. Click "SIMULATE" on TangentCloud Assistant
2. Say: "hello"
3. Choose a feature to learn about
4. Complete the journey through the flow

### To Show Lead Capture:
1. In simulation, get to the "Next Steps" message
2. Click the "Capture Lead Info" action
3. Fill out the form fields
4. See the success message

### To Show Canned Response Matching:
1. In simulation, ask: "What is small talk?"
2. The bot will match the canned response
3. Show how this saves time on repetitive questions

---

## 📱 Client Talking Points

### Why TangentCloud?
- **Easy:** Visual builder, no coding
- **Powerful:** Complex workflows and logic
- **Connected:** Integrates with your existing tools
- **Smart:** AI-driven responses and learning
- **Scalable:** Handles thousands of conversations

### Use Cases We Support:
1. **Customer Support** - 24/7 automated support with escalation
2. **Sales & Leads** - Qualify and capture leads in conversation
3. **Onboarding** - Guide new users through setup
4. **Content** - Deliver knowledge and resources smartly

### What Makes Us Different:
- Visual, intuitive workflow builder
- Conversation-first approach (no form fatigue)
- Real-time agent dashboard
- Powerful integrations
- Fast deployment (minutes, not months)

---

## 📞 Call to Action

After the demo:
```
"I'd love to get you set up with a TangentCloud bot customized 
for [their use case].

Let's discuss:
1. Your specific needs
2. Your current workflow
3. How we can integrate with your tools
4. Timeline and next steps

What works for you?"
```

---

## 🎯 Success Metrics to Mention

Tell the client what they could achieve:
- **30-40%** reduction in support response time
- **50-70%** of common questions handled automatically
- **2-5 min** to build a new workflow
- **5-10x** faster setup vs. competitors

---

## 💡 Pro Tips for Delivery

1. **Customize the Demo:**
   - Ask about their main use case (support, sales, onboarding)
   - Focus on the features relevant to them

2. **Let Them Try:**
   - Give them the keyboard for the Story Builder simulation
   - Let them fill out the lead form themselves
   - Make it interactive, not just watching

3. **Handle Objections:**
   - "Too complex?" → Show the visual builder, it's simpler than it looks
   - "How long to set up?" → "Minutes. Watch." (show Story Builder)
   - "Can it integrate?" → Show integrations tab and explain flexibility

4. **Create Urgency:**
   - End with action items
   - Schedule follow-up
   - Offer trial or POC

---

## 📋 Pre-Demo Checklist

- [ ] Applications running (port 9100, 9101, 9102)
- [ ] Dashboard accessible: http://localhost:9101
- [ ] TangentCloud Assistant bot visible
- [ ] All 6 demo conversations loaded
- [ ] Story Builder flow complete
- [ ] Canned responses configured
- [ ] Small talk patterns active
- [ ] Lead form configured
- [ ] Integration examples shown

---

## 🔗 Resources to Share

After demo, share these links:
- **Docs:** https://docs.tangentcloud.io
- **Pricing:** https://tangentcloud.io/pricing
- **Blog:** https://blog.tangentcloud.io
- **Case Studies:** https://tangentcloud.io/customers

---

**Good luck with your demo! 🎉**
