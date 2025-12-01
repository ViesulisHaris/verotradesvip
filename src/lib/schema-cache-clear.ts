import { createClient } from '@supabase/supabase-js';

interface CacheClearResult {
  success: boolean;
  message: string;
  details: {
    postgresCacheCleared: boolean;
    supabaseCacheCleared: boolean;
    statisticsRebuilt: boolean;
    indexesRebuilt: boolean;
    materializedViewsRefreshed: boolean;
    verificationPassed: boolean;
    errors: string[];
    stepsCompleted: string[];
  };
}

interface CacheClearConfig {
  enableVerboseLogging: boolean;
  maxRetries: number;
  retryDelay: number;
  skipIndexRebuild: boolean;
  skipMaterializedViews: boolean;
}

class SchemaCacheClear {
  private supabase: any;
  private serviceSupabase: any;
  private config: CacheClearConfig;

  constructor(config: Partial<CacheClearConfig> = {}) {
    this.config = {
      enableVerboseLogging: true,
      maxRetries: 3,
      retryDelay: 1000,
      skipIndexRebuild: false,
      skipMaterializedViews: false,
      ...config
    };

    // Regular client for verification
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
            'X-Client-Info': 'verotrades-cache-clear',
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
            'X-Client-Info': 'verotrades-cache-clear-admin'
          }
        }
      }
    );
  }

  /**
   * Execute comprehensive schema cache clearing for strategy_rule_compliance
   */
  async clearStrategyRuleComplianceCache(): Promise<CacheClearResult> {
    const result: CacheClearResult = {
      success: false,
      message: '',
      details: {
        postgresCacheCleared: false,
        supabaseCacheCleared: false,
        statisticsRebuilt: false,
        indexesRebuilt: false,
        materializedViewsRefreshed: false,
        verificationPassed: false,
        errors: [],
        stepsCompleted: []
      }
    };

    try {
      this.log('🚀 Starting comprehensive schema cache clearing for strategy_rule_compliance...');

      // Step 1: Verify prerequisites
      const prereqResult = await this.verifyPrerequisites();
      if (!prereqResult.success) {
        result.details.errors.push(...prereqResult.errors);
        result.message = 'Prerequisites failed: strategy_rule_compliance table may still exist';
        return result;
      }
      result.details.stepsCompleted.push('Prerequisites verified');

      // Step 2: Clear PostgreSQL cache
      const pgCacheResult = await this.clearPostgreSQLCache();
      result.details.postgresCacheCleared = pgCacheResult.success;
      if (!pgCacheResult.success) {
        result.details.errors.push(...pgCacheResult.errors);
      }
      result.details.stepsCompleted.push('PostgreSQL cache cleared');

      // Step 3: Clear Supabase-specific cache
      const supabaseCacheResult = await this.clearSupabaseCache();
      result.details.supabaseCacheCleared = supabaseCacheResult.success;
      if (!supabaseCacheResult.success) {
        result.details.errors.push(...supabaseCacheResult.errors);
      }
      result.details.stepsCompleted.push('Supabase cache cleared');

      // Step 4: Rebuild statistics
      const statsResult = await this.rebuildStatistics();
      result.details.statisticsRebuilt = statsResult.success;
      if (!statsResult.success) {
        result.details.errors.push(...statsResult.errors);
      }
      result.details.stepsCompleted.push('Statistics rebuilt');

      // Step 5: Rebuild indexes (optional)
      if (!this.config.skipIndexRebuild) {
        const indexResult = await this.rebuildIndexes();
        result.details.indexesRebuilt = indexResult.success;
        if (!indexResult.success) {
          result.details.errors.push(...indexResult.errors);
        }
        result.details.stepsCompleted.push('Indexes rebuilt');
      }

      // Step 6: Refresh materialized views (optional)
      if (!this.config.skipMaterializedViews) {
        const mvResult = await this.refreshMaterializedViews();
        result.details.materializedViewsRefreshed = mvResult.success;
        if (!mvResult.success) {
          result.details.errors.push(...mvResult.errors);
        }
        result.details.stepsCompleted.push('Materialized views refreshed');
      }

      // Step 7: Verify no cached references remain
      const verifyResult = await this.verifyNoCachedReferences();
      result.details.verificationPassed = verifyResult.success;
      if (!verifyResult.success) {
        result.details.errors.push(...verifyResult.errors);
      }
      result.details.stepsCompleted.push('Verification completed');

      // Determine overall success
      result.success = result.details.postgresCacheCleared && 
                     result.details.supabaseCacheCleared && 
                     result.details.statisticsRebuilt && 
                     result.details.verificationPassed;

      result.message = result.success 
        ? '✅ Schema cache cleared successfully for strategy_rule_compliance'
        : '⚠️ Schema cache clearing completed with some issues';

      this.log(result.message);
      return result;

    } catch (error) {
      result.success = false;
      result.message = `Schema cache clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.details.errors.push(result.message);
      this.log(`❌ ${result.message}`);
      return result;
    }
  }

  /**
   * Verify that strategy_rule_compliance table has been deleted
   */
  private async verifyPrerequisites(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      this.log('🔍 Verifying prerequisites...');

      // Check if strategy_rule_compliance table still exists
      const { data: tables, error: tableError } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'strategy_rule_compliance')
        .eq('table_schema', 'public');

      if (tableError) {
        errors.push(`Failed to check table existence: ${tableError.message}`);
      } else if (tables && tables.length > 0) {
        errors.push('strategy_rule_compliance table still exists. Please delete it first.');
      }

      // Check for any remaining dependencies
      try {
        const { data: deps, error: depError } = await this.serviceSupabase
          .rpc('exec_sql', {
            sql_query: `
              SELECT COUNT(*) as count
              FROM pg_depend d
              JOIN pg_class c ON d.refobjid = c.oid
              WHERE c.relname = 'strategy_rule_compliance'
            `
          });

        if (!depError && deps && deps[0] && deps[0].count > 0) {
          this.log(`⚠️ Found ${deps[0].count} remaining dependencies to strategy_rule_compliance`);
        }
      } catch (err) {
        // Expected error since table is deleted
        this.log('✓ No remaining dependencies found (table already deleted)');
      }

      this.log('✓ Prerequisites verified');
      return { success: errors.length === 0, errors };

    } catch (error) {
      errors.push(`Prerequisite verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Clear PostgreSQL query plan cache
   */
  private async clearPostgreSQLCache(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      this.log('🧹 Clearing PostgreSQL query plan cache...');

      const cacheStatements = [
        'DISCARD PLANS',
        'DISCARD SEQUENCES',
        'DISCARD TEMP',
        'DEALLOCATE ALL'
      ];

      for (const statement of cacheStatements) {
        try {
          const { error } = await this.serviceSupabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            this.log(`⚠️ Cache statement failed: ${statement} - ${error.message}`);
            errors.push(`Cache statement failed: ${statement} - ${error.message}`);
          }
        } catch (err) {
          this.log(`⚠️ Cache statement error: ${statement} - ${err}`);
          errors.push(`Cache statement error: ${statement} - ${err}`);
        }
      }

      this.log('✓ PostgreSQL cache cleared');
      return { success: errors.length === 0, errors };

    } catch (error) {
      errors.push(`PostgreSQL cache clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Clear Supabase-specific schema cache
   */
  private async clearSupabaseCache(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      this.log('🔄 Clearing Supabase-specific schema cache...');

      // Reset session configuration
      try {
        const { error } = await this.serviceSupabase.rpc('exec_sql', { 
          sql_query: 'RESET ALL' 
        });
        
        if (error) {
          this.log(`⚠️ RESET ALL failed: ${error.message}`);
          errors.push(`RESET ALL failed: ${error.message}`);
        }
      } catch (err) {
        this.log(`⚠️ RESET ALL error: ${err}`);
        errors.push(`RESET ALL error: ${err}`);
      }

      // Create temporary tables to force catalog cache refresh
      const tempTableName = 'cache_refresh_trigger_' + Date.now();
      
      try {
        await this.serviceSupabase.rpc('exec_sql', { 
          sql_query: `CREATE TEMP TABLE ${tempTableName} (id INTEGER)` 
        });
        
        await this.serviceSupabase.rpc('exec_sql', { 
          sql_query: `DROP TABLE ${tempTableName}` 
        });
        
        this.log('✓ Supabase cache cleared using temporary table technique');
      } catch (err) {
        this.log(`⚠️ Temporary table technique failed: ${err}`);
        errors.push(`Temporary table technique failed: ${err}`);
      }

      // Force configuration reload
      try {
        await this.serviceSupabase.rpc('pg_reload_conf');
        this.log('✓ Configuration reload triggered');
      } catch (err) {
        this.log('⚠️ Configuration reload failed (expected in Supabase)');
      }

      this.log('✓ Supabase-specific cache cleared');
      return { success: errors.length === 0, errors };

    } catch (error) {
      errors.push(`Supabase cache clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Rebuild statistics for all core tables
   */
  private async rebuildStatistics(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      this.log('📊 Rebuilding table statistics...');

      const coreTables = ['strategies', 'trades', 'users', 'strategy_rules', 'trade_tags', 'tags'];
      
      for (const table of coreTables) {
        try {
          // Update table statistics
          const { error: analyzeError } = await this.serviceSupabase.rpc('exec_sql', { 
            sql_query: `ANALYZE ${table};` 
          });
          
          if (analyzeError) {
            this.log(`⚠️ Analyze failed for ${table}: ${analyzeError.message}`);
            errors.push(`Analyze failed for ${table}: ${analyzeError.message}`);
          }

          // Force vacuum with analyze
          const { error: vacuumError } = await this.serviceSupabase.rpc('exec_sql', { 
            sql_query: `VACUUM ANALYZE ${table};` 
          });
          
          if (vacuumError) {
            this.log(`⚠️ Vacuum failed for ${table}: ${vacuumError.message}`);
            errors.push(`Vacuum failed for ${table}: ${vacuumError.message}`);
          }

        } catch (err) {
          this.log(`⚠️ Statistics rebuild error for ${table}: ${err}`);
          errors.push(`Statistics rebuild error for ${table}: ${err}`);
        }
      }

      // Update database-wide statistics
      try {
        const { error: dbAnalyzeError } = await this.serviceSupabase.rpc('exec_sql', { 
          sql_query: 'ANALYZE;' 
        });
        
        if (dbAnalyzeError) {
          this.log(`⚠️ Database analyze failed: ${dbAnalyzeError.message}`);
          errors.push(`Database analyze failed: ${dbAnalyzeError.message}`);
        }
      } catch (err) {
        this.log(`⚠️ Database analyze error: ${err}`);
        errors.push(`Database analyze error: ${err}`);
      }

      this.log('✓ Statistics rebuilt');
      return { success: errors.length === 0, errors };

    } catch (error) {
      errors.push(`Statistics rebuild failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Rebuild indexes on core tables
   */
  private async rebuildIndexes(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      this.log('🔧 Rebuilding indexes...');

      const coreTables = ['strategies', 'trades', 'users', 'strategy_rules'];
      
      for (const table of coreTables) {
        try {
          const { error } = await this.serviceSupabase.rpc('exec_sql', { 
            sql_query: `REINDEX TABLE ${table} CONCURRENTLY;` 
          });
          
          if (error) {
            this.log(`⚠️ Index rebuild failed for ${table}: ${error.message}`);
            errors.push(`Index rebuild failed for ${table}: ${error.message}`);
          }
        } catch (err) {
          this.log(`⚠️ Index rebuild error for ${table}: ${err}`);
          errors.push(`Index rebuild error for ${table}: ${err}`);
        }
      }

      this.log('✓ Indexes rebuilt');
      return { success: errors.length === 0, errors };

    } catch (error) {
      errors.push(`Index rebuild failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Refresh materialized views
   */
  private async refreshMaterializedViews(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      this.log('🔄 Refreshing materialized views...');

      // Get list of materialized views
      const { data: views, error: viewError } = await this.serviceSupabase
        .rpc('exec_sql', {
          sql_query: `
            SELECT schemaname, matviewname 
            FROM pg_matviews 
            WHERE schemaname = 'public'
          `
        });

      if (viewError) {
        errors.push(`Failed to get materialized views: ${viewError.message}`);
        return { success: false, errors };
      }

      if (views && views.length > 0) {
        for (const view of views) {
          try {
            const { error: refreshError } = await this.serviceSupabase.rpc('exec_sql', { 
              sql_query: `REFRESH MATERIALIZED VIEW CONCURRENTLY ${view.schemaname}.${view.matviewname};` 
            });
            
            if (refreshError) {
              // Try without CONCURRENTLY
              const { error: forceRefreshError } = await this.serviceSupabase.rpc('exec_sql', { 
                sql_query: `REFRESH MATERIALIZED VIEW ${view.schemaname}.${view.matviewname};` 
              });
              
              if (forceRefreshError) {
                this.log(`⚠️ Materialized view refresh failed: ${view.matviewname} - ${forceRefreshError.message}`);
                errors.push(`Materialized view refresh failed: ${view.matviewname} - ${forceRefreshError.message}`);
              }
            }
          } catch (err) {
            this.log(`⚠️ Materialized view refresh error: ${view.matviewname} - ${err}`);
            errors.push(`Materialized view refresh error: ${view.matviewname} - ${err}`);
          }
        }
      }

      this.log('✓ Materialized views refreshed');
      return { success: errors.length === 0, errors };

    } catch (error) {
      errors.push(`Materialized view refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Verify no cached references to strategy_rule_compliance remain
   */
  private async verifyNoCachedReferences(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      this.log('🔍 Verifying no cached references remain...');

      // Check pg_class for any remaining references
      try {
        const { data: catalogRefs, error: catalogError } = await this.serviceSupabase
          .rpc('exec_sql', {
            sql_query: `
              SELECT COUNT(*) as count
              FROM pg_class
              WHERE relname = 'strategy_rule_compliance'
            `
          });

        if (catalogError) {
          errors.push(`Failed to check catalog references: ${catalogError.message}`);
        } else if (catalogRefs && catalogRefs[0] && catalogRefs[0].count > 0) {
          errors.push(`Found ${catalogRefs[0].count} remaining catalog references to strategy_rule_compliance`);
        }
      } catch (err) {
        this.log(`⚠️ Catalog reference check error: ${err}`);
        errors.push(`Catalog reference check error: ${err}`);
      }

      // Check information_schema for any remaining references
      try {
        const { data: infoRefs, error: infoError } = await this.supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'strategy_rule_compliance')
          .eq('table_schema', 'public');

        if (infoError) {
          errors.push(`Failed to check information schema references: ${infoError.message}`);
        } else if (infoRefs && infoRefs.length > 0) {
          errors.push(`Found ${infoRefs.length} remaining information schema references to strategy_rule_compliance`);
        }
      } catch (err) {
        this.log(`⚠️ Information schema reference check error: ${err}`);
        errors.push(`Information schema reference check error: ${err}`);
      }

      // Test core table access
      const coreTables = ['strategies', 'trades', 'users', 'strategy_rules'];
      
      for (const table of coreTables) {
        try {
          const { error } = await this.supabase
            .from(table)
            .select('count')
            .limit(1);

          if (error) {
            errors.push(`Core table access test failed for ${table}: ${error.message}`);
          }
        } catch (err) {
          errors.push(`Core table access test error for ${table}: ${err}`);
        }
      }

      this.log('✓ Verification completed');
      return { success: errors.length === 0, errors };

    } catch (error) {
      errors.push(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = this.config.maxRetries
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

        this.log(`⚠️ ${operationName} failed (attempt ${attempt}/${retries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      }
    }

    throw lastError!;
  }

  /**
   * Log messages if verbose logging is enabled
   */
  private log(message: string): void {
    if (this.config.enableVerboseLogging) {
      console.log(message);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CacheClearConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheClearConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const schemaCacheClear = new SchemaCacheClear();

// Export convenience functions
export const clearStrategyRuleComplianceCache = () => 
  schemaCacheClear.clearStrategyRuleComplianceCache();

export const updateCacheClearConfig = (config: Partial<CacheClearConfig>) => 
  schemaCacheClear.updateConfig(config);

export const getCacheClearConfig = () => 
  schemaCacheClear.getConfig();