/**
 * Integration tests for Obsidian Magic core functionality
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { OpenAIClient, TaggingService, DocumentProcessor, BatchProcessingService, TaxonomyManager } from '../src';
import { initializeCore } from '../src';
import type { Document } from '@obsidian-magic/types';

// Mock the OpenAI API client to avoid actual API calls
vi.mock('../src/openai', () => {
  return {
    OpenAIClient: vi.fn().mockImplementation(() => {
      return {
        makeRequest: vi.fn().mockImplementation(() => {
          return {
            success: true,
            data: {
              year: "2023",
              life_area: "learning",
              topical_tags: [
                { domain: "software-development", subdomain: "frontend" },
                { contextual: "tutorial" }
              ],
              conversation_type: "practical",
              confidence: {
                overall: 0.92,
                year: 0.95,
                life_area: 0.85,
                domain: 0.93,
                subdomain: 0.90,
                contextual: 0.87,
                conversation_type: 0.91
              },
              explanations: {
                contextual_tag: "Selected 'tutorial' because the conversation walks through a step-by-step process of learning React hooks."
              }
            },
            usage: {
              promptTokens: 1000,
              completionTokens: 500,
              totalTokens: 1500,
              estimatedCost: 0.015
            }
          };
        }),
        setApiKey: vi.fn(),
        setModel: vi.fn(),
        estimateTokenCount: vi.fn().mockReturnValue(100)
      };
    })
  };
});

describe('Core Integration', () => {
  // Test document for classification
  const testDocument: Document = {
    id: 'test-doc-1',
    path: '/path/to/document.md',
    content: `
# React Hooks Tutorial

In this tutorial, we'll learn how to use React hooks to manage state and side effects in functional components.

## useState Hook

The useState hook allows you to add state to functional components:

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

## useEffect Hook

The useEffect hook allows you to perform side effects in functional components:

\`\`\`jsx
function DataFetcher() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('https://api.example.com/data')
      .then(response => response.json())
      .then(data => setData(data));
  }, []);
  
  return (
    <div>
      {data ? JSON.stringify(data) : 'Loading...'}
    </div>
  );
}
\`\`\`
    `,
    metadata: {
      created: '2023-01-01',
      modified: '2023-01-02',
      source: 'test',
    }
  };
  
  let core: {
    openAIClient: OpenAIClient;
    taxonomyManager: TaxonomyManager;
    taggingService: TaggingService;
    documentProcessor: DocumentProcessor;
    batchProcessingService: BatchProcessingService;
  };
  
  beforeAll(async () => {
    // Initialize the core module with mock API key
    core = await initializeCore({
      openaiApiKey: 'mock-api-key',
      model: 'gpt-4o'
    });
  });
  
  it('should initialize all core components', () => {
    // Verify all core components are initialized
    expect(core.openAIClient).toBeDefined();
    expect(core.taxonomyManager).toBeDefined();
    expect(core.taggingService).toBeDefined();
    expect(core.documentProcessor).toBeDefined();
    expect(core.batchProcessingService).toBeDefined();
  });
  
  it('should tag a document correctly', async () => {
    // Use the tagging service to tag a document
    const result = await core.taggingService.tagDocument(testDocument);
    
    // Verify the result
    expect(result.success).toBe(true);
    expect(result.tags).toBeDefined();
    
    if (result.success && result.tags) {
      // Verify tag structure
      const tags = result.tags;
      expect(tags.year).toBe("2023");
      expect(tags.life_area).toBe("learning");
      expect(tags.conversation_type).toBe("practical");
      
      // Verify topical tags
      const topicalTags = tags.topical_tags;
      expect(topicalTags.length).toBeGreaterThan(0);
      
      // Assert that the first element exists and has the expected properties
      expect(topicalTags[0]?.domain).toBe("software-development");
      expect(topicalTags[0]?.subdomain).toBe("frontend");
      
      // Verify confidence scores
      expect(tags.confidence.overall).toBeGreaterThan(0.9);
    }
  });
  
  it('should process markdown content', () => {
    // Test extracting content
    const extracted = core.documentProcessor.extractContent(testDocument.content);
    expect(extracted).toBeDefined();
    expect(extracted).toContain("React Hooks Tutorial");
    
    // Test parsing a document
    const parsed = core.documentProcessor.parseDocument(
      testDocument.id,
      testDocument.path,
      testDocument.content
    );
    
    expect(parsed).toBeDefined();
    expect(parsed.id).toBe(testDocument.id);
    expect(parsed.path).toBe(testDocument.path);
    expect(parsed.content).toBe(testDocument.content);
  });
  
  it('should process a batch of documents', async () => {
    // Create test batch
    const batch = [testDocument, { ...testDocument, id: 'test-doc-2' }];
    
    // Process batch
    const result = await core.batchProcessingService.processBatch(batch);
    
    // Verify results
    expect(result.summary.total).toBe(2);
    expect(result.summary.successful).toBe(2);
    expect(result.summary.failed).toBe(0);
    expect(result.results.length).toBe(2);
    expect(result.errors.length).toBe(0);
    
    // Verify estimated costs
    const costEstimate = core.batchProcessingService.estimateBatchCost(batch);
    expect(costEstimate.estimatedTokens).toBeGreaterThan(0);
    expect(costEstimate.estimatedCost).toBeGreaterThan(0);
    expect(costEstimate.estimatedTimeMinutes).toBeGreaterThan(0);
  });
}); 