import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .database import init_db
from .core.cloudinary_config import init_cloudinary
from .routers import auth, bloodbank, appointments, hospitals, analytics, chatbot
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database on startup
    init_db()
    # Initialize Cloudinary
    try:
        init_cloudinary()
    except ValueError as e:
        print(f"Warning: Cloudinary not configured: {e}")
    yield
    # Cleanup on shutdown (if needed)

app = FastAPI(title="SBDCs API", lifespan=lifespan)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=400,
        content={"detail": exc.errors()},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static upload files
os.makedirs("uploads/avatars", exist_ok=True)
os.makedirs("uploads/homepage", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(bloodbank.router, prefix="/api/blood-bank", tags=["Blood Bank"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(hospitals.router, prefix="/api/hospitals", tags=["Hospitals"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Smart Assistant"])

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Root route for backend verification
@app.get("/")
async def root():
    return {"message": "SBDCs Backend is running", "docs": "/docs"}

# Serve Frontend in Production
if os.path.exists("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse("dist/index.html")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
