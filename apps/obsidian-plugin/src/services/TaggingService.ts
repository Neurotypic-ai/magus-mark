/**
 * Service for integrating with the core tagging functionality
 */
import { TFile, Notice } from 'obsidian';
import type { 
  TagSet, 
  TaggingOptions, 
  TaggingResult,
  Document 
} from '@obsidian-magic/types';
import { 
  OpenAIClient, 
  TaggingService as CoreTaggingService,
  DocumentProcessor 
} from '@obsidian-magic/core';
import type ObsidianMagicPlugin from '../main';

/**
 * Tagging service for Obsidian integration
 */
export class TaggingService {
  private plugin: ObsidianMagicPlugin;
  private openAIClient: OpenAIClient;
  private coreTaggingService: CoreTaggingService;
  private documentProcessor: DocumentProcessor;
  
  constructor(plugin: ObsidianMagicPlugin) {
    this.plugin = plugin;
    
    // Initialize OpenAI client with API key from plugin settings
    this.openAIClient = new OpenAIClient({
      apiKey: plugin.settings.apiKey,
      model: plugin.settings.modelPreference
    });
    
    // Initialize core tagging service
    this.coreTaggingService = new CoreTaggingService(this.openAIClient, {
      model: plugin.settings.modelPreference,
      behavior: plugin.settings.defaultTagBehavior,
      minConfidence: 0.65,
      reviewThreshold: 0.85,
      generateExplanations: true
    });
    
    // Initialize document processor
    this.documentProcessor = new DocumentProcessor({
      preserveExistingTags: plugin.settings.defaultTagBehavior === 'append' || plugin.settings.defaultTagBehavior === 'merge',
      tagsKey: 'tags',
      useNestedKeys: false
    });
  }
  
  /**
   * Update API key when settings change
   */
  updateApiKey(apiKey: string): void {
    this.openAIClient.setApiKey(apiKey);
  }
  
  /**
   * Update AI model when settings change
   */
  updateModel(model: TaggingOptions['model']): void {
    this.openAIClient.setModel(model);
  }
  
  /**
   * Process a single file
   */
  async processFile(file: TFile): Promise<TaggingResult> {
    try {
      // Update status
      if (this.plugin.statusBarElement) {
        this.plugin.statusBarElement.setText('Magic: Processing file...');
      }
      
      // Read file content
      const content = await this.plugin.app.vault.read(file);
      
      // Parse document
      const document: Document = this.documentProcessor.parseDocument(
        file.path, 
        file.path,
        content
      );
      
      // Tag document
      const result = await this.coreTaggingService.tagDocument(document);
      
      if (result.success && result.tags) {
        // Update file with new tags
        const updatedContent = this.documentProcessor.updateDocument(document, result.tags);
        
        // Write back to file
        await this.plugin.app.vault.modify(file, updatedContent);
        
        // Show success notice
        new Notice('Successfully tagged document');
      } else {
        // Show error notice
        new Notice(`Error tagging document: ${result.error?.message || 'Unknown error'}`);
      }
      
      // Reset status
      if (this.plugin.statusBarElement) {
        this.plugin.statusBarElement.setText('Magic: Ready');
      }
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      console.error('Error processing file:', error);
      
      // Show error notice
      new Notice(`Error processing file: ${(error as Error).message || 'Unknown error'}`);
      
      // Reset status
      if (this.plugin.statusBarElement) {
        this.plugin.statusBarElement.setText('Magic: Ready');
      }
      
      return {
        success: false,
        error: {
          message: (error as Error).message || 'Unknown error',
          code: 'PROCESSING_ERROR',
          recoverable: false
        }
      };
    }
  }
  
  /**
   * Process multiple files
   */
  async processFiles(files: TFile[]): Promise<TaggingResult[]> {
    const results: TaggingResult[] = [];
    let processedCount = 0;
    
    // Update status
    if (this.plugin.statusBarElement) {
      this.plugin.statusBarElement.setText(`Magic: Processing files (0/${files.length})...`);
    }
    
    for (const file of files) {
      try {
        const result = await this.processFile(file);
        results.push(result);
        processedCount++;
        
        // Update status
        if (this.plugin.statusBarElement) {
          this.plugin.statusBarElement.setText(`Magic: Processing files (${processedCount}/${files.length})...`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
        results.push({
          success: false,
          error: {
            message: `Error processing ${file.path}: ${(error as Error).message || 'Unknown error'}`,
            code: 'PROCESSING_ERROR',
            recoverable: false
          }
        });
      }
    }
    
    // Reset status
    if (this.plugin.statusBarElement) {
      this.plugin.statusBarElement.setText('Magic: Ready');
    }
    
    // Show summary notice
    const successCount = results.filter(r => r.success).length;
    if (successCount === files.length) {
      new Notice(`Successfully tagged all ${files.length} files`);
    } else {
      new Notice(`Tagged ${successCount} out of ${files.length} files`);
    }
    
    return results;
  }
} 