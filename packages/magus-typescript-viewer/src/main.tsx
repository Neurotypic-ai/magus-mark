import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './client/App';
import { GraphProvider } from './client/context/GraphContext';
import { initializePerformanceMonitoring } from './client/utils/performanceMonitoring';

// Initialize performance monitoring
initializePerformanceMonitoring();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <GraphProvider>
      <App />
    </GraphProvider>
  </StrictMode>
);
