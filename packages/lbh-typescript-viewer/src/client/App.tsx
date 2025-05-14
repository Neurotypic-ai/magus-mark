import { Suspense, lazy, useEffect, useState } from 'react';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ReactFlowProvider } from '@xyflow/react';

import { createLogger } from '../shared/utils/logger';
import { GraphDataAssembler } from './assemblers/GraphDataAssembler';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GraphProvider } from './context/GraphContext';
import { graphTheme } from './theme/graphTheme';

import type { JSX } from 'react';

import type { DependencyPackageGraph } from './components/DependencyGraph/types';

// Lazy load the DependencyGraph component for code splitting and better performance
const DependencyGraph = lazy(() => import('./components/DependencyGraph/DependencyGraphLazy'));

// Loading fallback component
const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: graphTheme.nodes.colors.background.default,
      color: '#ffffff',
    }}
    role="status"
    aria-live="polite"
  >
    <p>Loading dependency graph...</p>
  </div>
);

const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: graphTheme.nodes.colors.background.default,
      paper: graphTheme.nodes.colors.background.package,
    },
    primary: {
      main: '#90caf9',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: graphTheme.nodes.colors.background.default,
          color: '#ffffff',
        },
      },
    },
  },
});

// Create an app-specific logger
const appLogger = createLogger('App');
const graphDataAssembler = new GraphDataAssembler();

export default function App(): JSX.Element {
  const [graphData, setGraphData] = useState<DependencyPackageGraph>({ packages: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create an AbortController for cleanup
        controller = new AbortController();
        const signal = controller.signal;

        appLogger.debug('Fetching graph data...');

        // Add signal to fetch operations inside assembleGraphData
        // This way we can abort the fetch if the component unmounts
        const data = await graphDataAssembler.assembleGraphData(signal);

        if (!mounted) return;

        appLogger.debug('Setting graph data...');
        setGraphData(data);
        setIsLoading(false);
      } catch (error) {
        if (!mounted) return;
        // Ignore aborted fetch errors
        if (error instanceof DOMException && error.name === 'AbortError') {
          appLogger.debug('Fetch operation was aborted');
          return;
        }
        appLogger.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    };

    void fetchData();

    return () => {
      mounted = false;
      if (controller) {
        controller.abort();
      }
    };
  }, []);

  if (isLoading) {
    appLogger.debug('Rendering loading state...');
    return <LoadingFallback />;
  }

  if (error) {
    appLogger.debug('Rendering error state:', error);
    return (
      <div
        style={{
          padding: '2rem',
          color: 'red',
          background: graphTheme.nodes.colors.background.default,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        role="alert"
        aria-live="assertive"
      >
        <h1>Error Loading Graph</h1>
        <p>{error}</p>
        <button
          onClick={() => {
            window.location.reload();
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  appLogger.debug('Rendering dependency graph...');
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <GraphProvider>
        <ReactFlowProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <DependencyGraph data={graphData} />
            </Suspense>
          </ErrorBoundary>
        </ReactFlowProvider>
      </GraphProvider>
    </ThemeProvider>
  );
}
