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
 * Error types specific to the tagging service
 */
export type TaggingServiceErrorCode = 
  | 'API_KEY_MISSING'
  | 'FILE_ACCESS_ERROR' 
  | 'PROCESSING_ERROR'
  | 'API_ERROR'
  | 'UNEXPECTED_ERROR';

/**
 * Generic error details interface
 */
export interface ErrorDetails {
  code: TaggingServiceErrorCode;
  message: string;
  recoverable: boolean;
}

/**
 * Generic result interface
 */
export interface Result<T = undefined> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
}

/**
 * Result type for file processing operations
 */
export interface FileProcessingResult extends Result<{
  file: TFile;
  tags?: TagSet;
}> {}

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
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.plugin.settings.apiKey;
  }
  
  /**
   * Process a single file
   */
  async processFile(file: TFile): Promise<FileProcessingResult> {
    try {
      // Check if API key is configured
      if (!this.isConfigured()) {
        return {
          success: false,
          error: {
            code: 'API_KEY_MISSING',
            message: 'OpenAI API key is not configured',
            recoverable: true
          }
        };
      }
      
      // Update status
      if (this.plugin.statusBarElement) {
        this.plugin.statusBarElement.setText('Magic: Processing file...');
      }
      
      // Read file content
      let content: string;
      try {
        content = await this.plugin.app.vault.read(file);
      } catch (err) {
        return {
          success: false,
          error: {
            code: 'FILE_ACCESS_ERROR',
            message: `Could not read file: ${(err as Error).message}`,
            recoverable: false
          }
        };
      }
      
      // Parse document
      const document: Document = this.documentProcessor.parseDocument(
        file.path, 
        file.basename,
        content
      );
      
      // Tag document
      const result = await this.coreTaggingService.tagDocument(document);
      
      if (result.success && result.tags) {
        try {
          // Update file with new tags
          const updatedContent = this.documentProcessor.updateDocument(document, result.tags);
          
          // Write back to file
          await this.plugin.app.vault.modify(file, updatedContent);
          
          // Show success notice
          new Notice('Successfully tagged document');
          
          // Reset status
          if (this.plugin.statusBarElement) {
            this.plugin.statusBarElement.setText('Magic: Ready');
          }
          
          return {
            success: true,
            data: {
              file,
              tags: result.tags
            }
          };
        } catch (writeErr) {
          return {
            success: false,
            error: {
              code: 'FILE_ACCESS_ERROR',
              message: `Could not update file: ${(writeErr as Error).message}`,
              recoverable: true
            }
          };
        }
      } else {
        // Show error notice
        new Notice(`Error tagging document: ${result.error?.message || 'Unknown error'}`);
        
        // Reset status
        if (this.plugin.statusBarElement) {
          this.plugin.statusBarElement.setText('Magic: Ready');
        }
        
        return {
          success: false,
          error: {
            code: 'PROCESSING_ERROR' as TaggingServiceErrorCode,
            message: 'Unknown error during processing',
            recoverable: false
          }
        };
      }
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
          code: 'UNEXPECTED_ERROR',
          message: (error as Error).message || 'Unknown error',
          recoverable: false
        }
      };
    }
  }
  
  /**
   * Process multiple files with retry mechanism
   */
  async processFiles(files: TFile[]): Promise<FileProcessingResult[]> {
    const results: FileProcessingResult[] = [];
    let processedCount = 0;
    let successCount = 0;
    
    // Update status
    if (this.plugin.statusBarElement) {
      this.plugin.statusBarElement.setText(`Magic: Processing files (0/${files.length})...`);
    }
    
    // Process files with configurable concurrency
    const concurrency = 3; // Process 3 files at a time
    
    // Create batches of files
    const batches: TFile[][] = [];
    for (let i = 0; i < files.length; i += concurrency) {
      batches.push(files.slice(i, i + concurrency));
    }
    
    // Process each batch
    for (const batch of batches) {
      // Process files in the current batch concurrently
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          // Try up to 3 times with exponential backoff
          for (let attempt = 0; attempt < 3; attempt++) {
            const result = await this.processFile(file);
            
            // If successful or not recoverable, return the result
            if (result.success || (result.error && !result.error.recoverable)) {
              return result;
            }
            
            // If this is not the last attempt, wait before retrying
            if (attempt < 2) {
              // Exponential backoff: 1s, 2s, 4s
              const delay = Math.pow(2, attempt) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          // If we get here, all attempts failed
          return {
            success: false,
            error: {
              code: 'PROCESSING_ERROR' as TaggingServiceErrorCode,
              message: `Failed to process file after multiple attempts: ${file.path}`,
              recoverable: false
            }
          };
        })
      );
      
      // Add results to the overall results array
      results.push(...batchResults);
      
      // Update progress
      processedCount += batch.length;
      successCount += batchResults.filter(r => r.success).length;
      
      // Update status
      if (this.plugin.statusBarElement) {
        this.plugin.statusBarElement.setText(`Magic: Processing files (${processedCount}/${files.length})...`);
      }
    }
    
    // Reset status
    if (this.plugin.statusBarElement) {
      this.plugin.statusBarElement.setText('Magic: Ready');
    }
    
    // Show summary notice
    if (successCount === files.length) {
      new Notice(`Successfully tagged all ${files.length} files`);
    } else {
      new Notice(`Tagged ${successCount} out of ${files.length} files`);
    }
    
    return results;
  }
} 