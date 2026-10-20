"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { useStore } from "@/store/useStore";
import { isHex128Key, sha256Hex } from "@/lib/crypto";
import { useRouter } from "next/navigation";
import axios from "axios";
import { auth } from "@/lib/firebase";

export default function ChatRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [customRoomKey, setCustomRoomKey] = useState("");
  const [joinKey, setJoinKey] = useState("");
  const { setRoomKey } = useStore();
  const { user } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setRooms([]);
      return;
    }
    try {
      const q = query(collection(db, "rooms"), where("members", "array-contains", user.uid));
      const unsub = onSnapshot(q, (snap) => {
        const fetchedRooms = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedRooms.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
        setRooms(fetchedRooms);
      });
      return () => unsub();
    } catch (e) {
      console.log("Firebase config not complete. Mocking rooms...");
    }
  }, [user]);

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    
    let keyHex = customRoomKey.trim().toLowerCase();
    if (keyHex) {
      if (!isHex128Key(keyHex)) {
        alert("Custom Key must be 32 hex characters (128-bit).");
        return;
      }
    } else {

      const arr = new Uint8Array(16);
      window.crypto.getRandomValues(arr);
      keyHex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    try {
      const keyHash = await sha256Hex(keyHex);
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert("Not authenticated.");
        return;
      }
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat/rooms`, {
        name: newRoomName,
        keyHash: keyHash
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRoomKey(res.data.roomId, keyHex);
      alert(`Room Created! Join Key (Save this!): ${keyHex}`);
    } catch (e) {
      console.error(e);
      alert("Error creating room via backend.");
    }
    setNewRoomName("");
    setCustomRoomKey("");
  };

  const joinRoomByKey = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (!isHex128Key(joinKey)) {
      alert("Key must be 32 hex characters (128-bit).");
      return;
    }

    try {
      const keyHex = joinKey.toLowerCase();
      const keyHash = await sha256Hex(keyHex);
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert("Not authenticated.");
        return;
      }
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat/rooms/join`,
        { keyHash },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoomKey(res.data.roomId, keyHex);
      router.push(`/chat/${res.data.roomId}`);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      alert(detail || "Unable to join by key. Check that the key is correct.");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <div className="flex items-center justify-between mb-10">
        <h2 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-bold tracking-tight">
          Encrypted Comms
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="border border-purple-500/30 p-6 md:p-8 bg-black/60 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.1)] flex flex-col gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-purple-300 uppercase tracking-widest mb-2">Initialize Secure Channel</h3>
          
          <input 
            type="text" 
            placeholder="New Room Name..." 
            className="w-full bg-black/50 border border-purple-500/40 rounded-xl p-4 text-fuchsia-200 focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/50 transition-all shadow-inner"
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Optional: Custom 128-bit Key (32 hex chars)..." 
            className="w-full bg-black/50 border border-purple-500/40 rounded-xl p-4 text-fuchsia-200 font-mono text-sm focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/50 transition-all shadow-inner"
            value={customRoomKey}
            onChange={e => setCustomRoomKey(e.target.value)}
          />
          <button onClick={createRoom} className="mt-2 w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all transform hover:-translate-y-0.5 cursor-pointer">
            Create Channel
          </button>
        </div>

        <div className="border border-fuchsia-500/30 p-6 md:p-8 bg-black/60 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.1)] flex flex-col gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-fuchsia-300 uppercase tracking-widest mb-2">Connect to Channel</h3>
          
          <input
            type="text"
            placeholder="Enter room key (32 hex chars) to join..."
            className="w-full bg-black/50 border border-fuchsia-500/40 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all shadow-inner"
            value={joinKey}
            onChange={(e) => setJoinKey(e.target.value)}
          />
          <button
            onClick={joinRoomByKey}
            className="mt-auto w-full py-4 border-2 border-fuchsia-500/50 text-fuchsia-300 font-bold uppercase tracking-widest rounded-xl hover:bg-fuchsia-500/10 transition-all cursor-pointer"
          >
            Join via Key
          </button>
        </div>
      </div>

      <div className="mb-6 border-b border-purple-500/20 pb-4">
        <h3 className="text-2xl font-bold text-purple-200 tracking-wide">Active Channels</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rooms.map(r => (
          <div key={r.id} className="border border-purple-500/20 p-6 bg-black/40 hover:bg-black/60 hover:border-fuchsia-500/40 rounded-2xl transition-all relative group shadow-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-fuchsia-500 rounded-l-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-xl text-white font-bold pl-2 truncate">{r.name}</h3>
            <div className="mt-6 flex justify-between items-center pl-2">
              <a href={`/chat/${r.id}`} className="text-fuchsia-400 font-bold text-sm uppercase tracking-wider hover:text-purple-300 transition-colors flex items-center gap-2 group-hover:translate-x-1 duration-300">
                Enter Channel <span className="text-lg">&rarr;</span>
              </a>
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-purple-500/20 rounded-2xl bg-black/20 text-purple-400/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <div className="text-sm uppercase tracking-[0.2em] font-bold">No active channels</div>
            <div className="text-xs mt-2 opacity-60">Create or join one above</div>
          </div>
        )}
      </div>
    </div>
  );
}
