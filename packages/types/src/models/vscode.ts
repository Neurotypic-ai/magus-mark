/**
 * VS Code extension-specific type definitions for Obsidian Magic
 */

import type { APIConfig, TaggingOptions } from './api';
import type { TagSet } from './tags';

/**
 * VS Code extension settings
 */
export interface VSCodeSettings {
  api: APIConfig;
  tagging: TaggingOptions;
  ui: {
    showTagsInExplorer: boolean;
    enableTagHighlighting: boolean;
    tagDecorationStyle: 'background' | 'underline' | 'outline';
    showTagsInStatusBar: boolean;
  };
  integration: {
    enableSidebarView: boolean;
    enableCodeLens: boolean;
    enableAutotagging: boolean;
    enableTagCompletion: boolean;
  };
  workspace: {
    vaultPath: string;
    scanOnStartup: boolean;
    excludePatterns: string[];
    includePatterns: string[];
  };
  advanced: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableTelemetry: boolean;
    cacheExpiration: number; // in minutes
  };
}

/**
 * Tag decoration for VS Code editor
 */
export interface TagDecoration {
  tag: string;
  style: {
    backgroundColor?: string;
    color?: string;
    border?: string;
    borderRadius?: string;
    fontWeight?: string;
  };
  hoverMessage: string;
}

/**
 * Workspace document with tags
 */
export interface WorkspaceDocument {
  uri: string;
  path: string;
  name: string;
  tags: TagSet;
  lastModified: Date;
  lastTagged: Date;
}

/**
 * Tag tree view node for VS Code explorer
 */
export interface TagTreeNode {
  id: string;
  label: string;
  type: 'tag-category' | 'tag' | 'document';
  tooltip?: string;
  parent?: TagTreeNode;
  children: TagTreeNode[];
  tag?: string;
  documentUri?: string;
  confidence?: number;
  iconPath?: string;
}

/**
 * Tag view state for VS Code webview
 */
export interface TagViewState {
  documents: WorkspaceDocument[];
  selectedDocument?: WorkspaceDocument;
  selectedTags: string[];
  expandedCategories: string[];
  filterQuery?: string;
}

/**
 * Cursor MCP extension context
 */
export interface MCPContext {
  extensionPath: string;
  workspacePath: string;
  serverPort: number;
  sessionId: string;
  capabilities: {
    tagging: boolean;
    modelAccess: boolean;
    fileAccess: boolean;
  };
}

/**
 * Cursor document integration
 */
export interface CursorDocument {
  uri: string;
  path: string;
  tags: TagSet;
  content: string;
  metadata: Record<string, unknown>;
}

/**
 * Cursor command definition
 */
export interface CursorCommand {
  name: string;
  id: string;
  execute: (context: MCPContext, params: Record<string, unknown>) => Promise<unknown>;
} 