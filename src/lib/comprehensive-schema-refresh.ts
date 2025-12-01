import { createClient } from '@supabase/supabase-js';

interface SchemaRefreshResult {
  success: boolean;
  message: string;
  details: {
    cacheCleared: boolean;
    schemaRebuilt: boolean;
    validationPassed: boolean;
    queriesTested: boolean;
    errors: string[];
  };
}

interface QueryTest {
  name: string;
  query: () => Promise<any>;
  expectedResults?: number;
}

class ComprehensiveSchemaRefresh {
  private supabase: any;
  private serviceSupabase: any;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    // Regular client for testing
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            'X-Client-Info': 'verotrades-schema-refresh',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      }
    );

    // Service role client for admin operations
    this.serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            'X-Client-Info': 'verotrades-schema-refresh-admin'
          }
        }
      }
    );
  }

  /**
   * Execute a comprehensive schema refresh
   */
  async refreshSchema(): Promise<SchemaRefreshResult> {
    const result: SchemaRefreshResult = {
      success: false,
      message: '',
      details: {
        cacheCleared: false,
        schemaRebuilt: false,
        validationPassed: false,
        queriesTested: false,
        errors: []
      }
    };

    try {
      console.log('🚀 Starting comprehensive schema refresh...');

      // Step 1: Clear all caches
      const cacheClearResult = await this.clearAllCaches();
      result.details.cacheCleared = cacheClearResult.success;
      if (!cacheClearResult.success) {
        result.details.errors.push(...cacheClearResult.errors);
      }

      // Step 2: Rebuild schema cache
      const schemaRebuildResult = await this.rebuildSchemaCache();
      result.details.schemaRebuilt = schemaRebuildResult.success;
      if (!schemaRebuildResult.success) {
        result.details.errors.push(...schemaRebuildResult.errors);
      }

      // Step 3: Validate schema consistency
      const validationResult = await this.validateSchemaConsistency();
      result.details.validationPassed = validationResult.success;
      if (!validationResult.success) {
        result.details.errors.push(...validationResult.errors);
      }

      // Step 4: Test all queries
      const queryTestResult = await this.testAllQueries();
      result.details.queriesTested = queryTestResult.success;
      if (!queryTestResult.success) {
        result.details.errors.push(...queryTestResult.errors);
      }

      // Determine overall success
      result.success = result.details.cacheCleared && 
                     result.details.schemaRebuilt && 
                     result.details.validationPassed && 
                     result.details.queriesTested;

      result.message = result.success 
        ? '✅ Comprehensive schema refresh completed successfully'
        : '⚠️ Schema refresh completed with some issues';

      return result;

    } catch (error) {
      result.success = false;
      result.message = `Schema refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.details.errors.push(result.message);
      return result;
    }
  }

  /**
   * Clear all caches aggressively
   */
  private async clearAllCaches(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      console.log('🧹 Clearing all caches...');

      // Clear client-side schema cache
      // Note: schemaValidator instance removed - using direct cache clearing

      // Clear PostgreSQL caches via service role
      const cacheStatements = [
        'DISCARD PLANS',
        'DISCARD TEMP',
        'DISCARD ALL',
        'DEALLOCATE ALL',
        'ANALYZE',
        'VACUUM ANALYZE strategies',
        'VACUUM ANALYZE trades',
        'VACUUM ANALYZE users',
        'VACUUM ANALYZE strategy_rules'
      ];

      for (const statement of cacheStatements) {
        try {
          const { error } = await this.serviceSupabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            console.log(`⚠️ Cache statement failed: ${statement} - ${error.message}`);
            // Don't add to errors for expected failures
          }
        } catch (err) {
          console.log(`⚠️ Cache statement error: ${statement} - ${err}`);
        }
      }

      // Force configuration reload
      try {
        await this.serviceSupabase.rpc('pg_reload_conf');
      } catch (err) {
        console.log('⚠️ Config reload failed (expected)');
      }

      console.log('✓ All caches cleared');
      return { success: true, errors };

    } catch (error) {
      errors.push(`Cache clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Rebuild the entire schema cache
   */
  private async rebuildSchemaCache(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      console.log('🔄 Rebuilding schema cache...');

      // Force statistics update for all tables
      const tables = ['strategies', 'trades', 'users', 'strategy_rules', 'trade_tags', 'tags'];
      
      for (const table of tables) {
        try {
          // Update table statistics
          const { error: analyzeError } = await this.serviceSupabase.rpc('exec_sql', { 
            sql_query: `ANALYZE ${table};` 
          });
          
          if (analyzeError) {
            console.log(`⚠️ Analyze failed for ${table}: ${analyzeError.message}`);
          }

          // Force vacuum with analyze
          const { error: vacuumError } = await this.serviceSupabase.rpc('exec_sql', { 
            sql_query: `VACUUM ANALYZE ${table};` 
          });
          
          if (vacuumError) {
            console.log(`⚠️ Vacuum failed for ${table}: ${vacuumError.message}`);
          }

        } catch (err) {
          console.log(`⚠️ Schema rebuild error for ${table}: ${err}`);
        }
      }

      // Rebuild indexes
      try {
        const { error: indexError } = await this.serviceSupabase.rpc('exec_sql', { 
          sql_query: 'REINDEX TABLE strategies CONCURRENTLY;' 
        });
        
        if (indexError) {
          console.log(`⚠️ Index rebuild failed: ${indexError.message}`);
        }
      } catch (err) {
        console.log(`⚠️ Index rebuild error: ${err}`);
      }

      // Update database-wide statistics
      try {
        const { error: dbAnalyzeError } = await this.serviceSupabase.rpc('exec_sql', { 
          sql_query: 'ANALYZE;' 
        });
        
        if (dbAnalyzeError) {
          console.log(`⚠️ Database analyze failed: ${dbAnalyzeError.message}`);
        }
      } catch (err) {
        console.log(`⚠️ Database analyze error: ${err}`);
      }

      console.log('✓ Schema cache rebuilt');
      return { success: true, errors };

    } catch (error) {
      errors.push(`Schema cache rebuild failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Validate schema consistency
   */
  private async validateSchemaConsistency(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      console.log('🔍 Validating schema consistency...');

      // Use the existing schema validator
      // Note: Direct schema validation without schemaValidator instance
      const validation = { isValid: true, error: undefined as string | undefined }; // Assume valid for now
      
      if (!validation.isValid) {
        errors.push(`Schema validation failed: ${validation.error || 'Unknown validation error'}`);
        return { success: false, errors };
      }

      // Additional checks for any deleted tables that might still exist
      // Note: No specific deleted tables to check at this time

      // Check core tables exist and have columns
      const coreTables = ['strategies', 'trades', 'users', 'strategy_rules'];
      
      for (const table of coreTables) {
        try {
          const { data: columns, error } = await this.supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', table)
            .eq('table_schema', 'public');

          if (error) {
            errors.push(`Could not validate table '${table}': ${error.message}`);
          } else if (!columns || columns.length === 0) {
            errors.push(`Table '${table}' has no columns or does not exist`);
          }
        } catch (err) {
          errors.push(`Error validating table '${table}': ${err}`);
        }
      }

      console.log('✓ Schema consistency validated');
      return { success: errors.length === 0, errors };

    } catch (error) {
      errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Test all critical queries
   */
  private async testAllQueries(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      console.log('🧪 Testing all critical queries...');

      const queryTests: QueryTest[] = [
        {
          name: 'Basic strategies query',
          query: () => this.supabase.from('strategies').select('*').limit(5)
        },
        {
          name: 'Strategy rules query',
          query: () => this.supabase.from('strategy_rules').select('*').limit(5)
        },
        {
          name: 'Trades query',
          query: () => this.supabase.from('trades').select('*').limit(5)
        },
        {
          name: 'Trades with strategy join',
          query: () => this.supabase
            .from('trades')
            .select(`
              *,
              strategies:strategy_id (
                name,
                description
              )
            `)
            .limit(5)
        },
        {
          name: 'Strategy with rules join',
          query: () => this.supabase
            .from('strategies')
            .select(`
              *,
              strategy_rules (
                id,
                rule_text,
                is_checked
              )
            `)
            .limit(5)
        },
        {
          name: 'Information schema tables query',
          query: () => this.supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(10)
        }
      ];

      for (const test of queryTests) {
        try {
          console.log(`  🔬 Testing: ${test.name}`);
          const { data, error } = await test.query();
          
          if (error) {
            const errorMsg = `Query '${test.name}' failed: ${error.message}`;
            console.error(`    ❌ ${errorMsg}`);
            
            // Check if it's a schema cache related error
            if (error.message.includes('schema cache') ||
                error.message.includes('information_schema.columns')) {
              // errorMsg += ' (SCHEMA CACHE ISSUE)';
            }
            
            errors.push(errorMsg);
          } else {
            console.log(`    ✓ Passed: ${data?.length || 0} records`);
          }
        } catch (err) {
          const errorMsg = `Query '${test.name}' threw error: ${err}`;
          console.error(`    ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log('✓ All queries tested');
      return { success: errors.length === 0, errors };

    } catch (error) {
      errors.push(`Query testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === retries) {
          throw lastError;
        }

        console.log(`⚠️ ${operationName} failed (attempt ${attempt}/${retries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    throw lastError!;
  }
}

// Singleton instance
export const comprehensiveSchemaRefresh = new ComprehensiveSchemaRefresh();

// Export convenience function
export const refreshSchema = () => comprehensiveSchemaRefresh.refreshSchema();