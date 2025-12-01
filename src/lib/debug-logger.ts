// Debug logging utility for diagnosing strategy access and schema issues

export interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'auth' | 'schema' | 'strategy' | 'trade';
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: DebugLog[] = [];
  private maxLogs = 100;

  log(level: DebugLog['level'], category: DebugLog['category'], message: string, data?: any) {
    const logEntry: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console with appropriate level
    const consoleMessage = `[${category.toUpperCase()}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMessage, data);
        break;
      case 'warn':
        console.warn(consoleMessage, data);
        break;
      case 'info':
        console.info(consoleMessage, data);
        break;
      case 'debug':
        console.debug(consoleMessage, data);
        break;
    }
  }

  // Specific logging methods for different categories
  auth(message: string, data?: any) {
    this.log('info', 'auth', message, data);
  }

  schema(message: string, data?: any) {
    this.log('warn', 'schema', message, data);
  }

  strategy(message: string, data?: any) {
    this.log('info', 'strategy', message, data);
  }

  trade(message: string, data?: any) {
    this.log('info', 'trade', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', 'schema', message, data);
  }

  // Get all logs
  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Get logs by category
  getLogsByCategory(category: DebugLog['category']): DebugLog[] {
    return this.logs.filter(log => log.category === category);
  }

  // Get error logs specifically
  getErrorLogs(): DebugLog[] {
    return this.logs.filter(log => log.level === 'error');
  }
}

export const debugLogger = new DebugLogger();

// Export convenience functions
export const logAuth = (message: string, data?: any) => debugLogger.auth(message, data);
export const logSchema = (message: string, data?: any) => debugLogger.schema(message, data);
export const logStrategy = (message: string, data?: any) => debugLogger.strategy(message, data);
export const logTrade = (message: string, data?: any) => debugLogger.trade(message, data);
export const logError = (message: string, data?: any) => debugLogger.error(message, data);