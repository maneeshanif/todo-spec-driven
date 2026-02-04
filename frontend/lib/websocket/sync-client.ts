/**
 * WebSocket sync client for real-time task synchronization
 *
 * Connects to the WebSocket service and handles task update events
 */

import { Task } from '@/types';

/**
 * Task event types emitted from the backend
 */
export type TaskEventType = 'task.created' | 'task.updated' | 'task.deleted' | 'task.completed';

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: 'task_update' | 'ping';
  event?: TaskEventType;
  task?: Task;
  timestamp?: string;
}

/**
 * Connection state
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Event listener callback
 */
export type MessageListener = (message: WebSocketMessage) => void;

/**
 * Connection status callback
 */
export type StatusListener = (status: ConnectionStatus, error?: Error) => void;

/**
 * Exponential backoff configuration
 */
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]; // ms
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * WebSocket sync client with automatic reconnection
 */
export class WebSocketSyncClient {
  private ws: WebSocket | null = null;
  private url: string;
  private userId: string;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private status: ConnectionStatus = 'disconnected';
  private shouldReconnect = true;

  constructor(url: string, userId: string) {
    this.url = url;
    this.userId = userId;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocketSync] Already connected');
      return;
    }

    this.shouldReconnect = true;
    this.setStatus('connecting');

    try {
      const wsUrl = `${this.url}/${this.userId}`;
      console.log('[WebSocketSync] Connecting to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[WebSocketSync] Connection error:', error);
      this.setStatus('error', error as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('[WebSocketSync] Disconnecting...');
    this.shouldReconnect = false;
    this.clearReconnectTimeout();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * Add message event listener
   */
  addMessageListener(listener: MessageListener): void {
    this.messageListeners.add(listener);
  }

  /**
   * Remove message event listener
   */
  removeMessageListener(listener: MessageListener): void {
    this.messageListeners.delete(listener);
  }

  /**
   * Add connection status listener
   */
  addStatusListener(listener: StatusListener): void {
    this.statusListeners.add(listener);
  }

  /**
   * Remove connection status listener
   */
  removeStatusListener(listener: StatusListener): void {
    this.statusListeners.delete(listener);
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get current reconnection attempt count
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // Private methods

  private handleOpen(): void {
    console.log('[WebSocketSync] Connected successfully');
    this.reconnectAttempts = 0;
    this.setStatus('connected');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Handle ping messages
      if (message.type === 'ping') {
        // Optionally send pong back
        return;
      }

      // Handle task update messages
      if (message.type === 'task_update') {
        console.log('[WebSocketSync] Received task update:', message.event);
        this.notifyMessageListeners(message);
      }
    } catch (error) {
      console.error('[WebSocketSync] Failed to parse message:', error);
    }
  }

  private handleError(event: Event): void {
    console.error('[WebSocketSync] WebSocket error:', event);
    this.setStatus('error', new Error('WebSocket connection error'));
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WebSocketSync] Connection closed:', event.code, event.reason);
    this.ws = null;
    this.setStatus('disconnected');

    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocketSync] Max reconnection attempts reached');
      this.setStatus('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.clearReconnectTimeout();

    const delayIndex = Math.min(this.reconnectAttempts, RECONNECT_DELAYS.length - 1);
    const delay = RECONNECT_DELAYS[delayIndex];

    console.log(
      `[WebSocketSync] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private setStatus(status: ConnectionStatus, error?: Error): void {
    this.status = status;
    this.notifyStatusListeners(status, error);
  }

  private notifyMessageListeners(message: WebSocketMessage): void {
    this.messageListeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {
        console.error('[WebSocketSync] Error in message listener:', error);
      }
    });
  }

  private notifyStatusListeners(status: ConnectionStatus, error?: Error): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status, error);
      } catch (error) {
        console.error('[WebSocketSync] Error in status listener:', error);
      }
    });
  }
}
