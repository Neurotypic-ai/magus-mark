// Import observable interfaces from StatusBarHandler
import type { Observable, Subscription } from './StatusBarHandler';

/**
 * Message type for notices (string or DocumentFragment)
 */
export type NoticeMessage = string | DocumentFragment;

/**
 * Factory function type that creates and shows a notice, returning an object with hide/setMessage
 */
export type NoticeFactory = (message: NoticeMessage) => { hide(): void; setMessage(msg: string): void };

/**
 * NoticeHandler subscribes to a notice stream and displays notices via the provided factory.
 */
export class NoticeHandler {
  private subscription: Subscription;

  /**
   * @param noticeFactory - function to create/display a notice (e.g., `new Notice`)
   * @param notices$ - observable emitting notice messages
   */
  constructor(
    private noticeFactory: NoticeFactory,
    notices$: Observable<NoticeMessage>
  ) {
    this.subscription = notices$.subscribe((message) => {
      this.noticeFactory(message);
    });
  }

  /**
   * Unsubscribe from the notice stream when no longer needed.
   */
  public destroy(): void {
    this.subscription.unsubscribe();
  }
}
