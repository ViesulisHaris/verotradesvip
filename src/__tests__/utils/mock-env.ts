// Mock environment variables and types for testing
// This file helps resolve TypeScript issues with Jest globals

// Declare Jest global types
declare global {
  var jest: {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => jest.Mock<T>;
    mock: (module: string) => any;
    spyOn: (obj: any, method: string) => any;
    clearAllMocks: () => void;
    resetModules: () => void;
    useFakeTimers: () => void;
    useRealTimers: () => void;
    runAllTimers: () => void;
    advanceTimersByTime: (ms: number) => void;
    setTimeout: (fn: Function, delay: number) => NodeJS.Timeout;
    clearTimeout: (id: NodeJS.Timeout) => void;
    setInterval: (fn: Function, delay: number) => NodeJS.Timeout;
    clearInterval: (id: NodeJS.Timeout) => void;
  };

  var beforeAll: (fn: () => void) => void;
  var afterAll: (fn: () => void) => void;
  var beforeEach: (fn: () => void) => void;
  var afterEach: (fn: () => void) => void;
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void) => void;
  var test: (name: string, fn: () => void) => void;
  var expect: (actual: any) => jest.Matchers;
  var console: Console;
}

// Extend Jest Mock interface
declare namespace jest {
  interface Mock<T extends (...args: any[]) = any> {
    (...args: Parameters<T>): ReturnType<T>;
    mock: {
      calls: Array<Parameters<T>>;
      results: Array<{ type: 'return' | 'throw'; value: ReturnType<T> | Error }>;
      instances: any[];
    };
    mockImplementation: (fn: T) => this;
    mockReturnThis: () => this;
    mockReturnValue: (value: ReturnType<T>) => this;
    mockResolvedValue: (value: ReturnType<T>) => this;
    mockRejectedValue: (value: any) => this;
    mockRestore: () => void;
    mockClear: () => void;
    mockReset: () => void;
    getMockName: () => string;
    mockName: (name: string) => this;
    calledWith: (...args: any[]) => boolean;
    beenCalled: boolean;
    times: number;
  }

  interface Matchers {
    toBe: (expected: any) => void;
    toEqual: (expected: any) => void;
    toStrictEqual: (expected: any) => void;
    toHaveBeenCalled: () => void;
    toHaveBeenCalledTimes: (count: number) => void;
    toHaveBeenCalledWith: (...args: any[]) => void;
    lastCalledWith: (...args: any[]) => void;
    toHaveProperty: (prop: string | string[], value?: any) => void;
    toMatch: (pattern: string | RegExp) => void;
    toContain: (item: any) => void;
    toContainEqual: (item: any) => void;
    toBeDefined: () => void;
    toBeUndefined: () => void;
    toBeNull: () => void;
    toBeTruthy: () => void;
    toBeFalsy: () => void;
    toBeGreaterThan: (expected: number) => void;
    toBeGreaterThanOrEqual: (expected: number) => void;
    toBeLessThan: (expected: number) => void;
    toBeLessThanOrEqual: (expected: number) => void;
    toBeCloseTo: (expected: number, precision?: number) => void;
    toThrow: (expected?: string | RegExp | Error) => void;
    toThrowError: (expected?: string | RegExp | Error) => void;
    not: Matchers;
    resolves: Matchers;
    rejects: Matchers;
  }
}

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
    getComputedStyle: (element: Element) => CSSStyleDeclaration;
    requestAnimationFrame: (callback: FrameRequestCallback) => number;
    cancelAnimationFrame: (id: number) => void;
    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  }

  interface MediaQueryList {
    matches: boolean;
    media: string;
    onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null;
    addListener: (listener: () => void) => void;
    removeListener: (listener: () => void) => void;
    addEventListener: (type: string, listener: () => void) => void;
    removeEventListener: (type: string, listener: () => void) => void;
    dispatchEvent: (event: Event) => void;
  }

  interface CSSStyleDeclaration {
    getPropertyValue: (property: string) => string;
  }
}

// Mock Node.js globals
declare const setImmediate: (callback: () => void) => any;
declare const clearImmediate: (id: any) => void;

// Export empty object to make this a module
export {};