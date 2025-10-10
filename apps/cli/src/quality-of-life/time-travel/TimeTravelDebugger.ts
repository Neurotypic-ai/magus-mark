import { EventEmitter } from 'events';

import { Logger } from '@magus-mark/core/utils/Logger';

export interface DebugSnapshot {
  id: string;
  timestamp: Date;
  operation: string;
  state: Record<string, unknown>;
  input?: unknown;
  output?: unknown;
  error: Error | undefined;
  duration: number;
  metadata: Record<string, unknown>;
}

export interface TimeTravelSession {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  snapshots: DebugSnapshot[];
  tags: string[];
}

export interface ReplayOptions {
  fromSnapshot?: string;
  toSnapshot?: string;
  stepByStep: boolean;
  speed: number; // 1.0 = normal speed, 0.5 = half speed, 2.0 = double speed
}

export class TimeTravelDebugger extends EventEmitter {
  private sessions = new Map<string, TimeTravelSession>();
  private currentSession?: TimeTravelSession;
  private logger: Logger;
  private isRecording = false;
  private maxSnapshots = 10000;

  constructor() {
    super();
    this.logger = Logger.getInstance('time-travel-debugger');
  }

  startSession(name: string, tags: string[] = []): string {
    const sessionId = `session-${Date.now().toString()}-${Math.random().toString(36).substring(2, 11)}`;

    const session: TimeTravelSession = {
      id: sessionId,
      name,
      startTime: new Date(),
      snapshots: [],
      tags,
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;
    this.isRecording = true;

    this.logger.info(`Started time-travel session: ${name} (${sessionId})`);
    this.emit('session:started', session);

    return sessionId;
  }

  endSession(): void {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.endTime = new Date();
    this.isRecording = false;

    const duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
    this.logger.info(
      `Ended time-travel session: ${this.currentSession.name} (${this.currentSession.snapshots.length.toString()} snapshots, ${duration.toString()}ms)`
    );

    this.emit('session:ended', this.currentSession);
    delete this.currentSession;
  }

  captureSnapshot(
    operation: string,
    state: Record<string, unknown>,
    input?: unknown,
    output?: unknown,
    error?: Error,
    duration = 0,
    metadata: Record<string, unknown> = {}
  ): string | null {
    if (!this.isRecording || !this.currentSession) {
      return null;
    }

    const snapshotId = `snapshot-${Date.now().toString()}-${Math.random().toString(36).substring(2, 11)}`;

    const snapshot: DebugSnapshot = {
      id: snapshotId,
      timestamp: new Date(),
      operation,
      state: this.deepClone(state),
      input: this.deepClone(input),
      output: this.deepClone(output),
      error: error ?? undefined,
      duration,
      metadata,
    };

    this.currentSession.snapshots.push(snapshot);

    // Enforce snapshot limit
    if (this.currentSession.snapshots.length > this.maxSnapshots) {
      this.currentSession.snapshots.shift(); // Remove oldest
    }

    this.logger.debug(`Captured snapshot: ${operation} (${snapshotId})`);
    this.emit('snapshot:captured', snapshot);

    return snapshotId;
  }

  async replaySession(sessionId: string, options: ReplayOptions = { stepByStep: false, speed: 1.0 }): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.logger.info(`Starting replay of session: ${session.name}`);
    this.emit('replay:started', session, options);

    let snapshots = session.snapshots;

    // Filter snapshots based on options
    if (options.fromSnapshot || options.toSnapshot) {
      const fromIndex = options.fromSnapshot ? snapshots.findIndex((s) => s.id === options.fromSnapshot) : 0;
      const toIndex = options.toSnapshot
        ? snapshots.findIndex((s) => s.id === options.toSnapshot) + 1
        : snapshots.length;

      snapshots = snapshots.slice(fromIndex, toIndex);
    }

    for (const [index, snapshot] of snapshots.entries()) {
      this.logger.info(
        `Replaying snapshot ${(index + 1).toString()}/${snapshots.length.toString()}: ${snapshot.operation}`
      );
      this.emit('replay:snapshot', snapshot, index + 1, snapshots.length);

      if (options.stepByStep) {
        // Wait for user input in step-by-step mode
        await this.waitForStep();
      } else {
        // Apply speed multiplier
        const delay = snapshot.duration / options.speed;
        await this.sleep(Math.min(delay, 5000)); // Cap at 5 seconds
      }
    }

    this.logger.info(`Replay completed for session: ${session.name}`);
    this.emit('replay:completed', session);
  }

  getSnapshot(snapshotId: string): DebugSnapshot | null {
    for (const session of this.sessions.values()) {
      const snapshot = session.snapshots.find((s) => s.id === snapshotId);
      if (snapshot) {
        return snapshot;
      }
    }
    return null;
  }

  getSession(sessionId: string): TimeTravelSession | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(): TimeTravelSession[] {
    return Array.from(this.sessions.values());
  }

  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return JSON.stringify(session, null, 2);
  }

  importSession(sessionData: string): string {
    try {
      const session = JSON.parse(sessionData) as TimeTravelSession;

      // Regenerate ID to avoid conflicts
      const newId = `imported-${Date.now().toString()}-${Math.random().toString(36).substring(2, 11)}`;
      session.id = newId;

      this.sessions.set(newId, session);

      this.logger.info(`Imported session: ${session.name} (${newId})`);
      this.emit('session:imported', session);

      return newId;
    } catch (error) {
      throw new Error(`Failed to import session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  compareSnapshots(snapshot1Id: string, snapshot2Id: string): Record<string, unknown> {
    const snap1 = this.getSnapshot(snapshot1Id);
    const snap2 = this.getSnapshot(snapshot2Id);

    if (!snap1 || !snap2) {
      throw new Error('One or both snapshots not found');
    }

    return {
      timeDiff: snap2.timestamp.getTime() - snap1.timestamp.getTime(),
      stateDiff: this.calculateStateDiff(snap1.state, snap2.state),
      operationDiff: {
        from: snap1.operation,
        to: snap2.operation,
      },
      durationDiff: snap2.duration - snap1.duration,
    };
  }

  private calculateStateDiff(
    state1: Record<string, unknown>,
    state2: Record<string, unknown>
  ): Record<string, unknown> {
    const diff: Record<string, unknown> = {};

    // Find changed values
    for (const [key, value] of Object.entries(state2)) {
      if (state1[key] !== value) {
        diff[key] = { from: state1[key], to: value };
      }
    }

    // Find removed values
    for (const key of Object.keys(state1)) {
      if (!(key in state2)) {
        diff[key] = { from: state1[key], to: undefined };
      }
    }

    return diff;
  }

  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item: unknown) => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        cloned[key] = this.deepClone(value);
      }
      return cloned as unknown as T;
    }

    return obj;
  }

  private async waitForStep(): Promise<void> {
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  cleanup(): void {
    this.endSession();
    this.sessions.clear();
    this.emit('cleanup');
  }
}
