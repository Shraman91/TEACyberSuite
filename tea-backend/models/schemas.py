from pydantic import BaseModel
from typing import List, Optional, Dict

class EncryptRequest(BaseModel):
    plaintext: str
    key: str

class DecryptRequest(BaseModel):
    ciphertext: str
    key: str

class CryptoResponse(BaseModel):
    result: str
    rounds: List[Dict]
    time_us: float

class ChatRoomCreate(BaseModel):
    name: str
    keyHash: str

class ChatMessageSend(BaseModel):
    ciphertext: str

class JoinRoomByKey(BaseModel):
    keyHash: str

