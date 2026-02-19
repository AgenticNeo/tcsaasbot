# TangentCloud AI Bots - Innovative SaaS Chatbot Platform

This project is a boilerplate for an innovative, profitable AI Chatbot SaaS platform using modern technologies.

## Tech Stack

- **Frontend / Mobile**: React Native (Expo)
- **Backend**: FastAPI (Python)
- **AI Engine**: OpenAI API (GPT-4o / GPT-4o-mini)
- **Knowledge Base (RAG)**: ChromaDB (Vector Database)
- **Architecture**: Multi-tenant SaaS ready (API Key based isolation)

## Project Structure

- `backend/`: The Python FastAPI backend.
- `mobile/`: The React Native / Expo mobile application.

## Getting Started

### 1. Infrastructure Setup (Database & Redis)

1.  Start the database and redis services using Docker:
    ```bash
    docker compose up -d
    ```

### 2. Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and install dependencies:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  Configure environment:
    - Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    - **IMPORTANT**: Edit `.env` to add your `OPENAI_API_KEY` and ensure `DATABASE_URL` matches your docker config.

4.  Run the API server:
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 9100
    ```
    API Docs: `http://localhost:9100/docs`

### 3. Dashboard Setup (Web)

1.  Navigate to the `dashboard` directory:
    ```bash
    cd dashboard
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    - Open `http://localhost:9101` to view the SaaS Dashboard.
    - **Features Live:**
        - **Analytics Cards:** View total chats and active bots.
        - **Bot Manager:** Create new AI agents and view the list.
        - **Sidebar Navigation:** Foundation for future settings and billing.

### 4. Mobile App Setup

1.  Navigate to the `mobile` directory:
    ```bash
    cd mobile
    npm install
    npm start
    ```
    - Use Expo Go to scan the QR code.
    - Ensure `API_URL` in `mobile/App.js` points to your backend IP (e.g., `http://YOUR_PC_IP:9100`).

## Features implemented

- **RAG Engine**: Ingest documents via `/api/v1/ingest` and query via `/api/v1/chat`.
- **Vector Search**: Uses ChromaDB for fast semantic search.
- **Multi-tenancy**: Uses `X-API-Key` header to isolate tenant data in separate vector collections.
- **Mobile Chat UI**: Clean, responsive chat interface built with React Native.

## Next Steps for Profitability

1.  **Stripe Integration**: Add payment gateway to charge for API usage or monthly subscriptions.
2.  **Dashboard**: Build a React web dashboard for users to upload documents (calling `/ingest`) and view analytics.
3.  **Advanced RAG**: Implement hybrid search, re-ranking, and improved text splitting strategies.
4.  **Deployment**:
    - Backend: Deploy to AWS Lambda / EC2 or Railway/Render.
    - Database: Use a persistent ChromaDB server or switch to Pinecone/Weaviate for scale.
    - Mobile: Publish to App Store and Google Play.
