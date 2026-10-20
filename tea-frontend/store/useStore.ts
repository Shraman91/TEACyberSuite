import { create } from 'zustand';

interface AppState {
  user: any | null;
  setUser: (user: any) => void;
  roomKeys: Record<string, string>;
  setRoomKey: (roomId: string, key: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  roomKeys: {},
  setRoomKey: (roomId, key) => set((state) => ({ 
    roomKeys: { ...state.roomKeys, [roomId]: key } 
  })),
}));
