import os
import firebase_admin
from firebase_admin import credentials, auth

def init_firebase():
    key_path = os.getenv("FIREBASE_ADMIN_KEY_PATH", "serviceAccountKey.json")
    if os.path.exists(key_path) and not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        print(f"Firebase initialized with {key_path}")
    else:
        print("Firebase key not found or already initialized.")

def verify_token(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        return None
