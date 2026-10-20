"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { useStore } from "@/store/useStore";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { useParams } from "next/navigation";
import { isHex128Key, sha256Hex } from "@/lib/crypto";

export default function ChatRoom() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const { roomKeys, setRoomKey } = useStore();
  const { user } = useStore();
  const [keyInput, setKeyInput] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [roomName, setRoomName] = useState<string>("Secure Channel");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [encryptionKeyInput, setEncryptionKeyInput] = useState("");

  const roomKey = typeof roomId === 'string' ? roomKeys[roomId] : '';

  useEffect(() => {
    if (!roomKey) return;
    setIsReady(true);
    
    try {
      const q = query(collection(db, `rooms/${roomId}/messages`), orderBy("timestamp", "asc"));
      const unsub = onSnapshot(q, async (snap) => {
        const docs: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Decrypt messages
        const decryptedDocs = await Promise.all(docs.map(async (doc) => {
          if (!doc.ciphertext) return doc;
          if (!encryptionKey) return { ...doc, plaintext: "Awaiting Decryption Key...", decrypted: false };
          try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/encrypt/decrypt`, {
              ciphertext: doc.ciphertext,
              key: encryptionKey
            });
            return { ...doc, plaintext: res.data.result, decrypted: true };
          } catch (e) {
            return { ...doc, plaintext: "DECRYPTION FAILED", decrypted: false };
          }
        }));
        setMessages(decryptedDocs);
      });
      return () => unsub();
    } catch (e) {
      console.log("Firebase not configured");
    }
  }, [roomId, roomKey, encryptionKey]);

  useEffect(() => {
    const loadRoom = async () => {
      if (typeof roomId !== "string") return;
      try {
        const snap = await getDoc(doc(db, "rooms", roomId));
        if (snap.exists()) {
          const data: any = snap.data();
          if (data?.name) setRoomName(data.name);
        }
      } catch {
        // ignore
      }
    };
    loadRoom();
  }, [roomId]);

  const handleSetKey = () => {
    // handled by async verifier below
  };

  const verifyAndUnlock = async () => {
    setUnlockError(null);
    if (typeof roomId !== "string") return;
    if (!isHex128Key(keyInput)) {
      setUnlockError("Key must be 32 hex characters (128-bit).");
      return;
    }

    try {
      const roomSnap = await getDoc(doc(db, "rooms", roomId));
      if (!roomSnap.exists()) {
        setUnlockError("Room not found.");
        return;
      }
      const data: any = roomSnap.data();
      const expectedHash = data?.keyHash;
      if (!expectedHash) {
        setUnlockError("Room is missing key metadata.");
        return;
      }

      const entered = keyInput.toLowerCase();
      const enteredHash = await sha256Hex(entered);
      if (enteredHash !== expectedHash) {
        setUnlockError("Incorrect key.");
        return;
      }

      setRoomKey(roomId, entered);
    } catch (e) {
      setUnlockError("Unable to verify key. Check Firebase configuration.");
    }
  };

  const sendMessage = async () => {
    if (!inputMsg.trim() || !encryptionKey) {
      if (!encryptionKey) alert("Please set the decryption key first.");
      return;
    }
    
    const msg = inputMsg;
    setInputMsg("");

    try {
      // Encrypt
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/encrypt/encrypt`, {
        plaintext: msg,
        key: encryptionKey
      });
      const ciphertext = res.data.result;

      // Save to Firebase via Backend API
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat/rooms/${roomId}/messages`, {
        ciphertext: ciphertext
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error(e);
      alert("Error sending message.");
    }
  };

  if (!isReady) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center h-full relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
        <div className="w-full border border-purple-500/30 p-10 bg-black/60 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.15)] flex flex-col items-center">
          <div className="mb-4 text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-bold mb-2 tracking-tight text-center">Encrypted Channel</h2>
          <div className="text-sm text-fuchsia-200 font-bold mb-6 bg-fuchsia-900/30 px-4 py-1 rounded-full border border-fuchsia-500/30">{roomName}</div>
          <p className="text-sm text-purple-300/60 mb-8 text-center max-w-sm">Please enter the 128-bit TEA key to decrypt and access this channel.</p>
          <input 
            type="text" 
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            placeholder="Enter 32-char hex key..."
            className="w-full bg-black/50 border border-purple-500/40 p-4 rounded-xl text-fuchsia-300 font-mono focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/50 mb-4 text-center shadow-inner"
          />
          {unlockError && (
            <div className="w-full mb-6 border border-red-500/40 bg-red-500/10 p-4 rounded-xl text-xs text-red-300 font-mono text-center shadow-inner shadow-red-500/20">
              {unlockError}
            </div>
          )}
          <button onClick={verifyAndUnlock} className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all transform hover:-translate-y-0.5 cursor-pointer">
            Unlock Channel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-80px)] relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-purple-500/20 gap-4 bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-[0_4px_30px_rgba(168,85,247,0.1)]">
        <div className="flex flex-col">
          <h2 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-bold tracking-tight">Secure Channel</h2>
          <div className="text-sm text-purple-200 font-bold mt-1">{roomName}</div>
        </div>
        <div className="text-xs text-purple-300/60 font-mono flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-widest text-[10px] font-bold">Room</span>
            <span className="text-purple-300 bg-purple-900/30 px-3 py-1.5 rounded-lg border border-purple-500/20 shadow-inner">{roomKey.substring(0,16)}...</span>
          </div>
          {!encryptionKey ? (
            <div className="flex gap-2 w-full md:w-auto mt-1">
              <input
                type="text"
                placeholder="Session Encryption Key"
                value={encryptionKeyInput}
                onChange={e => setEncryptionKeyInput(e.target.value)}
                className="flex-1 md:w-48 bg-black/50 border border-fuchsia-500/40 rounded-lg p-2 text-fuchsia-200 focus:outline-none focus:border-fuchsia-400 shadow-inner"
              />
              <button 
                onClick={() => setEncryptionKey(encryptionKeyInput)}
                className="px-4 bg-fuchsia-600/20 hover:bg-fuchsia-500/40 text-fuchsia-300 border border-fuchsia-500/30 rounded-lg transition-all font-bold tracking-wider cursor-pointer"
              >
                SET
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="uppercase tracking-widest text-[10px] font-bold text-fuchsia-400/80">Crypto</span>
              <span className="text-fuchsia-300 bg-fuchsia-900/30 px-3 py-1.5 rounded-lg border border-fuchsia-500/30 shadow-inner shadow-fuchsia-500/10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                {encryptionKey.substring(0,8)}...
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 pr-2 flex flex-col gap-4 custom-scrollbar">
        {messages.map(m => {
          const isMe = m.senderUid === user?.uid;
          return (
            <div key={m.id} className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isMe ? 'self-end' : 'self-start'}`}>
              <div className={`p-4 shadow-md backdrop-blur-md relative group ${
                isMe 
                  ? 'bg-purple-900/40 border border-purple-500/30 rounded-2xl rounded-tr-sm' 
                  : 'bg-black/60 border border-fuchsia-500/20 rounded-2xl rounded-tl-sm'
              }`}>
                {m.decrypted ? (
                  <div className="text-purple-100 text-sm leading-relaxed">{m.plaintext}</div>
                ) : (
                  <div className="text-fuchsia-400/80 text-xs font-mono break-all leading-relaxed p-2 bg-black/40 rounded-lg border border-fuchsia-500/10">{m.ciphertext}</div>
                )}
                <div className={`text-[10px] mt-3 font-mono flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity ${isMe ? 'text-purple-300' : 'text-fuchsia-300'}`}>
                  <span>{m.sender}</span>
                  <span title={m.ciphertext} className="cursor-help flex items-center gap-1.5 ml-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    TEA
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-purple-300/40 text-sm font-mono uppercase tracking-widest">
            No messages in this channel
          </div>
        )}
      </div>

      <div className="flex gap-3 bg-black/40 backdrop-blur-xl p-3 border border-purple-500/20 rounded-2xl shadow-[0_-10px_30px_rgba(168,85,247,0.05)]">
        <input 
          type="text" 
          value={inputMsg}
          onChange={e => setInputMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Transmit secure message..." 
          className="flex-1 bg-black/50 border border-purple-500/30 rounded-xl p-4 text-purple-100 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all shadow-inner"
        />
        <button 
          onClick={sendMessage} 
          className="px-6 md:px-8 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
        >
          <span className="hidden md:inline">Send</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(217, 70, 239, 0.5); }
      `}</style>
    </div>
  );
}
