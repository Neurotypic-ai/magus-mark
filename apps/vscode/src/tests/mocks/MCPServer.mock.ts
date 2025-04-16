import { vi } from 'vitest';

import { EventEmitter } from './EventEmitter.mock';

/**
 * Embedded HTTP Service mock for MCPServer
 * Not exported - only for internal use by MCPServer
 */
class HttpService {
  get = vi.fn().mockResolvedValue({ status: 200, data: {} });
  post = vi.fn().mockResolvedValue({ status: 200, data: {} });
  put = vi.fn().mockResolvedValue({ status: 200, data: {} });
  delete = vi.fn().mockResolvedValue({ status: 200, data: {} });
}

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
  private httpService = new HttpService();
  private webSocketService = new WebSocketService();

  initialize = vi.fn().mockResolvedValue(true);
  registerTools = vi.fn();
  start = vi.fn().mockImplementation(() => {
    this.webSocketService.connect();
    return Promise.resolve(true);
  });

  stop = vi.fn().mockImplementation(() => {
    this.webSocketService.disconnect();
    return Promise.resolve(true);
  });

  sendMessage = vi.fn().mockImplementation((message: unknown) => {
    return this.webSocketService.send(message) as Promise<boolean>;
  });

  dispose = vi.fn();
}

export default MCPServer;
