import React, { Component } from 'react';

import { createLogger } from '../../shared/utils/logger';

import type { ErrorInfo } from 'react';

const errorLogger = createLogger('ErrorBoundary');

/**
 * Error telemetry service for collecting error data
 */
class ErrorTelemetry {
  private static instance: ErrorTelemetry;
  private errors: { error: Error; info: ErrorInfo; timestamp: Date }[] = [];
  private errorCount: Record<string, number> = {};

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): ErrorTelemetry {
    if (!ErrorTelemetry.instance) {
      ErrorTelemetry.instance = new ErrorTelemetry();
    }
    return ErrorTelemetry.instance;
  }

  /**
   * Track an error with component stack information
   */
  trackError(error: Error, componentStack: ErrorInfo): void {
    this.errors.push({
      error,
      info: componentStack,
      timestamp: new Date(),
    });

    // Track error frequency
    const errorKey = `${error.name}:${error.message}`;
    this.errorCount[errorKey] = (this.errorCount[errorKey] || 0) + 1;

    // Log the error with detailed information
    errorLogger.error('React error caught by boundary:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: componentStack.componentStack,
      count: this.errorCount[errorKey],
    });

    // In a real application, you might send this to a backend service
    // this.sendToErrorService(error, componentStack);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { totalErrors: number; uniqueErrors: number; mostFrequent: string | null } {
    const uniqueErrors = Object.keys(this.errorCount).length;
    const totalErrors = Object.values(this.errorCount).reduce((sum, count) => sum + count, 0);

    let mostFrequent: string | null = null;
    let highestCount = 0;

    Object.entries(this.errorCount).forEach(([key, count]) => {
      if (count > highestCount) {
        highestCount = count;
        mostFrequent = key;
      }
    });

    return { totalErrors, uniqueErrors, mostFrequent };
  }

  /**
   * Clear tracked errors
   */
  clearErrors(): void {
    this.errors = [];
    this.errorCount = {};
  }
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Enhanced error boundary component that catches errors in child component trees
 * and provides recovery options and telemetry
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private telemetry: ErrorTelemetry;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.telemetry = ErrorTelemetry.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Track the error for telemetry
    this.telemetry.trackError(error, errorInfo);

    // Set the error info in state
    this.setState({ errorInfo });
  }

  /**
   * Attempt to recover from the error by resetting state
   */
  handleRecoveryAttempt = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      // Render custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '2rem',
            backgroundColor: '#222',
            color: '#fff',
            borderRadius: '4px',
            margin: '1rem',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <h2 style={{ color: '#ff5555', margin: '0 0 1rem 0' }}>Something went wrong</h2>

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: 'bold', margin: '0.5rem 0' }}>
              {this.state.error?.name}: {this.state.error?.message}
            </p>
            {this.state.errorInfo ? (
              <details style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem', opacity: 0.8 }}>
                <summary>Component Stack</summary>
                {this.state.errorInfo.componentStack}
              </details>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              onClick={this.handleRecoveryAttempt}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4a90e2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#555',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}
