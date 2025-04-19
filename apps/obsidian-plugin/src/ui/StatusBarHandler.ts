// A simple subscription interface for observables
export interface Subscription {
  unsubscribe(): void;
}

// An observable interface for UI state streams
export interface Observable<T> {
  subscribe(callback: (value: T) => void): Subscription;
}

/**
 * StatusBarHandler subscribes to a status stream and updates the status bar element.
 */
export class StatusBarHandler {
  private subscription: Subscription;

  /**
   * @param statusBar - an object with a setText method (e.g., Obsidian status bar)
   * @param status$ - an observable emitting status strings
   */
  constructor(
    private statusBar: { setText(text: string): void },
    status$: Observable<string>
  ) {
    this.subscription = status$.subscribe((status) => {
      this.statusBar.setText(status);
    });
  }

  /**
   * Unsubscribe from the status stream when no longer needed.
   */
  public destroy(): void {
    this.subscription.unsubscribe();
  }
}
