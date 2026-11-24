import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import auth, books, borrow

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Athena Library API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://athena-library-management-system.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(borrow.router)


@app.get("/")
def health_check():
    return {"status": "ok"}