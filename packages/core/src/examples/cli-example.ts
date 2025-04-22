/**
 * Example CLI usage of the Magus Mark core module
 *
 * To run:
 * 1. Set OPENAI_API_KEY environment variable
 * 2. npx tsx packages/core/examples/cli-example.ts
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initializeCore } from '..';

import type { AIModel } from '../models/AIModel';

// Get the directory name using CommonJS compatible approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Get API key from environment
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required.');
    process.exit(1);
  }

  // Get model from arguments or use default
  const modelArg = process.argv[2];
  const model: AIModel = (modelArg as AIModel) || 'gpt-4o';

  try {
    // Initialize core module
    console.log(`Initializing Magus Mark core module with model: ${model}...`);
    const core = await initializeCore({
      openaiApiKey: apiKey,
      model,
    });

    // Load example document
    const documentPath = path.join(__dirname, 'sample-conversation.md');
    const content = await fs.readFile(documentPath, 'utf-8');

    // Parse document
    const document = core.documentProcessor.parseDocument('sample-1', documentPath, content);

    console.log(`\nProcessing document: ${path.basename(documentPath)}`);
    console.log(`Content length: ${content.length} characters`);
    console.log(`Using model: ${model}`);

    // Estimate token usage
    const tokens = core.openAIClient.estimateTokenCount(content);
    console.log(`Estimated tokens: ${tokens}`);

    // Process document
    console.log('\nTagging document...');
    const startTime = Date.now();
    const result = await core.taggingService.tagDocument(document);
    const elapsed = Date.now() - startTime;

    // Print results
    if (result.success && result.tags) {
      console.log('\nTagging successful!');
      console.log(`Time taken: ${elapsed}ms`);

      const { tags } = result;

      console.log('\n====== TAGS ======');
      console.log(`Year: ${tags.year}`);

      if (tags.life_area) {
        console.log(`Life Area: ${tags.life_area}`);
      }

      console.log('\nTopical Tags:');
      tags.topical_tags.forEach((tag, index) => {
        console.log(`  ${index + 1}. Domain: ${tag.domain}`);
        if (tag.subdomain) {
          console.log(`     Subdomain: ${tag.subdomain}`);
        }
        if (tag.contextual) {
          console.log(`     Contextual: ${tag.contextual}`);
        }
      });

      console.log(`\nConversation Type: ${tags.conversation_type}`);

      console.log('\nConfidence Scores:');
      Object.entries(tags.confidence).forEach(([key, value]) => {
        console.log(`  ${key}: ${(value as number).toFixed(2)}`);
      });

      if (tags.explanations) {
        console.log('\nExplanations:');
        Object.entries(tags.explanations).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }

      // Update document with tags
      console.log('\nUpdating document with tags...');
      const updatedContent = core.documentProcessor.updateDocument(document, tags);

      // Write updated content to a new file
      const outputPath = path.join(__dirname, 'sample-conversation-tagged.md');
      await fs.writeFile(outputPath, updatedContent, 'utf-8');
      console.log(`Tagged document written to: ${outputPath}`);
    } else {
      console.error('\nTagging failed!');
      console.error(`Error: ${result.error?.message}`);
      console.error(`Code: ${result.error?.code}`);
    }

    // Batch processing example
    console.log('\n\n==== BATCH PROCESSING EXAMPLE ====');

    // Create a batch of documents
    const batch = [document, { ...document, id: 'sample-2' }];

    // Get cost estimate
    const costEstimate = core.batchProcessingService.estimateBatchCost(batch);
    console.log('\nBatch Processing Estimate:');
    console.log(`Estimated tokens: ${costEstimate.estimatedTokens}`);
    console.log(`Estimated cost: $${costEstimate.estimatedCost}`);
    console.log(`Estimated time: ${costEstimate.estimatedTimeMinutes} minutes`);

    // Process batch with progress reporting
    console.log('\nProcessing batch...');
    const batchStartTime = Date.now();

    const batchResult = await core.batchProcessingService.processBatch(batch);

    const batchElapsed = Date.now() - batchStartTime;
    console.log(`Batch processing complete in ${batchElapsed}ms`);

    console.log('\nBatch Summary:');
    console.log(`Total documents: ${batchResult.summary.total}`);
    console.log(`Successfully processed: ${batchResult.summary.successful}`);
    console.log(`Failed: ${batchResult.summary.failed}`);
    console.log(`Total tokens used: ${batchResult.summary.totalTokensUsed}`);
    console.log(`Estimated cost: $${batchResult.summary.estimatedCost.toFixed(4)}`);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// Create sample file if it doesn't exist
async function createSampleIfNeeded() {
  const samplePath = path.join(__dirname, 'sample-conversation.md');
  try {
    await fs.access(samplePath);
    // File exists, do nothing
  } catch (error) {
    // File doesn't exist, create it
    const sampleContent = `# React Hooks Discussion

**User**: I'm trying to understand React hooks. Can you explain how useState and useEffect work?

**AI**: Absolutely! React hooks are functions that let you use React features in functional components.

## useState Hook

The useState hook adds state to functional components. Here's a basic example:

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

The useEffect hook lets you perform side effects in functional components, like data fetching or DOM manipulation:

\`\`\`jsx
function DataFetcher() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // This runs after render
    fetch('https://api.example.com/data')
      .then(response => response.json())
      .then(data => setData(data));
      
    // Optional cleanup function
    return () => {
      // This runs before component unmounts
      console.log('Component unmounting');
    };
  }, []); // Empty dependency array means run once after initial render
  
  return (
    <div>
      {data ? JSON.stringify(data) : 'Loading...'}
    </div>
  );
}
\`\`\`

**User**: That's helpful! How do I make useEffect run only when certain values change?

**AI**: You can control when useEffect runs by using the dependency array (the second argument). Here's how it works:

1. **Empty array** \`[]\`: Effect runs once after the initial render
2. **No array**: Effect runs after every render
3. **With dependencies** \`[dep1, dep2]\`: Effect runs after renders where dependencies changed

Example:

\`\`\`jsx
function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    // This effect runs whenever query changes
    const fetchData = async () => {
      const response = await fetch(\`https://api.example.com/search?q=\${query}\`);
      const data = await response.json();
      setResults(data);
    };
    
    if (query) {
      fetchData();
    }
  }, [query]); // Only re-run when query changes
  
  return (
    <div>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
        placeholder="Search..." 
      />
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
\`\`\`

This pattern is very useful for optimizing your components and avoiding unnecessary effects.
`;

    await fs.mkdir(path.dirname(samplePath), { recursive: true });
    await fs.writeFile(samplePath, sampleContent, 'utf-8');
    console.log(`Created sample file: ${samplePath}`);
  }
}

// Ensure sample file exists then run main function
createSampleIfNeeded()
  .then(() => main())
  .catch((error) => {
    console.error('Error in setup:', error);
    process.exit(1);
  });
