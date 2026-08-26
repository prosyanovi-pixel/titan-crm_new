import { useEffect } from 'react';
import { useWebSocketContext, WebSocketCallbacks, MailData, SyncStatusData } from '@/context/WebSocketContext';

// Re-export for backwards compatibility
export type { MailData, SyncStatusData };

interface UseWebSocketOptions extends WebSocketCallbacks {
  userId?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  enabled?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    userId,
    onNewMail,
    onSyncStatus,
    onMailSent,
    autoReconnect = true,
    reconnectInterval = 5000,
    enabled = true
  } = options;

  const context = useWebSocketContext();

  const { addCallback, removeCallback, addConnectionRef, removeConnectionRef, connect: connectWs } = context;

  // Subscribe callbacks
  useEffect(() => {
    const callbacks = { onNewMail, onSyncStatus, onMailSent };
    addCallback(callbacks);
    return () => {
      removeCallback(callbacks);
    };
  }, [onNewMail, onSyncStatus, onMailSent, addCallback, removeCallback]);

  // Connection lifecycle
  useEffect(() => {
    if (!userId || !enabled) return;

    addConnectionRef();
    connectWs(userId, autoReconnect, reconnectInterval);

    return () => {
      removeConnectionRef();
    };
  }, [userId, autoReconnect, reconnectInterval, enabled, addConnectionRef, connectWs, removeConnectionRef]);

  return {
    isConnected: context.isConnected,
    lastMessage: context.lastMessage,
    syncStatus: context.syncStatus,
    sendMessage: context.sendMessage,
    subscribe: context.subscribe,
    unsubscribe: context.unsubscribe,
    disconnect: context.disconnect,
    connect: () => userId && context.connect(userId, autoReconnect, reconnectInterval)
  };
}
