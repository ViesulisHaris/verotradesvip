// Webpack global type declarations
export interface WebpackModule {
  factory?: (...args: any[]) => any;
  exports?: any;
  hot?: any;
}

export interface WebpackRequire {
  (moduleId: number | string): any;
  cache: Record<number | string, WebpackModule>;
}

declare global {
  var __webpack_require__: WebpackRequire;
}