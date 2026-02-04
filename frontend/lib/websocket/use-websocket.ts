/**
 * React hook for WebSocket connection management
 *
 * Auto-connects on mount and disconnects on unmount
 * Provides connection state and event listening
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  WebSocketSyncClient,
  ConnectionStatus,
  WebSocketMessage,
  MessageListener,
} from './sync-client';

/**
 * WebSocket hook state
 */
interface UseWebSocketState {
  status: ConnectionStatus;
  error: Error | null;
  retryCount: number;
}

/**
 * WebSocket hook return type
 */
interface UseWebSocketReturn extends UseWebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  hasError: boolean;
  connect: () => void;
  disconnect: () => void;
  addListener: (listener: MessageListener) => void;
  removeListener: (listener: MessageListener) => void;
}

/**
 * Custom hook for WebSocket connection
 *
 * @param userId - User ID for connection isolation
 * @param autoConnect - Automatically connect on mount (default: true)
 * @returns WebSocket connection state and controls
 */
export function useWebSocket(userId: string | null, autoConnect = true): UseWebSocketReturn {
  const [state, setState] = useState<UseWebSocketState>({
    status: 'disconnected',
    error: null,
    retryCount: 0,
  });

  // Use ref to persist client instance across renders
  const clientRef = useRef<WebSocketSyncClient | null>(null);

  // Get WebSocket URL from environment
  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8005/ws';

  // Initialize client
  useEffect(() => {
    if (!userId) {
      console.warn('[useWebSocket] No userId provided, skipping connection');
      return;
    }

    // Create client instance
    clientRef.current = new WebSocketSyncClient(wsUrl, userId);

    // Add status listener
    const statusListener = (status: ConnectionStatus, error?: Error) => {
      setState((prev) => ({
        status,
        error: error || null,
        retryCount: clientRef.current?.getReconnectAttempts() || 0,
      }));
    };

    clientRef.current.addStatusListener(statusListener);

    // Auto-connect if enabled
    if (autoConnect) {
      clientRef.current.connect();
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.removeStatusListener(statusListener);
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [userId, wsUrl, autoConnect]);

  // Connect method
  const connect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.connect();
    }
  }, []);

  // Disconnect method
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  // Add message listener
  const addListener = useCallback((listener: MessageListener) => {
    if (clientRef.current) {
      clientRef.current.addMessageListener(listener);
    }
  }, []);

  // Remove message listener
  const removeListener = useCallback((listener: MessageListener) => {
    if (clientRef.current) {
      clientRef.current.removeMessageListener(listener);
    }
  }, []);

  // Derived state
  const isConnected = state.status === 'connected';
  const isConnecting = state.status === 'connecting';
  const isDisconnected = state.status === 'disconnected';
  const hasError = state.status === 'error';

  return {
    ...state,
    isConnected,
    isConnecting,
    isDisconnected,
    hasError,
    connect,
    disconnect,
    addListener,
    removeListener,
  };
}
