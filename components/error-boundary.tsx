"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
    this.setState({ eventId });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, eventId: null });
  };

  handleReport = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;ve been notified and are working on a fix.
          </p>
          <div className="flex gap-4">
            <Button onClick={this.handleReset} variant="outline">
              Try Again
            </Button>
            <Button onClick={this.handleReport}>
              Report Issue
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-6 p-4 bg-destructive/10 rounded text-left text-sm overflow-auto max-w-full">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
