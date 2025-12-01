/**
 * Comprehensive Strategy Error Logger
 * Provides enhanced error logging for strategy-related operations
 */

import { logAuth, logStrategy, logError } from './debug-logger';

export interface StrategyErrorContext {
  operation: 'create' | 'read' | 'update' | 'delete' | 'access' | 'performance';
  strategyId?: string;
  strategyName?: string;
  userId?: string;
  error?: any;
  timestamp?: string;
  additionalData?: Record<string, any>;
}

export class StrategyErrorLogger {
  /**
   * Log strategy operation success
   */
  static logSuccess(context: Omit<StrategyErrorContext, 'error'>) {
    const logData = {
      ...context,
      timestamp: context.timestamp || new Date().toISOString(),
      status: 'success'
    };

    logStrategy(`Strategy ${context.operation} successful`, logData);
  }

  /**
   * Log strategy operation error with enhanced context
   */
  static logError(context: StrategyErrorContext) {
    if (!context.error) {
      console.warn('StrategyErrorLogger.logError called without error object');
      return;
    }

    const logData = {
      operation: context.operation,
      strategyId: context.strategyId,
      strategyName: context.strategyName,
      userId: context.userId,
      error: context.error.message || 'Unknown error',
      code: context.error.code,
      details: context.error.details,
      hint: context.error.hint,
      timestamp: context.timestamp || new Date().toISOString(),
      status: 'error',
      ...context.additionalData
    };

    // Enhanced error categorization
    const errorCategory = this.categorizeError(context.error);
    (logData as any).errorCategory = errorCategory;

    logError(`Strategy ${context.operation} error`, logData);

    // Return user-friendly message based on error category
    return this.getUserFriendlyMessage(context.error, context.operation);
  }

  /**
   * Categorize errors for better analysis
   */
  private static categorizeError(error: any): string {
    if (!error) return 'unknown';

    const message = (error.message || '').toLowerCase();
    const code = error.code;

    // Permission errors
    if (code === '42501' || message.includes('permission')) {
      return 'permission_denied';
    }

    // Not found errors
    if (code === 'PGRST116' || message.includes('not found')) {
      return 'not_found';
    }

    // Schema cache issues (generic detection for any deleted table references)
    if (message.includes('relation does not exist') ||
        message.includes('does not exist') ||
        message.includes('invalid input syntax for type uuid') ||
        message.includes('undefined')) {
      return 'schema_cache_issue';
    }

    // Constraint violations
    if (code === '23505' || message.includes('duplicate') || message.includes('unique')) {
      return 'constraint_violation';
    }

    // Validation errors
    if (code === '23514' || message.includes('check constraint')) {
      return 'validation_error';
    }

    // Database connection issues
    if (message.includes('connection') || message.includes('timeout')) {
      return 'database_connection';
    }

    // Authentication issues
    if (message.includes('auth') || message.includes('jwt') || message.includes('token')) {
      return 'authentication';
    }

    return 'unknown';
  }

  /**
   * Generate user-friendly error messages
   */
  private static getUserFriendlyMessage(error: any, operation: string): string {
    const category = this.categorizeError(error);
    const message = error.message || 'Unknown error occurred';

    switch (category) {
      case 'permission_denied':
        return `You don't have permission to ${operation} this strategy.`;

      case 'not_found':
        return `The strategy you're trying to ${operation} was not found. It may have been deleted.`;

      case 'schema_cache_issue':
        return 'Database schema issue detected. Please try refreshing the page or contact support if the issue persists.';

      case 'constraint_violation':
        if (message.includes('name')) {
          return 'A strategy with this name already exists. Please choose a different name.';
        }
        return 'Data constraint violation. Please check your input and try again.';

      case 'validation_error':
        return 'Invalid data provided. Please check all fields and try again.';

      case 'database_connection':
        return 'Database connection issue. Please check your internet connection and try again.';

      case 'authentication':
        return 'Authentication required. Please log in and try again.';

      default:
        return `An error occurred while trying to ${operation} the strategy: ${message}. Please try again or contact support if the issue persists.`;
    }
  }

  /**
   * Log permission check
   */
  static logPermissionCheck(strategyId: string, userId: string, hasPermission: boolean) {
    logAuth('Strategy permission check', {
      strategyId,
      userId,
      hasPermission,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log schema cache issue detection
   */
  static logSchemaCacheIssue(operation: string, error: any, context?: any) {
    logError('SCHEMA CACHE ISSUE DETECTED', {
      operation,
      error: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
  }

  /**
   * Log performance metrics
   */
  static logPerformanceMetrics(operation: string, duration: number, success: boolean, context?: any) {
    logStrategy(`Strategy ${operation} performance`, {
      operation,
      duration: `${duration}ms`,
      success,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Higher-order function to wrap strategy operations with error logging
 */
export function withStrategyErrorLogging<T extends any[], R>(
  operation: StrategyErrorContext['operation'],
  fn: (...args: T) => Promise<R>,
  context?: Partial<StrategyErrorContext>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const operationContext: StrategyErrorContext = {
      operation,
      ...context,
      timestamp: new Date().toISOString()
    };

    try {
      const result = await fn(...args);
      
      // Log success with performance metrics
      const duration = Date.now() - startTime;
      StrategyErrorLogger.logPerformanceMetrics(operation, duration, true, context);
      StrategyErrorLogger.logSuccess(operationContext);

      return result;
    } catch (error) {
      // Log error with performance metrics
      const duration = Date.now() - startTime;
      StrategyErrorLogger.logPerformanceMetrics(operation, duration, false, context);
      
      const userMessage = StrategyErrorLogger.logError({
        ...operationContext,
        error,
        additionalData: {
          args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg),
          duration: `${duration}ms`
        }
      });

      // Re-throw with user-friendly message
      throw new Error(userMessage);
    }
  };
}