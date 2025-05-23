import * as vscode from 'vscode';

import type { TaggedNote } from './VaultIntegrationService';

// Local Result type to replace the core package import
export interface Result<T> {
  isOk(): boolean;
  isErr(): boolean;
  value: T;
  error: Error;
}

export class SimpleResult<T> implements Result<T> {
  constructor(
    private _isOk: boolean,
    private _value?: T,
    private _error?: Error
  ) {}

  isOk(): boolean {
    return this._isOk;
  }

  isErr(): boolean {
    return !this._isOk;
  }

  get value(): T {
    if (this._isOk && this._value !== undefined) {
      return this._value;
    }
    throw new Error('Cannot access value on error result');
  }

  get error(): Error {
    if (!this._isOk && this._error) {
      return this._error;
    }
    throw new Error('Cannot access error on success result');
  }

  static ok<T>(value: T): Result<T> {
    return new SimpleResult(true, value);
  }

  static fail<T>(error: Error): Result<T> {
    return new SimpleResult<T>(false, undefined, error);
  }
}

// Local types to replace core package imports
export interface TagSuggestion {
  tag: string;
  confidence: number;
  reasoning: string;
  metadata?: Record<string, unknown>;
}

export interface OpenAIService {
  generateCompletion(options: { prompt: string; maxTokens: number; temperature: number }): Promise<Result<string>>;
}

export interface TagEngine {
  suggestTags(): Promise<Result<TagSuggestion[]>>;
}

interface ContextAnalysis {
  currentFile?: string;
  selectedText?: string;
  cursorPosition?: vscode.Position;
  recentFiles: string[];
  workspaceType?: 'project' | 'notes' | 'mixed';
  language?: string;
}

interface SmartSuggestion {
  type: 'tag' | 'file' | 'snippet' | 'note';
  content: string;
  relevance: number;
  reasoning: string;
  metadata?: Record<string, unknown>;
}

interface ProjectContext {
  projectFiles: string[];
  projectTags: string[];
  mainLanguages: string[];
  projectType: string;
  recentActivity: { file: string; timestamp: Date; action: string }[];
}

export class SmartContextProvider {
  private readonly _openAIService: OpenAIService;
  private readonly _tagEngine: TagEngine;
  private _projectContext: ProjectContext | null = null;
  private _analysisCache = new Map<string, SmartSuggestion[]>();
  private _lastAnalysis: ContextAnalysis | null = null;

  constructor(openAIService: OpenAIService, tagEngine: TagEngine) {
    this._openAIService = openAIService;
    this._tagEngine = tagEngine;
    this.initializeProjectContext();
  }

  public async provideSmartSuggestions(notes: TaggedNote[], forceRefresh = false): Promise<Result<SmartSuggestion[]>> {
    try {
      const context = await this.analyzeCurrentContext();
      const cacheKey = this.getCacheKey(context);

      if (!forceRefresh && this._analysisCache.has(cacheKey)) {
        const cached = this._analysisCache.get(cacheKey)!;
        return SimpleResult.ok(cached);
      }

      const suggestions = await this.generateSuggestions(context, notes);
      this._analysisCache.set(cacheKey, suggestions);
      this._lastAnalysis = context;

      return SimpleResult.ok(suggestions);
    } catch (error) {
      return SimpleResult.fail(new Error(`Failed to provide smart suggestions: ${error}`));
    }
  }

  public async getContextualTags(content: string): Promise<Result<TagSuggestion[]>> {
    try {
      const context = await this.analyzeCurrentContext();
      const projectTags = this._projectContext?.projectTags || [];

      // Enhanced prompt that considers project context
      const prompt = this.buildContextualTagPrompt(content, context, projectTags);

      const response = await this._openAIService.generateCompletion({
        prompt,
        maxTokens: 300,
        temperature: 0.3,
      });

      if (response.isErr()) {
        return SimpleResult.fail(response.error);
      }

      const suggestions = this.parseTagSuggestions(response.value, context);
      return SimpleResult.ok(suggestions);
    } catch (error) {
      return SimpleResult.fail(new Error(`Failed to get contextual tags: ${error}`));
    }
  }

  public async suggestRelatedFiles(currentFile: string, notes: TaggedNote[]): Promise<string[]> {
    const current = notes.find((note) => note.path === currentFile);
    if (!current) {
      return [];
    }

    const relatedFiles: { path: string; score: number }[] = [];

    for (const note of notes) {
      if (note.path === currentFile) {
        continue;
      }

      let score = 0;

      // Tag overlap score
      const commonTags = current.tags.filter((tag) => note.tags.includes(tag));
      score += commonTags.length * 2;

      // Content similarity (simple keyword matching)
      const currentWords = new Set(current.content?.toLowerCase().split(/\s+/) || []);
      const noteWords = note.content?.toLowerCase().split(/\s+/) || [];
      const commonWords = noteWords.filter((word) => word.length > 3 && currentWords.has(word));
      score += commonWords.length * 0.5;

      // Recent activity boost
      const recentActivity = this._projectContext?.recentActivity.find((a) => a.file === note.path);
      if (recentActivity && Date.now() - recentActivity.timestamp.getTime() < 24 * 60 * 60 * 1000) {
        score += 1;
      }

      if (score > 0) {
        relatedFiles.push({ path: note.path, score });
      }
    }

    return relatedFiles
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item) => item.path);
  }

  public async provideIntelligentSnippets(context: string, language?: string): Promise<Result<SmartSuggestion[]>> {
    try {
      if (!language) {
        language = this.detectLanguage(context);
      }

      const prompt = this.buildSnippetPrompt(context, language);

      const response = await this._openAIService.generateCompletion({
        prompt,
        maxTokens: 500,
        temperature: 0.4,
      });

      if (response.isErr()) {
        return SimpleResult.fail(response.error);
      }

      const snippets = this.parseSnippetSuggestions(response.value, language);
      return SimpleResult.ok(snippets);
    } catch (error) {
      return SimpleResult.fail(new Error(`Failed to provide intelligent snippets: ${error}`));
    }
  }

  private async analyzeCurrentContext(): Promise<ContextAnalysis> {
    const activeEditor = vscode.window.activeTextEditor;
    const recentFiles = await this.getRecentFiles();

    const context: ContextAnalysis = {
      recentFiles,
      workspaceType: this.detectWorkspaceType(),
    };

    if (activeEditor) {
      context.currentFile = activeEditor.document.uri.fsPath;
      context.language = activeEditor.document.languageId;
      context.cursorPosition = activeEditor.selection.active;

      const selection = activeEditor.selection;
      if (!selection.isEmpty) {
        context.selectedText = activeEditor.document.getText(selection);
      }
    }

    return context;
  }

  private async generateSuggestions(context: ContextAnalysis, notes: TaggedNote[]): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // File suggestions based on current context
    if (context.currentFile) {
      const relatedFiles = await this.suggestRelatedFiles(context.currentFile, notes);
      relatedFiles.forEach((filePath, index) => {
        const note = notes.find((n) => n.path === filePath);
        if (note) {
          suggestions.push({
            type: 'file',
            content: note.title || filePath.split('/').pop() || 'Untitled',
            relevance: Math.max(0.1, 1 - index * 0.1),
            reasoning: `Related to current file through shared tags: ${note.tags.slice(0, 3).join(', ')}`,
            metadata: { path: filePath, tags: note.tags },
          });
        }
      });
    }

    // Tag suggestions for current content
    if (context.selectedText || context.currentFile) {
      const content = context.selectedText || (await this.getCurrentFileContent());
      if (content) {
        const tagResult = await this.getContextualTags(content);
        if (tagResult.isOk()) {
          tagResult.value.forEach((tagSuggestion) => {
            suggestions.push({
              type: 'tag',
              content: tagSuggestion.tag,
              relevance: tagSuggestion.confidence,
              reasoning: tagSuggestion.reasoning || 'AI-suggested based on content analysis',
              metadata: { confidence: tagSuggestion.confidence },
            });
          });
        }
      }
    }

    // Project-aware suggestions
    if (this._projectContext && context.language) {
      const projectSuggestions = this.generateProjectAwareSuggestions(context);
      suggestions.push(...projectSuggestions);
    }

    return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 15);
  }

  private generateProjectAwareSuggestions(context: ContextAnalysis): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (!this._projectContext || !context.language) {
      return suggestions;
    }

    // Suggest frequently used project tags
    const frequentTags = this._projectContext.projectTags.slice(0, 5);
    frequentTags.forEach((tag, index) => {
      suggestions.push({
        type: 'tag',
        content: tag,
        relevance: 0.8 - index * 0.1,
        reasoning: `Frequently used in this ${this._projectContext!.projectType} project`,
        metadata: { projectSpecific: true },
      });
    });

    // Language-specific suggestions
    if (context.language && ['typescript', 'javascript', 'python'].includes(context.language)) {
      suggestions.push({
        type: 'note',
        content: `Create ${context.language} best practices note`,
        relevance: 0.6,
        reasoning: `Useful for ${context.language} development in this project`,
        metadata: { actionable: true, language: context.language },
      });
    }

    return suggestions;
  }

  private buildContextualTagPrompt(content: string, context: ContextAnalysis, projectTags: string[]): string {
    const projectContext =
      projectTags.length > 0 ? `\nExisting project tags: ${projectTags.slice(0, 10).join(', ')}` : '';

    const fileContext = context.currentFile && context.language ? `\nFile context: ${context.language} file` : '';

    return `Analyze this content and suggest relevant tags. Consider both semantic meaning and the project context.

Content:
"""
${content.slice(0, 1000)}
"""
${projectContext}${fileContext}

Provide 3-8 specific, actionable tags that would help organize and find this content. 
Format as: tag_name (confidence: 0.0-1.0) - reasoning

Focus on:
1. Technical concepts and technologies mentioned
2. Functional areas or domains
3. Project-specific categories that align with existing tags
4. Semantic themes and topics

Tags:`;
  }

  private buildSnippetPrompt(content: string, language: string): string {
    return `Based on this ${language} code context, suggest useful code snippets or patterns:

Context:
"""
${content.slice(0, 500)}
"""

Provide 2-3 relevant code snippets that would be helpful in this context. Include:
1. Common patterns for this scenario
2. Error handling improvements
3. Performance optimizations
4. Best practices

Format each as:
SNIPPET: [brief description]
\`\`\`${language}
[code]
\`\`\`
REASONING: [why this is useful]

Snippets:`;
  }

  private parseTagSuggestions(response: string, context: ContextAnalysis): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const match = /^(.+?)\s*\(confidence:\s*([\d.]+)\)\s*-\s*(.+)$/.exec(line);
      if (match) {
        const [, tag, confidenceStr, reasoning] = match;
        const confidence = parseFloat(confidenceStr);

        if (tag && confidence >= 0.3) {
          suggestions.push({
            tag: tag.trim(),
            confidence,
            reasoning: reasoning.trim(),
            metadata: { source: 'ai-contextual', language: context.language },
          });
        }
      }
    }

    return suggestions;
  }

  private parseSnippetSuggestions(response: string, language: string): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const snippetRegex = /SNIPPET:\s*(.+?)\n```\w*\n([\s\S]*?)\n```\nREASONING:\s*(.+?)(?=\n\n|$)/g;

    let match;
    while ((match = snippetRegex.exec(response)) !== null) {
      const [, description, code, reasoning] = match;

      suggestions.push({
        type: 'snippet',
        content: code.trim(),
        relevance: 0.8,
        reasoning: reasoning.trim(),
        metadata: {
          description: description.trim(),
          language,
          insertable: true,
        },
      });
    }

    return suggestions;
  }

  private async initializeProjectContext(): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const projectFiles = await this.scanProjectFiles();
      const projectTags = await this.extractProjectTags();
      const mainLanguages = this.detectMainLanguages(projectFiles);
      const projectType = this.detectProjectType(projectFiles);

      this._projectContext = {
        projectFiles,
        projectTags,
        mainLanguages,
        projectType,
        recentActivity: [],
      };
    } catch (error) {
      console.warn('Failed to initialize project context:', error);
    }
  }

  private async scanProjectFiles(): Promise<string[]> {
    const files = await vscode.workspace.findFiles('**/*.{ts,js,py,md,txt,json,yaml,yml}', '**/node_modules/**', 100);
    return files.map((file) => file.fsPath);
  }

  private async extractProjectTags(): Promise<string[]> {
    // This could be enhanced to read from existing tagged files
    const packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**');
    const tags: string[] = [];

    for (const file of packageJsonFiles.slice(0, 3)) {
      try {
        const content = await vscode.workspace.fs.readFile(file);
        const packageJson = JSON.parse(content.toString());

        if (packageJson.keywords) {
          tags.push(...packageJson.keywords);
        }

        if (packageJson.dependencies) {
          // Add major framework tags
          const frameworks = ['react', 'vue', 'angular', 'express', 'fastify', 'next'];
          for (const framework of frameworks) {
            if (packageJson.dependencies[framework] || packageJson.devDependencies?.[framework]) {
              tags.push(framework);
            }
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    return [...new Set(tags)];
  }

  private detectMainLanguages(files: string[]): string[] {
    const languageCounts = new Map<string, number>();

    for (const file of files) {
      const ext = file.split('.').pop()?.toLowerCase();
      if (ext) {
        languageCounts.set(ext, (languageCounts.get(ext) || 0) + 1);
      }
    }

    return Array.from(languageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([ext]) => ext);
  }

  private detectProjectType(files: string[]): string {
    const hasPackageJson = files.some((f) => f.endsWith('package.json'));
    const hasPyprojectToml = files.some((f) => f.endsWith('pyproject.toml'));
    const hasCargoToml = files.some((f) => f.endsWith('Cargo.toml'));
    const hasManyMdFiles = files.filter((f) => f.endsWith('.md')).length > 10;

    if (hasPackageJson) return 'javascript-project';
    if (hasPyprojectToml) return 'python-project';
    if (hasCargoToml) return 'rust-project';
    if (hasManyMdFiles) return 'documentation-project';

    return 'general-project';
  }

  private detectWorkspaceType(): 'project' | 'notes' | 'mixed' {
    if (!this._projectContext) {
      return 'mixed';
    }

    const codeFileCount = this._projectContext.projectFiles.filter((f) =>
      /\.(ts|js|py|rs|go|java|cpp|c)$/.test(f)
    ).length;

    const noteFileCount = this._projectContext.projectFiles.filter((f) => /\.(md|txt)$/.test(f)).length;

    if (codeFileCount > noteFileCount * 2) return 'project';
    if (noteFileCount > codeFileCount * 2) return 'notes';
    return 'mixed';
  }

  private detectLanguage(content: string): string {
    // Simple language detection based on content patterns
    if (/import\s+.+\s+from|export\s+(default\s+)?/m.test(content)) return 'typescript';
    if (/def\s+\w+\(|import\s+\w+/m.test(content)) return 'python';
    if (/function\s+\w+\(|const\s+\w+\s*=/m.test(content)) return 'javascript';
    if (/public\s+class\s+\w+|public\s+static\s+void\s+main/m.test(content)) return 'java';
    return 'plaintext';
  }

  private async getRecentFiles(): Promise<string[]> {
    // This would ideally integrate with VS Code's recent files API
    // For now, return empty array as placeholder
    return [];
  }

  private async getCurrentFileContent(): Promise<string | null> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return null;
    }
    return activeEditor.document.getText();
  }

  private getCacheKey(context: ContextAnalysis): string {
    return JSON.stringify({
      file: context.currentFile,
      selectedText: context.selectedText?.slice(0, 100),
      language: context.language,
    });
  }

  public trackFileActivity(file: string, action: string): void {
    if (!this._projectContext) {
      return;
    }

    this._projectContext.recentActivity.unshift({
      file,
      timestamp: new Date(),
      action,
    });

    // Keep only recent 50 activities
    this._projectContext.recentActivity = this._projectContext.recentActivity.slice(0, 50);
  }

  public clearCache(): void {
    this._analysisCache.clear();
  }
}
