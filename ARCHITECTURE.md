# System Architecture Documentation

## 1. Overview
TangentCloud AI Bots is a multi-tenant Chatbot-as-a-Service (CaaS) platform. It allows businesses (tenants) to create custom AI agents trained on their specific data (PDFs, Web Scraping, Manual Text) and deploy them via web widgets or mobile apps.

## 2. Global Architecture
The system follows a classic **3-Tier Architecture** with a decoupled Frontend, API, and Data Layer.

- **Client Layer**: Next.js Dashboard (Web), React Native (Mobile), Embedded JS Widget.
- **API Layer**: FastAPI (Async Python) utilizing Pydantic for strict schema validation.
- **Data Layer**: 
    - **Relational**: SQL (PostgreSQL/MySQL ready) for transactional data (Bots, Logs, Users).
    - **Vector**: ChromaDB for semantic knowledge indexing.
    - **Cache**: Redis for session state and rate limiting (planned).

## 3. Multi-Tenancy Engine (Security & Isolation)
The core design principle is **Logical Isolation** at the application level.

### 3.1 Authentication & Authorization
- Every request must include an `X-API-Key` or Session Token.
- A custom FastAPI Dependency `get_current_user_id` extracts and validates the `tenant_id`.

### 3.2 Data Isolation
- **Relational Data**: Every table (e.g., `bots`, `conversations`) contains a `tenant_id` column indexed for performance. All SQL queries are scoped: `WHERE tenant_id = :tenant_id`.
- **Vector Data**: We utilize **ChromaDB Collections**. Each tenant has their own isolated collection named after their `tenant_id`. This prevents cross-tenant semantic pollution.

## 4. RAG Pipeline (Knowledge Retrieval)
The RAG (Retrieval-Augmented Generation) pipeline is designed for high accuracy and context preservation.

1.  **Ingestion**:
    - Supports Recursive Web Scraping (Domain-locked).
    - Document Chunking using `RecursiveCharacterTextSplitter` with intelligent overlap.
    - Embeddings: `text-embedding-3-small` for a balance of cost and performance.
2.  **Retrieval**:
    - **History-Aware**: We use a reformulator LLM chain that converts follow-up questions into standalone queries based on chat history.
    - **Semantic Search**: Top-K retrieval (currently K=5) from the tenant-specific collection.
3.  **Generation**:
    - Model: `gpt-4o-mini` (default) for speed/cost or `gpt-4o` for precision.
    - Prompt Engineering: Structured system prompts that strictly bound the LLM to context while allowing "graceful helpfulness" if the context is missing.

## 5. Scalability & Performance
- **Async Execution**: The backend uses Python's `asyncio` to handle concurrent chat requests without blocking workers.
- **Stateless API**: The API layer can horizontally scale using a Load Balancer (ready for Kubernetes/Docker Swarm).
- **Embedded Widget**: The widget uses a lightweight shadow DOM approach to prevent CSS pollution on client websites.

## 6. Security Roadmap
- **CORS**: Strict origin white-listing per tenant (planned).
- **Rate Limiting**: Per-tenant quota management using Redis.
- **PII Redaction**: Optional layer to scrub sensitive data before sending to OpenAI (planned).

## 7. Tech Stack Summary
| Component | Technology |
| :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.12) |
| **ORM** | SQLAlchemy 2.0 |
| **LLM Orchestration** | LangChain / LangGraph ready |
| **Vector Database** | ChromaDB |
| **Database** | SQLite (Dev) / MySQL or Postgres (Prod) |
| **Frontend** | Tailwind CSS + Next.js (App Router) |
| **Mobile** | React Native (Expo) |

## 8. Observability & Monitoring
The system implements a modern **Cloud-Native Observability Stack** to ensure high availability and rapid debugging.

### 8.1 Tracing (OpenTelemetry)
- **Distributed Tracing**: Every request is instrumented via **OpenTelemetry**.
- **Context Propagation**: Spans follow the execution flow across middleware, route handlers, and service layers (RAG/NLP).
- **Exporting**: Spans are exported via **OTLP** to a centralized collector (Grafana Tempo or Jaeger).

### 8.2 Logging (Loki & Promtail)
- **Structured Logging**: The backend utilizes **JSON Logging** for native machine readability.
- **Log Correlation**: Every log line is injected with `trace_id` and `span_id` by the OTel instrumentation.
- **Aggregation**: **Promtail** scrapes these JSON logs and ships them to **Grafana Loki**. 
- **Visualization**: Grafana provides a unified pane of glass to query logs based on `tenant_id`, `trace_id`, or `severity`.
