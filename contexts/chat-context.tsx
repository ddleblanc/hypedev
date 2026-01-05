'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Types
export type ChatTab = 'world' | 'clan' | 'whispers';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface WorldMessage {
  id: string;
  type: 'sale' | 'listing' | 'lootbox' | 'achievement' | 'tournament' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    userId?: string;
    username?: string;
    avatar?: string;
    link?: string;
    amount?: string;
    nftName?: string;
    collectionName?: string;
  };
}

export interface ClanMessage {
  id: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    avatar: string | null;
    walletAddress: string;
  };
}

export interface ClanInfo {
  id: string;
  name: string;
  tag: string;
  memberCount: number;
  myRole: string;
}

interface ChatState {
  // Widget state
  isOpen: boolean;
  isMinimized: boolean;
  isMobileOverlayOpen: boolean;
  activeTab: ChatTab;

  // World messages
  worldMessages: WorldMessage[];

  // Clan state
  currentClan: ClanInfo | null;
  clanMessages: ClanMessage[];
  clanConnectionStatus: ConnectionStatus;

  // Whispers state
  whispersUnreadCount: number;
  whispersConnectionStatus: ConnectionStatus;

  // World connection
  connectionStatus: ConnectionStatus;

  // Unread
  unreadCounts: {
    world: number;
    clan: number;
    whispers: number;
  };
}

type ChatAction =
  | { type: 'TOGGLE_OPEN' }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'TOGGLE_MINIMIZE' }
  | { type: 'SET_TAB'; payload: ChatTab }
  | { type: 'ADD_WORLD_MESSAGE'; payload: WorldMessage }
  | { type: 'SET_WORLD_MESSAGES'; payload: WorldMessage[] }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'CLEAR_UNREAD'; payload: ChatTab }
  | { type: 'INCREMENT_UNREAD'; payload: ChatTab }
  // Clan actions
  | { type: 'SET_CURRENT_CLAN'; payload: ClanInfo | null }
  | { type: 'ADD_CLAN_MESSAGE'; payload: ClanMessage }
  | { type: 'SET_CLAN_MESSAGES'; payload: ClanMessage[] }
  | { type: 'SET_CLAN_CONNECTION_STATUS'; payload: ConnectionStatus }
  // Whispers actions
  | { type: 'SET_WHISPERS_UNREAD_COUNT'; payload: number }
  | { type: 'SET_WHISPERS_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_MOBILE_OVERLAY_OPEN'; payload: boolean };

const initialState: ChatState = {
  isOpen: false,
  isMinimized: false,
  isMobileOverlayOpen: false,
  activeTab: 'world',
  worldMessages: [],
  currentClan: null,
  clanMessages: [],
  clanConnectionStatus: 'disconnected',
  whispersUnreadCount: 0,
  whispersConnectionStatus: 'disconnected',
  connectionStatus: 'disconnected',
  unreadCounts: { world: 0, clan: 0, whispers: 0 },
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'TOGGLE_OPEN':
      return { ...state, isOpen: !state.isOpen, isMinimized: false };
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload, isMinimized: false };
    case 'TOGGLE_MINIMIZE':
      return { ...state, isMinimized: !state.isMinimized };
    case 'SET_TAB':
      return {
        ...state,
        activeTab: action.payload,
        unreadCounts: { ...state.unreadCounts, [action.payload]: 0 },
      };
    case 'ADD_WORLD_MESSAGE': {
      const newMessages = [action.payload, ...state.worldMessages].slice(0, 100); // Keep last 100
      return {
        ...state,
        worldMessages: newMessages,
        unreadCounts: state.activeTab !== 'world' || !state.isOpen
          ? { ...state.unreadCounts, world: state.unreadCounts.world + 1 }
          : state.unreadCounts,
      };
    }
    case 'SET_WORLD_MESSAGES':
      return { ...state, worldMessages: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'CLEAR_UNREAD':
      return { ...state, unreadCounts: { ...state.unreadCounts, [action.payload]: 0 } };
    case 'INCREMENT_UNREAD':
      return {
        ...state,
        unreadCounts: { ...state.unreadCounts, [action.payload]: state.unreadCounts[action.payload] + 1 },
      };
    // Clan actions
    case 'SET_CURRENT_CLAN':
      return { ...state, currentClan: action.payload };
    case 'ADD_CLAN_MESSAGE': {
      // Check for duplicates
      if (state.clanMessages.some(m => m.id === action.payload.id)) {
        return state;
      }
      const newClanMessages = [...state.clanMessages, action.payload].slice(-100); // Keep last 100
      return {
        ...state,
        clanMessages: newClanMessages,
        unreadCounts: state.activeTab !== 'clan' || !state.isOpen
          ? { ...state.unreadCounts, clan: state.unreadCounts.clan + 1 }
          : state.unreadCounts,
      };
    }
    case 'SET_CLAN_MESSAGES':
      return { ...state, clanMessages: action.payload };
    case 'SET_CLAN_CONNECTION_STATUS':
      return { ...state, clanConnectionStatus: action.payload };
    // Whispers actions
    case 'SET_WHISPERS_UNREAD_COUNT':
      return {
        ...state,
        whispersUnreadCount: action.payload,
        unreadCounts: { ...state.unreadCounts, whispers: action.payload },
      };
    case 'SET_WHISPERS_CONNECTION_STATUS':
      return { ...state, whispersConnectionStatus: action.payload };
    case 'SET_MOBILE_OVERLAY_OPEN':
      return { ...state, isMobileOverlayOpen: action.payload };
    default:
      return state;
  }
}

interface ChatContextValue extends ChatState {
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  toggleMinimize: () => void;
  setTab: (tab: ChatTab) => void;
  addWorldMessage: (message: WorldMessage) => void;
  setWorldMessages: (messages: WorldMessage[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  clearUnread: (tab: ChatTab) => void;
  // Clan methods
  setCurrentClan: (clan: ClanInfo | null) => void;
  addClanMessage: (message: ClanMessage) => void;
  setClanMessages: (messages: ClanMessage[]) => void;
  setClanConnectionStatus: (status: ConnectionStatus) => void;
  // Whispers methods
  setWhispersUnreadCount: (count: number) => void;
  setWhispersConnectionStatus: (status: ConnectionStatus) => void;
  // Mobile overlay
  setMobileOverlayOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const toggleOpen = useCallback(() => dispatch({ type: 'TOGGLE_OPEN' }), []);
  const setOpen = useCallback((open: boolean) => dispatch({ type: 'SET_OPEN', payload: open }), []);
  const toggleMinimize = useCallback(() => dispatch({ type: 'TOGGLE_MINIMIZE' }), []);
  const setTab = useCallback((tab: ChatTab) => dispatch({ type: 'SET_TAB', payload: tab }), []);
  const addWorldMessage = useCallback((message: WorldMessage) =>
    dispatch({ type: 'ADD_WORLD_MESSAGE', payload: message }), []);
  const setWorldMessages = useCallback((messages: WorldMessage[]) =>
    dispatch({ type: 'SET_WORLD_MESSAGES', payload: messages }), []);
  const setConnectionStatus = useCallback((status: ConnectionStatus) =>
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: status }), []);
  const clearUnread = useCallback((tab: ChatTab) =>
    dispatch({ type: 'CLEAR_UNREAD', payload: tab }), []);

  // Clan methods
  const setCurrentClan = useCallback((clan: ClanInfo | null) =>
    dispatch({ type: 'SET_CURRENT_CLAN', payload: clan }), []);
  const addClanMessage = useCallback((message: ClanMessage) =>
    dispatch({ type: 'ADD_CLAN_MESSAGE', payload: message }), []);
  const setClanMessages = useCallback((messages: ClanMessage[]) =>
    dispatch({ type: 'SET_CLAN_MESSAGES', payload: messages }), []);
  const setClanConnectionStatus = useCallback((status: ConnectionStatus) =>
    dispatch({ type: 'SET_CLAN_CONNECTION_STATUS', payload: status }), []);

  // Whispers methods
  const setWhispersUnreadCount = useCallback((count: number) =>
    dispatch({ type: 'SET_WHISPERS_UNREAD_COUNT', payload: count }), []);
  const setWhispersConnectionStatus = useCallback((status: ConnectionStatus) =>
    dispatch({ type: 'SET_WHISPERS_CONNECTION_STATUS', payload: status }), []);

  // Mobile overlay
  const setMobileOverlayOpen = useCallback((open: boolean) =>
    dispatch({ type: 'SET_MOBILE_OVERLAY_OPEN', payload: open }), []);

  return (
    <ChatContext.Provider value={{
      ...state,
      toggleOpen,
      setOpen,
      toggleMinimize,
      setTab,
      addWorldMessage,
      setWorldMessages,
      setConnectionStatus,
      clearUnread,
      setCurrentClan,
      addClanMessage,
      setClanMessages,
      setClanConnectionStatus,
      setWhispersUnreadCount,
      setWhispersConnectionStatus,
      setMobileOverlayOpen,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

// Alias for backward compatibility
export const useChatContext = useChat;
