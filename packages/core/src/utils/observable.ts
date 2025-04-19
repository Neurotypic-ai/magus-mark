export interface Subscription {
  unsubscribe(): void;
}

export interface Observable<T> {
  subscribe(callback: (value: T) => void): Subscription;
}

/**
 * A simple Subject that allows multicasting events to subscribers.
 */
export class Subject<T> implements Observable<T> {
  private listeners: Array<(value: T) => void> = [];

  subscribe(callback: (value: T) => void): Subscription {
    this.listeners.push(callback);
    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter((l) => l !== callback);
      },
    };
  }

  next(value: T): void {
    this.listeners.forEach((listener) => listener(value));
  }
}

/**
 * A BehaviorSubject that remembers the last value and immediately emits it to new subscribers.
 */
export class BehaviorSubject<T> extends Subject<T> {
  private current: T;

  constructor(initialValue: T) {
    super();
    this.current = initialValue;
  }

  override subscribe(callback: (value: T) => void): Subscription {
    // Emit current value first
    callback(this.current);
    return super.subscribe(callback);
  }

  override next(value: T): void {
    this.current = value;
    super.next(value);
  }
}
