import { create } from 'zustand';
import { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  activeChat: string | null;
  addMessage: (message: ChatMessage) => void;
  setActiveChat: (userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  activeChat: null,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setActiveChat: (userId) => set({ activeChat: userId }),
}));