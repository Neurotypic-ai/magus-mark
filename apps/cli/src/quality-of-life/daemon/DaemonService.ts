import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

import { Logger } from '@magus-mark/core/utils/Logger';

export interface DaemonConfig {
  name: string;
  pidFile: string;
  logFile: string;
  watchDirectories: string[];
  processInterval: number;
  autoRestart: boolean;
}

export interface DaemonStatus {
  running: boolean;
  pid?: number;
  startTime?: Date;
  lastActivity?: Date;
  processedFiles: number;
  errors: number;
}

export class DaemonService extends EventEmitter {
  private config: DaemonConfig;
  private logger: Logger;
  private status: DaemonStatus;
  private watchers: fs.FSWatcher[] = [];
  private processInterval?: NodeJS.Timeout;

  constructor(config: DaemonConfig) {
    super();
    this.config = config;
    this.logger = Logger.getInstance(`daemon:${config.name}`);
    this.status = {
      running: false,
      processedFiles: 0,
      errors: 0,
    };
  }

  async start(): Promise<void> {
    if (this.status.running) {
      throw new Error('Daemon is already running');
    }

    this.logger.info(`Starting daemon ${this.config.name}`);

    try {
      // Write PID file
      await this.writePidFile();

      // Set up file watchers
      await this.setupWatchers();

      // Start processing interval
      this.startProcessingInterval();

      this.status.running = true;
      this.status.pid = process.pid;
      this.status.startTime = new Date();

      this.logger.info(`Daemon ${this.config.name} started with PID ${process.pid}`);
      this.emit('daemon:started');

      // Set up graceful shutdown
      this.setupShutdownHandlers();
    } catch (error) {
      this.logger.error(`Failed to start daemon: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.status.running) {
      return;
    }

    this.logger.info(`Stopping daemon ${this.config.name}`);

    // Clear processing interval
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }

    // Close file watchers
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];

    // Remove PID file
    await this.removePidFile();

    this.status.running = false;
    delete this.status.pid;

    this.logger.info(`Daemon ${this.config.name} stopped`);
    this.emit('daemon:stopped');
  }

  async restart(): Promise<void> {
    this.logger.info(`Restarting daemon ${this.config.name}`);
    await this.stop();
    await this.start();
  }

  getStatus(): DaemonStatus {
    return { ...this.status };
  }

  async isRunning(): Promise<boolean> {
    try {
      await fsPromises.access(this.config.pidFile);

      const pidContent = await fsPromises.readFile(this.config.pidFile, 'utf-8');
      const pid = parseInt(pidContent.trim(), 10);

      // Check if process with this PID is still running
      try {
        process.kill(pid, 0); // Signal 0 checks if process exists
        return true;
      } catch {
        // Process doesn't exist, clean up stale PID file
        await this.removePidFile();
        return false;
      }
    } catch {
      return false;
    }
  }

  private async writePidFile(): Promise<void> {
    const pidDir = path.dirname(this.config.pidFile);
    await fsPromises.mkdir(pidDir, { recursive: true });
    await fsPromises.writeFile(this.config.pidFile, process.pid.toString());
  }

  private async removePidFile(): Promise<void> {
    try {
      await fsPromises.unlink(this.config.pidFile);
    } catch {
      // Ignore errors when removing PID file
    }
  }

  private async setupWatchers(): Promise<void> {
    for (const directory of this.config.watchDirectories) {
      try {
        const watcher = fs.watch(directory, { recursive: true });
        watcher.on('change', (eventType: string, filename: string | null) => {
          if (filename) {
            this.handleFileChange(eventType, path.join(directory, filename));
          }
        });

        this.watchers.push(watcher);
        this.logger.debug(`Watching directory: ${directory}`);
      } catch (error) {
        this.logger.warn(
          `Failed to watch directory ${directory}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private handleFileChange(eventType: string, filePath: string): void {
    this.status.lastActivity = new Date();
    this.logger.debug(`File ${eventType}: ${filePath}`);
    this.emit('file:changed', eventType, filePath);

    // Queue file for processing if it's a markdown file
    if (filePath.endsWith('.md') || filePath.endsWith('.markdown')) {
      this.emit('file:queued', filePath);
    }
  }

  private startProcessingInterval(): void {
    this.processInterval = setInterval(() => {
      this.emit('daemon:heartbeat', this.status);
    }, this.config.processInterval);
  }

  private setupShutdownHandlers(): void {
    const shutdown = async () => {
      this.logger.info('Received shutdown signal');
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGHUP', async () => {
      if (this.config.autoRestart) {
        await this.restart();
      }
    });
  }
}
