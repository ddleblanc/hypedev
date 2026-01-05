import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock handlers for external services
export const handlers = [
  // Mock Elympics API
  http.post("https://api.elympics.ai/*", () => {
    return HttpResponse.json({ success: true });
  }),

  // Mock Thirdweb API (if needed)
  http.get("https://contract.thirdweb.com/*", () => {
    return HttpResponse.json({ success: true });
  }),
];

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));

// Reset handlers after each test (important for test isolation)
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next/image
vi.mock("next/image", () => {
  const MockImage = (props: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    const { src, alt, ...rest } = props;
    // Using createElement to avoid JSX in .ts file
    const React = require("react");
    return React.createElement("img", { src, alt, ...rest });
  };
  MockImage.displayName = "MockImage";
  return { default: MockImage };
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
}));
