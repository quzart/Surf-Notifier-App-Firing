import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import engine
from app import models
from app.routes import spots, preferences, auth, push
from app.services.scheduler import start_scheduler, stop_scheduler

load_dotenv()

app = FastAPI(title="Surf Notifier API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(spots.router)
app.include_router(preferences.router)
app.include_router(push.router)


@app.on_event("startup")
def on_startup():
    # start_scheduler()
    pass


@app.on_event("shutdown")
def on_shutdown():
    # stop_scheduler()
    pass


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Surf Notifier API is running"}