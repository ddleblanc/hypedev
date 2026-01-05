"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-foreground">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-muted-foreground mb-6">
            An unexpected error occurred. We&apos;ve been notified and are working on a fix.
          </p>
          {error.digest && (
            <p className="text-sm text-muted-foreground mb-4">
              Error ID: {error.digest}
            </p>
          )}
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-6 p-4 bg-destructive/10 rounded text-left text-sm overflow-auto max-w-full">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
