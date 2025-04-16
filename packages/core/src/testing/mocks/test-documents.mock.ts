import type { Document } from '../../models/Document';

/**
 * Sample React hooks tutorial document for tests
 */
export const createReactHooksTutorialDocument = (id = 'test-doc-1'): Document => ({
  id,
  path: `/path/to/${id}.md`,
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
  },
});

/**
 * Sample simple document for tests
 */
export const createSimpleDocument = (id = 'test-doc'): Document => ({
  id,
  path: `/path/to/${id}.md`,
  content: 'This is a test document content for analysis.',
  metadata: {
    created: '2023-01-01',
    modified: '2023-01-02',
    source: 'test',
  },
});
