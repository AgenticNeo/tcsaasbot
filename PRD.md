# Product Requirements Document (PRD): TangentCloud AI Bots

**Version:** 1.1
**Date:** 2026-02-16
**Status:** Draft
**Author:** Product Manager (Antigravity)

---

## 1. Executive Summary

**Product Name:** TangentCloud AI Bots
**Vision:** To democratize access to **Agentic AI** workforce, transitioning from passive "chatbots" to active "AI employees" that solve problems, execute tasks, and drive revenue.
**Mission:** Build the world's most intuitive yet powerful AI Agent platform that empowers businesses to automate complex workflows without writing code, while providing developers the flexibility to extend capabilities infinitely.

## 2. Problem Statement

The current chatbot market is saturated with two types of products:
1.  **Simple Rule-Based Bots:** Rigid, frustrating for users, and unable to handle nuance.
2.  **Generic LLM Wrappers:** Good at conversation but prone to hallucinations and unable to take deep, secure actions within business systems.
3.  **High-Cost Enterprise Solutions:** Complex to set up, requiring expensive consultancy.

**The Opportunity:** There is a gap for a "Smart Agent" platform that combines the reliability of structured flows with the flexibility of LLMs and the *action-taking* capability of agents, all wrapped in a premium, easy-to-use SaaS interface.

## 3. Target Audience

*   **Primary:** SMBs and Mid-Market companies in E-commerce, SaaS, and Service industries.
    *   *Persona:* "Growth Gary" - Marketing Manager who wants to automate lead qualification without asking IT.
*   **Secondary:** Enterprise Customer Support Teams.
    *   *Persona:* "Support Sarah" - VP of Support who needs to deflect 40% of L1 tickets and ensure seamless handover to humans.
*   **Tertiary:** Developers/Agencies.
    *   *Persona:* "Dev Dan" - Freelancer building custom bots for clients who wants to inject custom Python/JS code into flows.

## 4. Product Goals

### Business Goals
*   **Profitability:** Achieve $10k MRR within 6 months of MVP launch through a high-value tiered subscription model.
*   **Retention:** Maintain <5% churn by deeply integrating into user workflows (making the bot indispensable).
*   **Differentiation:** Position as the "Action-First" AI platform, not just a "Chat" platform.

### User Goals
*   **Time to Value:** User should have a working, trained bot embedded on their site within 5 minutes of signup.
*   **Success Rate:** Support automation rate of >50% (bot resolves issue without human).

## 5. Key Features & Innovation

### 5.1 Core Foundation (MVP)
*   **Visual Flow Builder 2.0:** A canvas-based drag-and-drop editor. deeply integrated with Generative AI (Type a prompt to generate a flow).
*   **Unified Inbox:** A single dashboard for managing chats from Web, WhatsApp, Messenger, and Email.
*   **Live Handover:** Seamless transition to human agents with full context summary.
*   **Knowledge Base Parsing:** One-click ingestion of Website URL, PDF, and Notion docs to train the bot.

### 5.2 The "Innovation" (Differentiators)
*   **Action Agents (Tool Use):**
    *   Bot doesn't just say "Here is a link to return"; it says "I have processed your return, the label has been emailed."
    *   Native integrations with Stripe, Shopify, Salesforce, HubSpot.
    *   "Action Nodes" in the visual builder: [Get Order Status], [Update CRM], [Book Meeting].
*   **Recursive Self-Improvement:**
    *   The system automatically analyzes dropped conversations and successful resolutions.
    *   *Feature:* "Daily Insights" - The bot suggests new questions it should learn based on yesterday's unidentified queries.
*   **Multi-Modal Native:**
    *   Users can upload screenshots of errors; the bot analyzes the image to troubleshoot.
    *   Voice-enabled for mobile users (Speech-to-Text-to-Action).
*   **Hybrid Code/No-Code:**
    *   "Code Blocks" in the flow builder allow devs to write Serverless Functions (Python/Node.js) directly in the browser for custom logic.

## 6. Architecture & Tech Stack

**Architecture Pattern:** Microservices with Event-Driven Design.

*   **Web Dashboard (The "SaaS" Layer):**
    *   **Framework:** **Next.js** (React).
    *   **Role:** This is **mandatory** for the Admin Panel where customers sign up, pay, and use the **Visual Flow Builder** (drag-and-drop).
    *   *Why?* React Native is great for apps, but building a complex drag-and-drop editor on it is inefficient. Next.js ensures fast SEO for your landing page and a robust admin experience.
*   **Mobile App:**
    *   **Framework:** **React Native** (Expo).
    *   **Role:** For your customers (business owners) to reply to chats on the go, and for the "Chat SDK" embedded in mobile apps.
*   **Backend:**
    *   **API:** **FastAPI** (Python). High-performance, async, and native support for AI libraries.
*   **Data Layer:**
    *   **Primary Database:** **MySQL**. (User profiles, billing, structured bot flows, analytics).
        *   *Why?* Reliable, structured, and perfect for relational data in a SaaS.
    *   **Caching & Queues:** **Redis**.
        *   *Why?* Handling real-time chat sessions (WebSocket pub/sub), rate limiting, and background tasks (like scraping websites).
    *   **AI Memory:** **ChromaDB** or **Pinecone** (Vector Database for RAG).
*   **Infrastructure:**
    *   **Containerization:** Docker.
    *   **Orchestration:** Kubernetes (K8s) or Docker Swarm.

## 7. Monetization Strategy (Profitable)

**Pricing Model:** Tiered Subscription + Usage-Based Overages.

1.  **Starter ($49/mo):**
    *   2,000 chats/mo.
    *   1 Website.
    *   Basic AI Knowledge Base.
    *   Standard Template Library.
2.  **Growth ($149/mo) - *Target Tier*:**
    *   10,000 chats/mo.
    *   Action Agents (Shopify/HubSpot integrations).
    *   Remove Branding.
    *   3 Team Seats.
3.  **Pro / Agency ($399/mo):**
    *   Unlimited chats (fair use).
    *   White-labeling (Sell to your clients).
    *   API Access.
    *   Code Blocks (Serverless functions).
4.  **Enterprise (Custom):**
    *   On-premise deployment option.
    *   Dedicated SLA.
    *   Fine-tuned models.

## 8. User Flow (Onboarding)

1.  **Landing Page:** "Build an AI Employee, not just a Chatbot." -> [Start for Free].
2.  **Magic Scrape:** User enters their website URL. System scrapes it in background while user registers.
3.  **Instant Demo:** Dashboard opens with a "Test Bot" already trained on their website content. user is "Wowed".
4.  **Customization:** User changes color/logo to match brand.
5.  **Integration:** User copies 1-line JS snippet to their existing site or connects Shopify.
6.  **Value Realization:** First dashboard view shows "10 Conversations Handled, 2 Leads Captured".

## 9. Roadmap

### Phase 1: MVP (Months 1-2)
*   Core functionality: Auth, Chat Widget, Basic Flow Builder.
*   RAG Integration (Chat with PDF/URL).
*   Live Chat Dashboard.

### Phase 2: Action Era (Months 3-4)
*   Integrations: Shopify, Stripe, Calendly.
*   "Action Nodes" in builder.
*   Payment processing inside chat.

### Phase 3: Intelligence & Scale (Months 5-6)
*   Voice support.
*   Mobile App for Agents.
*   Self-optimizing loops.
*   Agency White-labeling features.

## 10. Non-Functional Requirements
*   **Security:** SOC2 Compliance readiness, Data Encryption at rest/transit.
*   **Scalability:** Horizontal scaling for handling spike traffic (Black Friday).
*   **Reliability:** 99.9% Uptime SLA.
*   **Latency:** AI response time < 2 seconds.
