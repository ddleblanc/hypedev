import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7b8292ab7821c02dbb00bc04026ecabc@o1296758.ingest.us.sentry.io/4510637906067456",

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay (optional)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Ignore common non-errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "ResizeObserver loop",
    // Network errors that aren't actionable
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // Wallet connection errors (common and expected)
    "User rejected",
    "User denied",
  ],

  // Add breadcrumbs for debugging
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
      return null;
    }
    return breadcrumb;
  },

  // Enhance errors with context
  beforeSend(event) {
    // Don't send in development unless explicitly enabled
    if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return null;
    }

    // Add wallet address if available
    if (typeof window !== "undefined") {
      const wallet = window.localStorage?.getItem("walletAddress");
      if (wallet) {
        event.user = { ...event.user, wallet };
      }
    }
    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

// Export navigation instrumentation hook
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
