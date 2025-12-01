import { createClient } from '@supabase/supabase-js';

interface FallbackQueryResult<T = any> {
  data: T | null;
  error: any;
  usedFallback: boolean;
  fallbackReason?: string;
}

interface FallbackConfig {
  enableFallback: boolean;
  maxRetries: number;
  retryDelay: number;
  fallbackTimeout: number;
}

class SchemaCacheFallback {
  private supabase: any;
  private fallbackSupabase: any;
  private config: FallbackConfig;
  private fallbackStats = {
    totalQueries: 0,
    fallbackUsed: 0,
    fallbackSuccess: 0,
    fallbackFailed: 0
  };

  constructor(config: Partial<FallbackConfig> = {}) {
    console.log('🔍 [DEBUG] SchemaCacheFallback constructor - Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    });

    this.config = {
      enableFallback: true,
      maxRetries: 3,
      retryDelay: 1000,
      fallbackTimeout: 10000,
      ...config
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';

    if (!supabaseUrl) {
      console.error('❌ [ERROR] SchemaCacheFallback: NEXT_PUBLIC_SUPABASE_URL is missing');
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for SchemaCacheFallback');
    }

    if (!supabaseAnonKey) {
      console.error('❌ [ERROR] SchemaCacheFallback: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required for SchemaCacheFallback');
    }

    console.log('✅ [DEBUG] SchemaCacheFallback: Creating primary Supabase client');
    // Primary Supabase client
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'verotrades-primary',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    });

    console.log('✅ [DEBUG] SchemaCacheFallback: Creating fallback Supabase client');
    // Fallback Supabase client with different configuration
    this.fallbackSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'verotrades-fallback',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Schema-Bypass': 'true'
        }
      },
      db: {
        schema: 'public'
      }
    });
  }

  /**
   * Execute query with automatic fallback to bypass schema cache
   */
  async executeWithFallback<T = any>(
    queryFn: (client: any) => Promise<any>,
    tableName: string,
    operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
  ): Promise<any> {
    this.fallbackStats.totalQueries++;

    // First attempt with primary client
    try {
      const result = await queryFn(this.supabase);
      
      if (!result.error) {
        return {
          data: result.data,
          error: null,
          usedFallback: false
        };
      }

      // Check if error is schema cache related
      if (this.isSchemaCacheError(result.error)) {
        console.warn(`⚠️ Schema cache error detected for ${tableName}:`, result.error.message);
        return await this.executeFallback(queryFn, tableName, operation, result.error.message);
      }

      // Non-schema error, return as-is
      return {
        data: result.data,
        error: result.error,
        usedFallback: false
      };

    } catch (error) {
      // Check if exception is schema cache related
      if (this.isSchemaCacheError(error)) {
        console.warn(`⚠️ Schema cache exception detected for ${tableName}:`, error);
        const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error);
        return await this.executeFallback(queryFn, tableName, operation, errorMessage || 'Unknown error');
      }

      // Non-schema exception, return as-is
      return {
        data: null,
        error,
        usedFallback: false
      };
    }
  }

  /**
   * Execute fallback query with cache bypass
   */
  private async executeFallback<T = any>(
    queryFn: (client: any) => Promise<{ data: T | null; error: any }>,
    tableName: string,
    operation: string,
    reason: string
  ): Promise<FallbackQueryResult<T>> {
    if (!this.config.enableFallback) {
      return {
        data: null,
        error: { message: 'Schema cache error and fallback is disabled' },
        usedFallback: false,
        fallbackReason: reason
      };
    }

    this.fallbackStats.fallbackUsed++;
    console.log(`🔄 Using fallback for ${tableName} due to: ${reason}`);

    try {
      // Add delay to allow cache to settle
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));

      // Execute with fallback client
      const fallbackResult = await Promise.race([
        queryFn(this.fallbackSupabase),
        new Promise<{ data: null; error: { message: string } }>((_, reject) =>
          setTimeout(() => reject({ message: 'Fallback query timeout' }), this.config.fallbackTimeout)
        )
      ]);

      if (!fallbackResult.error) {
        this.fallbackStats.fallbackSuccess++;
        console.log(`✅ Fallback successful for ${tableName}`);
        return {
          data: fallbackResult.data,
          error: null,
          usedFallback: true,
          fallbackReason: reason
        };
      }

      // Fallback also failed, try with direct SQL
      return await this.executeDirectSQLFallback(tableName, operation, reason);

    } catch (error) {
      this.fallbackStats.fallbackFailed++;
      console.error(`❌ Fallback failed for ${tableName}:`, error);
      
      return {
        data: null,
        error,
        usedFallback: true,
        fallbackReason: reason
      };
    }
  }

  /**
   * Execute direct SQL fallback as last resort
   */
  private async executeDirectSQLFallback<T = any>(
    tableName: string,
    operation: string,
    originalReason: string
  ): Promise<FallbackQueryResult<T>> {
    console.log(`🔧 Using direct SQL fallback for ${tableName}`);

    try {
      // Create service role client for direct SQL execution
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          global: {
            headers: {
              'X-Client-Info': 'verotrades-direct-sql',
              'X-Direct-SQL': 'true'
            }
          }
        }
      );

      let sqlQuery = '';
      
      switch (operation) {
        case 'select':
          sqlQuery = `SELECT * FROM ${tableName} LIMIT 5;`;
          break;
        case 'insert':
          // For insert operations, we can't provide a generic query
          throw new Error('Direct SQL fallback not available for insert operations');
        case 'update':
          // For update operations, we can't provide a generic query
          throw new Error('Direct SQL fallback not available for update operations');
        case 'delete':
          // For delete operations, we can't provide a generic query
          throw new Error('Direct SQL fallback not available for delete operations');
        default:
          sqlQuery = `SELECT * FROM ${tableName} LIMIT 5;`;
      }

      const { data, error } = await serviceClient.rpc('exec_sql', { 
        sql_query: sqlQuery 
      });

      if (!error) {
        this.fallbackStats.fallbackSuccess++;
        console.log(`✅ Direct SQL fallback successful for ${tableName}`);
        return {
          data: data as T,
          error: null,
          usedFallback: true,
          fallbackReason: `${originalReason} (direct SQL)`
        };
      }

      throw error;

    } catch (error) {
      this.fallbackStats.fallbackFailed++;
      console.error(`❌ Direct SQL fallback failed for ${tableName}:`, error);
      
      return {
        data: null,
        error,
        usedFallback: true,
        fallbackReason: `${originalReason} (direct SQL failed)`
      };
    }
  }

  /**
   * Check if error is related to schema cache
   */
  private isSchemaCacheError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    
    const schemaCacheIndicators = [
      'schema cache',
      'information_schema.columns',
      'relation does not exist',
      'does not exist',
      'cached',
      'cache'
    ];

    return schemaCacheIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * Execute multiple queries with fallback for each
   */
  async executeMultipleWithFallback<T = any>(
    queries: Array<{
      queryFn: (client: any) => Promise<{ data: T | null; error: any }>;
      tableName: string;
      operation?: 'select' | 'insert' | 'update' | 'delete';
    }>
  ): Promise<Array<FallbackQueryResult<T>>> {
    const results: Array<FallbackQueryResult<T>> = [];

    for (const query of queries) {
      const result = await this.executeWithFallback(
        query.queryFn,
        query.tableName,
        query.operation || 'select'
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Test all core tables with fallback
   */
  async testAllTablesWithFallback(): Promise<{
    results: Array<{ table: string; result: FallbackQueryResult }>;
    summary: { total: number; success: number; fallbackUsed: number; failed: number };
  }> {
    const coreTables = ['strategies', 'trades', 'users', 'strategy_rules'];
    const results: Array<{ table: string; result: FallbackQueryResult }> = [];

    for (const table of coreTables) {
      const result = await this.executeWithFallback(
        (client) => client.from(table).select('*').limit(5),
        table,
        'select'
      );
      
      results.push({ table, result });
    }

    const summary = {
      total: results.length,
      success: results.filter(r => !r.result.error).length,
      fallbackUsed: results.filter(r => r.result.usedFallback).length,
      failed: results.filter(r => r.result.error).length
    };

    return { results, summary };
  }

  /**
   * Get fallback statistics
   */
  getFallbackStats() {
    return {
      ...this.fallbackStats,
      fallbackUsageRate: this.fallbackStats.totalQueries > 0 
        ? (this.fallbackStats.fallbackUsed / this.fallbackStats.totalQueries * 100).toFixed(2) + '%'
        : '0%',
      fallbackSuccessRate: this.fallbackStats.fallbackUsed > 0
        ? (this.fallbackStats.fallbackSuccess / this.fallbackStats.fallbackUsed * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset fallback statistics
   */
  resetStats(): void {
    this.fallbackStats = {
      totalQueries: 0,
      fallbackUsed: 0,
      fallbackSuccess: 0,
      fallbackFailed: 0
    };
  }

  /**
   * Update fallback configuration
   */
  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Force clear all caches
   */
  async clearAllCaches(): Promise<void> {
    try {
      // Clear primary client cache
      await this.supabase.rpc('exec_sql', { sql_query: 'DISCARD ALL;' });
      
      // Clear fallback client cache
      await this.fallbackSupabase.rpc('exec_sql', { sql_query: 'DISCARD ALL;' });
      
      console.log('✓ All caches cleared');
    } catch (error) {
      console.warn('⚠️ Cache clear failed (expected):', error);
    }
  }
}

// Singleton instance
export const schemaCacheFallback = new SchemaCacheFallback();

// Export convenience functions
export const executeWithFallback = <T = any>(
  queryFn: (client: any) => Promise<{ data: T | null; error: any }>,
  tableName: string,
  operation?: 'select' | 'insert' | 'update' | 'delete'
) => schemaCacheFallback.executeWithFallback(queryFn, tableName, operation);

export const testAllTablesWithFallback = () => schemaCacheFallback.testAllTablesWithFallback();
export const getFallbackStats = () => schemaCacheFallback.getFallbackStats();
export const clearAllCaches = () => schemaCacheFallback.clearAllCaches();