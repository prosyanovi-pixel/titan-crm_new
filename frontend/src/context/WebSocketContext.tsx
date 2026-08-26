/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
}

export interface MailData {
  mail?: {
    sender?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SyncStatusData {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface WebSocketCallbacks {
  onNewMail?: (mail: MailData) => void;
  onSyncStatus?: (status: SyncStatusData) => void;
  onMailSent?: (mail: unknown) => void;
  onChatMessage?: (chatData: unknown) => void;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  syncStatus: SyncStatusData | null;
  sendMessage: (type: string, data?: unknown) => void;
  subscribe: (events: string[]) => void;
  unsubscribe: (events: string[]) => void;
  disconnect: () => void;
  connect: (userId: string, autoReconnect?: boolean, reconnectInterval?: number) => void;
  addCallback: (callbacks: WebSocketCallbacks) => void;
  removeCallback: (callbacks: WebSocketCallbacks) => void;
  addConnectionRef: () => void;
  removeConnectionRef: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const callbacksRef = useRef<Set<WebSocketCallbacks>>(new Set());
  const connectionRefsRef = useRef<number>(0);
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const { t } = useTranslation();

  const addCallback = useCallback((cb: WebSocketCallbacks) => {
    callbacksRef.current.add(cb);
  }, []);

  const removeCallback = useCallback((cb: WebSocketCallbacks) => {
    callbacksRef.current.delete(cb);
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    setLastMessage(message);
    
    switch (message.type) {
      case 'connected':
      case 'pong':
        break;
      case 'new_mail': {
        const mailData = message.data as MailData;
        const sender = mailData?.mail?.sender || t('notifications.toast.websocket.unknown_sender');
        toast.info(t('notifications.toast.websocket.new_mail').replace('{0}', sender as string));
        callbacksRef.current.forEach(cb => cb.onNewMail?.(mailData));
        break;
      }
      case 'sync_status': {
        const syncData = message.data as SyncStatusData;
        setSyncStatus(syncData);
        if (syncData?.status === 'completed') toast.success(t('notifications.toast.websocket.sync_completed').replace('{0}', syncData.message || ''));
        else if (syncData?.status === 'error') toast.error(t('notifications.toast.websocket.sync_error').replace('{0}', syncData.message || ''));
        callbacksRef.current.forEach(cb => cb.onSyncStatus?.(syncData));
        break;
      }
      case 'mail_sent':
        toast.success(t('notifications.toast.websocket.mail_sent'));
        callbacksRef.current.forEach(cb => cb.onMailSent?.(message.data));
        break;
      case 'new_chat_message':
        callbacksRef.current.forEach(cb => cb.onChatMessage?.(message.data));
        break;
      default:
        console.warn('[WebSocket] Unknown message type:', message.type);
    }
  }, []);

  const connect = useCallback(function connectFn(userId: string, autoReconnect = true, reconnectInterval = 5000) {
    if (wsRef.current) return;
    setActiveUserId(userId);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    let wsUrl;
    const apiUrl = import.meta.env.VITE_API_URL;
    // Route through Vite proxy in dev to avoid cross-port issues, 
    // otherwise use the API URL host if available.
    if ((import.meta.env as unknown as Record<string, unknown>).DEV || !(apiUrl && apiUrl.startsWith('http'))) {
      wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
    } else {
      const apiHost = new URL(apiUrl).host;
      wsUrl = `${protocol}//${apiHost}/ws?userId=${userId}`;
    }

    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'ping' }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      
      if (autoReconnect && connectionRefsRef.current > 0) {
        reconnectTimeoutRef.current = setTimeout(() => connectFn(userId, autoReconnect, reconnectInterval), reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };
  }, [handleMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setActiveUserId(null);
  }, []);

  const addConnectionRef = useCallback(() => {
    connectionRefsRef.current++;
  }, []);

  const removeConnectionRef = useCallback(() => {
    connectionRefsRef.current--;
    if (connectionRefsRef.current <= 0) {
      connectionRefsRef.current = 0;
      disconnect();
    }
  }, [disconnect]);

  const sendMessage = useCallback((type: string, data: unknown = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }, []);

  const subscribe = useCallback((events: string[]) => sendMessage('subscribe', { events }), [sendMessage]);
  const unsubscribe = useCallback((events: string[]) => sendMessage('unsubscribe', { events }), [sendMessage]);

  const contextValue = React.useMemo(() => ({
    isConnected,
    lastMessage,
    syncStatus,
    sendMessage,
    subscribe,
    unsubscribe,
    disconnect,
    connect,
    addCallback,
    removeCallback,
    addConnectionRef,
    removeConnectionRef
  }), [
    isConnected, lastMessage, syncStatus, sendMessage, subscribe, unsubscribe,
    disconnect, connect, addCallback, removeCallback, addConnectionRef, removeConnectionRef
  ]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
