from fastapi import APIRouter, Depends, HTTPException, Header
from models.schemas import ChatRoomCreate, ChatMessageSend, JoinRoomByKey
from services.firebase_service import verify_token
from firebase_admin import firestore
import time

router = APIRouter(prefix="/chat", tags=["Chat"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth token")
    token = authorization.split("Bearer ")[1]
    decoded = verify_token(token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return decoded

@router.post("/rooms")
def create_room(room: ChatRoomCreate, user: dict = Depends(get_current_user)):
    db = firestore.client()
    doc_ref = db.collection('rooms').document()
    doc_ref.set({
        'name': room.name,
        'createdAt': firestore.SERVER_TIMESTAMP,
        'keyHash': room.keyHash,
        'createdBy': user.get('uid'),
        'members': [user.get('uid')]
    })
    return {"status": "success", "roomId": doc_ref.id, "name": room.name}

@router.post("/rooms/join")
def join_room_by_key(body: JoinRoomByKey, user: dict = Depends(get_current_user)):
    """Find a room by keyHash and add the authenticated user to its members."""
    db = firestore.client()
    uid = user.get('uid')
    rooms_ref = db.collection('rooms')
    results = rooms_ref.where('keyHash', '==', body.keyHash).limit(1).get()
    if not results:
        raise HTTPException(status_code=404, detail="No room found for that key.")
    room_doc = results[0]
    room_data = room_doc.to_dict()
    members = room_data.get('members', [])
    if uid not in members:
        room_doc.reference.update({'members': firestore.ArrayUnion([uid])})
    return {"status": "success", "roomId": room_doc.id, "name": room_data.get('name', '')}

@router.get("/rooms")
def list_rooms(user: dict = Depends(get_current_user)):
    # In a full backend-driven flow, you would query Firebase Admin here
    return {"rooms": []}

@router.post("/rooms/{room_id}/messages")
def send_message(room_id: str, message: ChatMessageSend, user: dict = Depends(get_current_user)):
    db = firestore.client()
    doc_ref = db.collection('rooms').document(room_id).collection('messages').document()
    doc_ref.set({
        'ciphertext': message.ciphertext,
        'timestamp': firestore.SERVER_TIMESTAMP,
        'sender': user.get('name') or user.get('email') or user.get('uid') or "Anonymous",
        'senderUid': user.get('uid')
    })
    return {"status": "success", "message_id": doc_ref.id, "ciphertext": message.ciphertext}

@router.get("/rooms/{room_id}/messages")
def get_messages(room_id: str, user: dict = Depends(get_current_user)):
    # Read messages from Firebase via backend
    return {"messages": []}
