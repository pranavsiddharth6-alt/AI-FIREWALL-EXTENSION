import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.analyze import router as analyze_router

load_dotenv()

app = FastAPI(
    title="AI Decision Firewall API",
    description="Safety and risk evaluation backend layer between AI agents and browser actions.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ===== CORS Configuration =====
# Configured for Chrome Extensions (chrome-extension://*) and production web clients
cors_origins_raw = os.getenv("CORS_ORIGINS", "*")

if cors_origins_raw.strip() == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
else:
    origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"chrome-extension://.*",
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

# ===== Register Routers =====
app.include_router(analyze_router)


@app.get("/", summary="Health Check")
async def health_check():
    return {
        "status": "online",
        "service": "AI Decision Firewall Backend",
        "version": "1.0.0",
    }
