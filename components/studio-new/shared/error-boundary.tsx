'use client';

import { Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  showHomeLink?: boolean;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// =============================================================================
// Error Boundary Class Component
// =============================================================================

/**
 * Error boundary component that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          showHomeLink={this.props.showHomeLink}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Error Fallback Component
// =============================================================================

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
  onReset?: () => void;
  showHomeLink?: boolean;
  className?: string;
}

/**
 * Default error fallback UI with retry and navigation options.
 */
export function ErrorFallback({
  error,
  errorInfo,
  onReset,
  showHomeLink = true,
  className,
}: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'min-h-[400px] flex items-center justify-center p-6',
        className
      )}
    >
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-6">
          <div
            className={cn(
              'inline-flex h-20 w-20 items-center justify-center rounded-full',
              'bg-red-500/10 border border-red-500/20'
            )}
          >
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-xl font-semibold text-studio-text mb-2">
          Something went wrong
        </h2>

        {/* Error Description */}
        <p className="text-studio-text-muted mb-6">
          We encountered an unexpected error. Please try again or return to the
          home page.
        </p>

        {/* Error Details (Development Only) */}
        {isDev && error && (
          <div className="mb-6 p-4 rounded-xl bg-studio-surface border border-studio-border text-left">
            <p className="text-xs font-mono text-red-400 mb-2">
              {error.name}: {error.message}
            </p>
            {errorInfo?.componentStack && (
              <details className="text-xs">
                <summary className="cursor-pointer text-studio-text-muted hover:text-studio-text">
                  Component Stack
                </summary>
                <pre className="mt-2 overflow-x-auto text-studio-text-muted whitespace-pre-wrap text-[10px]">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          {onReset && (
            <Button
              onClick={onReset}
              className="bg-studio-accent hover:bg-studio-accent/90 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {showHomeLink && (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-studio-border text-studio-text"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Inline Error Recovery Component
// =============================================================================

interface RetryableErrorProps {
  error: Error | string;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Inline error component with retry functionality for recoverable errors.
 */
export function RetryableError({
  error,
  onRetry,
  isRetrying = false,
  className,
}: RetryableErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl',
        'bg-red-500/10 border border-red-500/20',
        className
      )}
    >
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-400 truncate">{errorMessage}</p>
      </div>
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        size="sm"
        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-0 flex-shrink-0"
      >
        {isRetrying ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </>
        )}
      </Button>
    </motion.div>
  );
}

// =============================================================================
// Query Error Handler Hook
// =============================================================================

/**
 * Creates error handling props for use with data fetching.
 * Returns consistent error UI and retry functionality.
 */
export function useErrorHandler() {
  return {
    renderError: (error: Error | null, onRetry: () => void) => {
      if (!error) return null;
      return <RetryableError error={error} onRetry={onRetry} />;
    },
    getErrorMessage: (error: unknown): string => {
      if (error instanceof Error) return error.message;
      if (typeof error === 'string') return error;
      return 'An unexpected error occurred';
    },
  };
}

// =============================================================================
// Suspense Error Fallback
// =============================================================================

interface SuspenseErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Error fallback specifically designed for use with React Suspense.
 * Compatible with react-error-boundary package.
 */
export function SuspenseErrorFallback({
  error,
  resetErrorBoundary,
}: SuspenseErrorFallbackProps) {
  return (
    <ErrorFallback
      error={error}
      onReset={resetErrorBoundary}
      showHomeLink={false}
    />
  );
}

// =============================================================================
// API Error Handler
// =============================================================================

interface ApiErrorDisplayProps {
  error: {
    status?: number;
    message?: string;
  };
  onRetry?: () => void;
  className?: string;
}

/**
 * Display component for API/network errors with status codes.
 */
export function ApiErrorDisplay({
  error,
  onRetry,
  className,
}: ApiErrorDisplayProps) {
  const getErrorTitle = (status?: number) => {
    switch (status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Server Error';
      case 502:
        return 'Bad Gateway';
      case 503:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  };

  return (
    <div
      className={cn(
        'p-6 rounded-xl bg-studio-surface border border-studio-border text-center',
        className
      )}
    >
      {error.status && (
        <p className="text-3xl font-bold text-red-500 mb-2">{error.status}</p>
      )}
      <h3 className="text-lg font-medium text-studio-text mb-1">
        {getErrorTitle(error.status)}
      </h3>
      <p className="text-sm text-studio-text-muted mb-4">
        {error.message || 'Something went wrong with your request'}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="bg-studio-surface hover:bg-studio-border text-studio-text"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
