from fastapi import FastAPI
from app.api.v1 import chat, ingest, leads, billing, analytics, flows
from app.api.v1.endpoints import dashboard, auth
from app.core.config import get_settings
from app.core.database import init_db
from app.core.logging import setup_logging, logger, RequestLoggingMiddleware
from app.core.telemetry import setup_telemetry
from fastapi.middleware.cors import CORSMiddleware

# Setup Logging first (JSON for Loki)
setup_logging()
settings = get_settings()
# Initialize Database
init_db()

app = FastAPI(title=settings.APP_NAME)

# Setup Observability (tracing)
setup_telemetry(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9101",
        "http://localhost:3000",
        "http://localhost:9100",
        "http://localhost:9102",
        "http://127.0.0.1:9101",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:9100",
        "http://127.0.0.1:9102",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request-level logging/monitoring middleware (after CORS so CORS preflight is visible)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["ingest"])
app.include_router(leads.router, prefix="/api/v1/leads", tags=["leads"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["billing"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(flows.router, prefix="/api/v1/flows", tags=["flows"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])


@app.on_event("startup")
def on_startup():
    logger.info("application_started", extra={
        "app_name": settings.APP_NAME,
        "database_url": settings.DATABASE_URL.split("///")[-1],  # log DB file, not full URI
    })


@app.on_event("shutdown")
def on_shutdown():
    logger.info("application_shutdown")


@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.APP_NAME} API"}

