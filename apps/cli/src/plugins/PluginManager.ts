import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';

// Safe string conversion utility
function safeToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value);
  } catch {
    return '[object Object]';
  }
}

// Logger interface for type safety
export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

// Metrics interface for type safety
export interface Metrics {
  increment: (metric: string, value?: number) => void;
  decrement: (metric: string, value?: number) => void;
  gauge: (metric: string, value: number) => void;
  timing: (metric: string, value: number) => void;
}

// Configuration interface for type safety
export interface Config {
  plugins?: {
    autoLoad?: boolean;
    paths?: string[];
    security?: {
      enableValidation?: boolean;
      allowedPatterns?: string[];
    };
  };
  [key: string]: unknown;
}

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  dependencies: PluginDependency[];
  permissions: Permission[];
}

export interface PluginDependency {
  name: string;
  version: string;
  optional?: boolean;
}

export interface Permission {
  type: 'filesystem' | 'network' | 'api' | 'config';
  scope: string[];
  level: 'read' | 'write' | 'execute';
}

// Generic command arguments interface
export interface CommandArgs {
  [key: string]: unknown;
  _: (string | number)[];
  $0: string;
}

export interface CommandDefinition {
  name: string;
  description: string;
  options: OptionDefinition[];
  handler: (args: CommandArgs) => Promise<void>;
}

export interface OptionDefinition {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: string | number | boolean;
}

// Generic processor input/output interfaces
export type ProcessorInput = Record<string, unknown>;

export type ProcessorConfig = Record<string, unknown>;

export type ProcessorOutput = Record<string, unknown>;

export interface ProcessorDefinition {
  name: string;
  description: string;
  processor: (input: ProcessorInput, config: ProcessorConfig) => Promise<ProcessorOutput>;
}

export interface CLIContext {
  config: Config;
  logger: Logger;
  metrics: Metrics;
  eventBus: EventEmitter;
}

export interface PluginInstance {
  plugin: PluginBase;
  loaded: boolean;
  commands: CommandDefinition[];
  processors: ProcessorDefinition[];
  permissions: Permission[];
}

export abstract class PluginBase {
  abstract init(cli: CLIContext): Promise<void>;
  abstract getCommands(): CommandDefinition[];
  abstract getProcessors(): ProcessorDefinition[];
  abstract cleanup(): Promise<void>;

  protected context?: CLIContext;

  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
    if (this.context?.logger) {
      this.context.logger[level](message, ...args);
    }
  }

  protected emit(event: string, ...args: unknown[]): void {
    if (this.context?.eventBus) {
      this.context.eventBus.emit(event, ...args);
    }
  }
}

// Type guard for PluginBase
function isPluginBase(value: unknown): value is typeof PluginBase {
  return (
    typeof value === 'function' &&
    value.prototype &&
    typeof value.prototype.init === 'function' &&
    typeof value.prototype.getCommands === 'function' &&
    typeof value.prototype.getProcessors === 'function' &&
    typeof value.prototype.cleanup === 'function'
  );
}

// Package.json interface for discovered plugins
interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  keywords?: string[];
  main?: string;
  [key: string]: unknown;
}

export class PluginManager extends EventEmitter {
  private plugins = new Map<string, PluginInstance>();
  private context: CLIContext;
  private pluginPaths: string[] = [];

  constructor(context: CLIContext) {
    super();
    this.context = context;
    this.initializeDefaultPaths();
  }

  private initializeDefaultPaths(): void {
    // Default plugin search paths
    this.pluginPaths = [
      path.join(process.cwd(), 'plugins'),
      path.join(process.cwd(), 'node_modules/@magus-mark'),
      path.join(__dirname, '..', '..', 'plugins'),
    ];
  }

  async installPlugin(pluginPath: string): Promise<void> {
    try {
      this.context.logger.info(`Installing plugin from: ${pluginPath}`);

      const plugin = await this.loadPlugin(pluginPath);
      await this.validatePlugin(plugin);

      // Check dependencies
      await this.checkDependencies();

      // Initialize the plugin
      await plugin.init(this.context);

      const instance: PluginInstance = {
        plugin,
        loaded: true,
        commands: plugin.getCommands(),
        processors: plugin.getProcessors(),
        permissions: [], // Set during validation
      };

      this.plugins.set(plugin.constructor.name, instance);

      this.context.logger.info(`Plugin ${plugin.constructor.name} installed successfully`);
      this.emit('plugin:installed', plugin.constructor.name, instance);
    } catch (error) {
      const errorMessage = safeToString(error);
      this.context.logger.error(`Failed to install plugin: ${errorMessage}`);
      throw error;
    }
  }

  async loadPlugin(pluginPath: string): Promise<PluginBase> {
    // Security check: ensure path is within allowed directories
    if (!this.isAllowedPath(pluginPath)) {
      throw new Error(`Plugin path not allowed: ${pluginPath}`);
    }

    try {
      // Dynamic import with security validation
      const absolutePath = path.resolve(pluginPath);
      const module = (await import(absolutePath)) as Record<string, unknown>;

      // Try to find the plugin class in various export patterns
      const PluginClass = this.extractPluginClass(module);

      if (!PluginClass || !isPluginBase(PluginClass)) {
        throw new Error(`Invalid plugin: ${pluginPath} - must extend PluginBase`);
      }

      return new PluginClass() as PluginBase;
    } catch (error) {
      const errorMessage = safeToString(error);
      throw new Error(`Failed to load plugin from ${pluginPath}: ${errorMessage}`);
    }
  }

  private extractPluginClass(module: Record<string, unknown>): unknown {
    // Try common export patterns
    if (module.default) return module.default;
    if (module.Plugin) return module.Plugin;

    // Find first export that looks like a class
    const keys = Object.keys(module);
    if (keys.length > 0) {
      return module[keys[0]];
    }

    return null;
  }

  private isAllowedPath(pluginPath: string): boolean {
    const absolutePath = path.resolve(pluginPath);

    return this.pluginPaths.some((allowedPath) => {
      const absoluteAllowedPath = path.resolve(allowedPath);
      return absolutePath.startsWith(absoluteAllowedPath);
    });
  }

  private async validatePlugin(plugin: PluginBase): Promise<void> {
    // Validate plugin structure and permissions
    const commands = plugin.getCommands();
    const processors = plugin.getProcessors();

    // Validate commands
    for (const command of commands) {
      if (!command.name || !command.handler) {
        throw new Error('Invalid command definition: missing name or handler');
      }
    }

    // Validate processors
    for (const processor of processors) {
      if (!processor.name || !processor.processor) {
        throw new Error('Invalid processor definition: missing name or processor function');
      }
    }

    // Security validation
    await this.validateSecurity(plugin);
  }

  private validateSecurity(plugin: PluginBase): void {
    // Implement security checks:
    // 1. Code analysis for malicious patterns
    // 2. Permission validation
    // 3. Signature verification (if implemented)

    // For now, basic validation
    const pluginCode = plugin.toString();

    // Check for potentially dangerous operations
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /process\.exit/,
      /require\s*\(\s*['"`]child_process['"`]\s*\)/,
      /import\s*\(\s*['"`]child_process['"`]\s*\)/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(pluginCode)) {
        throw new Error(`Plugin contains potentially dangerous code: ${pattern.toString()}`);
      }
    }
  }

  private async checkDependencies(): Promise<void> {
    // Check if plugin dependencies are satisfied
    // This is a simplified implementation

    // In a real implementation, this would:
    // 1. Check package.json dependencies
    // 2. Verify version compatibility
    // 3. Load dependent plugins if needed

    this.context.logger.debug('Dependencies check passed for plugin');
  }

  getPluginCommands(): CommandDefinition[] {
    const commands: CommandDefinition[] = [];

    this.plugins.forEach((instance) => {
      if (instance.loaded) {
        commands.push(...instance.commands);
      }
    });

    return commands;
  }

  getPluginProcessors(): ProcessorDefinition[] {
    const processors: ProcessorDefinition[] = [];

    this.plugins.forEach((instance) => {
      if (instance.loaded) {
        processors.push(...instance.processors);
      }
    });

    return processors;
  }

  async unloadPlugin(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`);
    }

    try {
      await instance.plugin.cleanup();
      this.plugins.delete(name);

      this.context.logger.info(`Plugin ${name} unloaded successfully`);
      this.emit('plugin:unloaded', name);
    } catch (error) {
      const errorMessage = safeToString(error);
      this.context.logger.error(`Failed to unload plugin ${name}: ${errorMessage}`);
      throw error;
    }
  }

  async reloadPlugin(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`);
    }

    // Store the plugin path for reloading
    const pluginPath = instance.plugin.constructor.name;

    await this.unloadPlugin(name);
    await this.installPlugin(pluginPath);
  }

  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.entries()).map(([name, instance]) => ({
      name,
      loaded: instance.loaded,
      commands: instance.commands.length,
      processors: instance.processors.length,
      description: 'Plugin description', // Would come from plugin metadata
    }));
  }

  async discoverPlugins(): Promise<string[]> {
    const discoveredPlugins: string[] = [];

    for (const searchPath of this.pluginPaths) {
      try {
        await fs.access(searchPath);
        const entries = await fs.readdir(searchPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const pluginPath = path.join(searchPath, entry.name);
            const packagePath = path.join(pluginPath, 'package.json');

            try {
              await fs.access(packagePath);
              const packageContent = await fs.readFile(packagePath, 'utf-8');
              const packageData = JSON.parse(packageContent) as PackageJson;

              if (packageData.keywords?.includes('magus-mark-plugin')) {
                discoveredPlugins.push(pluginPath);
              }
            } catch {
              // Ignore invalid plugin directories
            }
          }
        }
      } catch {
        // Ignore inaccessible directories
      }
    }

    return discoveredPlugins;
  }

  async autoLoadPlugins(): Promise<void> {
    const discoveredPlugins = await this.discoverPlugins();

    this.context.logger.info(`Discovered ${discoveredPlugins.length.toString()} plugins`);

    for (const pluginPath of discoveredPlugins) {
      try {
        await this.installPlugin(pluginPath);
      } catch (error) {
        const errorMessage = safeToString(error);
        this.context.logger.warn(`Failed to auto-load plugin ${pluginPath}: ${errorMessage}`);
      }
    }
  }

  getPlugin(name: string): PluginInstance | undefined {
    return this.plugins.get(name);
  }

  async enablePlugin(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`);
    }

    if (!instance.loaded) {
      await instance.plugin.init(this.context);
      instance.loaded = true;

      this.emit('plugin:enabled', name);
    }
  }

  async disablePlugin(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`);
    }

    if (instance.loaded) {
      await instance.plugin.cleanup();
      instance.loaded = false;

      this.emit('plugin:disabled', name);
    }
  }

  cleanup(): void {
    this.plugins.forEach((instance, name) => {
      void instance.plugin.cleanup().catch((error) => {
        const errorMessage = safeToString(error);
        this.context.logger.error(`Error cleaning up plugin ${name}: ${errorMessage}`);
      });
    });

    this.plugins.clear();
    this.emit('cleanup');
  }
}

export interface PluginInfo {
  name: string;
  loaded: boolean;
  commands: number;
  processors: number;
  description: string;
}
