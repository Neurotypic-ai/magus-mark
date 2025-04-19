import { vi } from 'vitest';

import { EventEmitter } from './EventEmitter.mock';

/**
 * Embedded WebSocket Service mock for MCPServer
 * Not exported - only for internal use by MCPServer
 */
class WebSocketService {
  connected = false;

  // Event emitters
  onMessage = new EventEmitter();
  onOpen = new EventEmitter();
  onClose = new EventEmitter();
  onError = new EventEmitter();

  connect = vi.fn().mockImplementation(() => {
    this.connected = true;
    return Promise.resolve(true);
  });

  disconnect = vi.fn().mockImplementation(() => {
    this.connected = false;
    return Promise.resolve(true);
  });

  send = vi.fn().mockResolvedValue(true);

  isConnected = vi.fn().mockImplementation(() => this.connected);

  dispose = vi.fn();
}

/**
 * Mock for MCPServer class
 * Contains embedded HTTP and WebSocket functionality
 */
export class MCPServer {
  private webSocketService = new WebSocketService();

  initialize: typeof vi.fn = vi.fn().mockResolvedValue(true);
  registerTools: typeof vi.fn = vi.fn();
  start: typeof vi.fn = vi.fn().mockImplementation(() => {
    this.webSocketService.connect();
    return Promise.resolve(true);
  });

  stop: typeof vi.fn = vi.fn().mockImplementation(() => {
    this.webSocketService.disconnect();
    return Promise.resolve(true);
  });

  sendMessage: typeof vi.fn = vi.fn().mockImplementation((message: unknown) => {
    return this.webSocketService.send(message) as Promise<boolean>;
  });

  dispose: typeof vi.fn = vi.fn();
}

export default MCPServer;
