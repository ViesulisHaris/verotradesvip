// Mock environment variables and types for testing
// This file helps resolve TypeScript issues with Jest globals

// Mock performance API for Node.js environment
declare const performance: {
  now: () => number;
  timing: {
    navigationStart: number;
    loadEventEnd: number;
  };
  getEntriesByType: (type: string) => any[];
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

// Mock crypto API for Node.js environment
declare const crypto: {
  randomUUID: () => string;
  getRandomValues: (array: Uint32Array) => void;
};

// Mock TextEncoder/TextDecoder
declare const TextEncoder: any;
declare const TextDecoder: any;

// Mock IntersectionObserver
declare class IntersectionObserver {
  constructor(callback: (entries: any[]) => void);
  observe(element: Element): void;
  unobserve(element: Element): void;
  disconnect(): void;
}

// Mock ResizeObserver
declare class ResizeObserver {
  observe(element: Element): void;
  unobserve(element: Element): void;
  disconnect(): void;
}

// Mock URLSearchParams
declare class URLSearchParams {
  constructor(init?: string | Record<string, string>);
  get(name: string): string | null;
  set(name: string, value: string): void;
  delete(name: string): void;
  has(name: string): boolean;
  toString(): string;
}

// Mock localStorage
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  length: number;
  key(index: number): string | null;
}

declare const localStorage: Storage;
declare const sessionStorage: Storage;

// Mock window object extensions
declare global {
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
    getComputedStyle: (elt: Element, pseudoElt?: string | null) => CSSStyleDeclaration;
    requestAnimationFrame: (callback: FrameRequestCallback) => number;
    cancelAnimationFrame: (id: number) => void;
    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  }
}

// Mock Node.js globals
declare const setImmediate: (callback: () => void) => any;
declare const clearImmediate: (id: any) => void;

// Export empty object to make this a module
export {};