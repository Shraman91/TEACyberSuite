from fastapi import APIRouter
from models.schemas import EncryptRequest, DecryptRequest, CryptoResponse
from services.tea_engine import encrypt_tea, decrypt_tea, encrypt_xtea, encrypt_xxtea

router = APIRouter(prefix="/encrypt", tags=["Encryption"])

@router.post("/encrypt", response_model=CryptoResponse)
def encrypt_tea_endpoint(req: EncryptRequest):
    res, rounds, time_us = encrypt_tea(req.plaintext, req.key)
    return CryptoResponse(result=res, rounds=rounds, time_us=time_us)

@router.post("/decrypt", response_model=CryptoResponse)
def decrypt_tea_endpoint(req: DecryptRequest):
    res, rounds, time_us = decrypt_tea(req.ciphertext, req.key)
    return CryptoResponse(result=res, rounds=rounds, time_us=time_us)

@router.post("/encrypt/xtea", response_model=CryptoResponse)
def encrypt_xtea_endpoint(req: EncryptRequest):
    res, rounds, time_us = encrypt_xtea(req.plaintext, req.key)
    return CryptoResponse(result=res, rounds=rounds, time_us=time_us)

@router.post("/encrypt/xxtea", response_model=CryptoResponse)
def encrypt_xxtea_endpoint(req: EncryptRequest):
    res, rounds, time_us = encrypt_xxtea(req.plaintext, req.key)
    return CryptoResponse(result=res, rounds=rounds, time_us=time_us)
