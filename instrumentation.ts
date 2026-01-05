import * as Sentry from "@sentry/nextjs";

// Validate environment variables on startup
// This import triggers validation and will throw in production if required vars are missing
import "@/lib/env";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize Sentry for server
    Sentry.init({
      dsn: process.env.SENTRY_DSN || "https://7b8292ab7821c02dbb00bc04026ecabc@o1296758.ingest.us.sentry.io/4510637906067456",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DEBUG) {
          return null;
        }
        return event;
      },
      ignoreErrors: ["NEXT_NOT_FOUND", "NEXT_REDIRECT"],
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Initialize Sentry for edge
    Sentry.init({
      dsn: process.env.SENTRY_DSN || "https://7b8292ab7821c02dbb00bc04026ecabc@o1296758.ingest.us.sentry.io/4510637906067456",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DEBUG) {
          return null;
        }
        return event;
      },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
