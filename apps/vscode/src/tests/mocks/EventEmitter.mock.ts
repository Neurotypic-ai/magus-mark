/**
 * A simple EventEmitter mock implementation for tests
 */
export class EventEmitter<T = unknown> {
  private handlers: ((data: T) => unknown)[] = [];

  /**
   * Register an event handler
   */
  public event(handler: (data: T) => unknown): { dispose: () => void } {
    this.handlers.push(handler);
    return {
      dispose: () => {
        const index = this.handlers.indexOf(handler);
        if (index !== -1) {
          this.handlers.splice(index, 1);
        }
      },
    };
  }

  /**
   * Fire an event to all registered handlers
   */
  public fire(data: T): void {
    this.handlers.forEach((handler) => {
      // Execute the handler but don't return its value
      handler(data);
    });
  }

  /**
   * Clean up all handlers
   */
  public dispose(): void {
    this.handlers = [];
  }
}
