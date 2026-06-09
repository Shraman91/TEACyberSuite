from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import encrypt, chat
from services.firebase_service import init_firebase

app = FastAPI(title="TEA Cipher Suite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_firebase()

app.include_router(encrypt.router)
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to TEA Cipher Suite API"}
