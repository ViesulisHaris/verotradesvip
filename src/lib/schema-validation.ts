import { createClient } from '@supabase/supabase-js';
import { sanitizeUUID } from './uuid-validation';

interface SchemaInfo {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
  lastValidated: number;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  schemaInfo?: SchemaInfo;
  resolution?: string;
}

interface SchemaInconsistency {
  type: 'missing_table' | 'extra_table' | 'column_mismatch' | 'cache_issue';
  tableName: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution?: string;
}

class SchemaValidator {
  private supabase: any;
  private serviceSupabase: any;
  private schemaCache: Map<string, SchemaInfo> = new Map();
  private cacheTimeoutMs = 5 * 60 * 1000; // 5 minutes
  private knownTables = [
    'strategies',
    'trades',
    'users',
    'strategy_rules',
    'trade_tags',
    'tags'
  ];
  private deletedTables = [
    // No deleted tables to track
  ];
  private expectedColumns: Map<string, Array<{name: string, type: string, nullable: boolean}>> = new Map();

  constructor() {
    console.log('🔍 [DEBUG] SchemaValidator constructor - Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error('❌ [ERROR] SchemaValidator: NEXT_PUBLIC_SUPABASE_URL is missing');
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for SchemaValidator');
    }

    if (!supabaseAnonKey) {
      console.error('❌ [ERROR] SchemaValidator: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required for SchemaValidator');
    }

    console.log('✅ [DEBUG] SchemaValidator: Creating primary Supabase client');
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'verotrades-schema-validator',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    });

    console.log('✅ [DEBUG] SchemaValidator: Creating service role Supabase client');
    // Service role client for admin operations
    // Only create service role client if key is available
    if (serviceRoleKey) {
      this.serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            'X-Client-Info': 'verotrades-schema-validator-admin'
          }
        }
      });
      console.log('✅ [DEBUG] SchemaValidator: Service role client created successfully');
    } else {
      console.warn('⚠️ [DEBUG] SchemaValidator: SUPABASE_SERVICE_ROLE_KEY not available, skipping service role client creation');
      // Create a fallback client using anon key for basic operations
      this.serviceSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            'X-Client-Info': 'verotrades-schema-validator-fallback'
          }
        }
      });
      console.log('✅ [DEBUG] SchemaValidator: Fallback client created using anon key');
    }

    console.log('✅ [DEBUG] SchemaValidator: Initializing expected column definitions');
    // Initialize expected column definitions
    this.initializeExpectedColumns();
  }

  /**
   * Initialize expected column definitions for core tables
   */
  private initializeExpectedColumns(): void {
    // Strategies table expected columns
    this.expectedColumns.set('strategies', [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'user_id', type: 'uuid', nullable: false },
      { name: 'name', type: 'text', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'rules', type: 'ARRAY', nullable: true },
      { name: 'winrate_min', type: 'numeric', nullable: true },
      { name: 'winrate_max', type: 'numeric', nullable: true },
      { name: 'profit_factor_min', type: 'numeric', nullable: true },
      { name: 'net_pnl_min', type: 'numeric', nullable: true },
      { name: 'net_pnl_max', type: 'numeric', nullable: true },
      { name: 'max_drawdown_max', type: 'numeric', nullable: true },
      { name: 'sharpe_ratio_min', type: 'numeric', nullable: true },
      { name: 'avg_hold_period_min', type: 'numeric', nullable: true },
      { name: 'avg_hold_period_max', type: 'numeric', nullable: true },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false }
    ]);

    // Trades table expected columns
    this.expectedColumns.set('trades', [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'user_id', type: 'uuid', nullable: false },
      { name: 'market', type: 'text', nullable: false },
      { name: 'symbol', type: 'text', nullable: false },
      { name: 'strategy_id', type: 'uuid', nullable: true },
      { name: 'trade_date', type: 'date', nullable: false },
      { name: 'side', type: 'text', nullable: true },
      { name: 'quantity', type: 'numeric', nullable: true },
      { name: 'entry_price', type: 'numeric', nullable: true },
      { name: 'exit_price', type: 'numeric', nullable: true },
      { name: 'pnl', type: 'numeric', nullable: true },
      { name: 'entry_time', type: 'time', nullable: true },
      { name: 'exit_time', type: 'time', nullable: true },
      { name: 'emotional_state', type: 'ARRAY', nullable: true },
      { name: 'notes', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: false }
    ]);

    // Strategy rules table expected columns
    this.expectedColumns.set('strategy_rules', [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'strategy_id', type: 'uuid', nullable: false },
      { name: 'rule_text', type: 'text', nullable: false },
      { name: 'rule_order', type: 'integer', nullable: true },
      { name: 'is_checked', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false }
    ]);
  }

  /**
   * Validate that database schema is consistent
   */
  async validateSchema(): Promise<ValidationResult> {
    try {
      // Check that deleted tables don't exist
      for (const deletedTable of this.deletedTables) {
        const tableExists = await this.checkTableExists(deletedTable);
        if (tableExists) {
          return {
            isValid: false,
            error: `Deleted table '${deletedTable}' still exists in schema`
          };
        }
      }

      // Check that known tables exist and have expected structure
      for (const tableName of this.knownTables) {
        const tableValidation = await this.validateTable(tableName);
        if (!tableValidation.isValid) {
          return tableValidation;
        }
      }

      return {
        isValid: true,
        error: undefined
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate a specific table
   */
  async validateTable(tableName: string): Promise<ValidationResult> {
    try {
      // Check cache first
      const cached = this.schemaCache.get(tableName);
      if (cached && (Date.now() - cached.lastValidated) < this.cacheTimeoutMs) {
        return {
          isValid: true,
          schemaInfo: cached
        };
      }

      // Query table schema from information_schema
      const { data: columns, error } = await this.supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (error) {
        // If we get an error about table not existing, that might be expected
        if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
          return {
            isValid: false,
            error: `Table '${tableName}' does not exist or is not accessible`
          };
        }
        
        // For other errors, check if it's a schema cache issue
        if (error.message?.includes('schema cache')) {
          return {
            isValid: false,
            error: `Schema cache inconsistency detected for table '${tableName}': ${error.message}`
          };
        }

        return {
          isValid: false,
          error: `Failed to validate table '${tableName}': ${error.message}`
        };
      }

      if (!columns || columns.length === 0) {
        return {
          isValid: false,
          error: `Table '${tableName}' has no columns or does not exist`
        };
      }

      // Cache schema info
      const schemaInfo: SchemaInfo = {
        tableName,
        columns: columns.map((col: any) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES'
        })),
        lastValidated: Date.now()
      };

      this.schemaCache.set(tableName, schemaInfo);

      return {
        isValid: true,
        schemaInfo
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Unexpected error validating table '${tableName}': ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if a table exists
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Clear the schema cache
   */
  clearCache(): void {
    this.schemaCache.clear();
  }

  /**
   * Get cached schema info for a table
   */
  getCachedSchema(tableName: string): SchemaInfo | undefined {
    const cached = this.schemaCache.get(tableName);
    if (cached && (Date.now() - cached.lastValidated) < this.cacheTimeoutMs) {
      return cached;
    }
    return undefined;
  }

  /**
   * Validate a query before execution
   */
  async validateQuery(tableName: string, operation: 'select' | 'insert' | 'update' | 'delete' = 'select'): Promise<ValidationResult> {
    // First validate the overall schema
    const schemaValidation = await this.validateSchema();
    if (!schemaValidation.isValid) {
      return schemaValidation;
    }

    // Then validate the specific table
    const tableValidation = await this.validateTable(tableName);
    if (!tableValidation.isValid) {
      return tableValidation;
    }

    // Additional checks based on operation
    if (operation === 'insert' || operation === 'update') {
      // For insert/update, ensure we have column information
      if (!tableValidation.schemaInfo || tableValidation.schemaInfo.columns.length === 0) {
        return {
          isValid: false,
          error: `Cannot perform ${operation} on table '${tableName}' without column information`
        };
      }
    }

    return {
      isValid: true,
      schemaInfo: tableValidation.schemaInfo
    };
  }

  /**
   * Detect schema inconsistencies
   */
  async detectInconsistencies(): Promise<SchemaInconsistency[]> {
    const inconsistencies: SchemaInconsistency[] = [];

    try {
      // Check for deleted tables that still exist
      for (const deletedTable of this.deletedTables) {
        const tableExists = await this.checkTableExists(deletedTable);
        if (tableExists) {
          inconsistencies.push({
            type: 'extra_table',
            tableName: deletedTable,
            details: `Deleted table '${deletedTable}' still exists in schema`,
            severity: 'critical',
            resolution: 'Execute DROP TABLE statement to remove the deleted table'
          });
        }
      }

      // Check for missing core tables
      for (const knownTable of this.knownTables) {
        const tableExists = await this.checkTableExists(knownTable);
        if (!tableExists) {
          inconsistencies.push({
            type: 'missing_table',
            tableName: knownTable,
            details: `Core table '${knownTable}' is missing from schema`,
            severity: 'critical',
            resolution: 'Recreate the missing table using the schema definition'
          });
        }
      }

      // Check for column mismatches in core tables
      for (const tableName of this.knownTables) {
        const columnInconsistencies = await this.checkColumnConsistency(tableName);
        inconsistencies.push(...columnInconsistencies);
      }

      // Check for schema cache issues
      const cacheIssues = await this.detectCacheIssues();
      inconsistencies.push(...cacheIssues);

    } catch (error) {
      inconsistencies.push({
        type: 'cache_issue',
        tableName: 'schema',
        details: `Error during inconsistency detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        resolution: 'Clear schema cache and retry validation'
      });
    }

    return inconsistencies;
  }

  /**
   * Check column consistency for a table
   */
  private async checkColumnConsistency(tableName: string): Promise<SchemaInconsistency[]> {
    const inconsistencies: SchemaInconsistency[] = [];
    const expectedColumns = this.expectedColumns.get(tableName);

    if (!expectedColumns) {
      return inconsistencies; // Skip tables without expected column definitions
    }

    try {
      const { data: actualColumns, error } = await this.supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);

      if (error) {
        inconsistencies.push({
          type: 'column_mismatch',
          tableName,
          details: `Could not retrieve column information: ${error.message}`,
          severity: 'high',
          resolution: 'Clear schema cache and retry'
        });
        return inconsistencies;
      }

      const actualColumnMap = new Map(
        actualColumns?.map((col: any) => [
          col.column_name,
          { type: col.data_type, nullable: col.is_nullable === 'YES' }
        ]) || []
      );

      // Check for missing expected columns
      for (const expectedCol of expectedColumns) {
        const actualCol = actualColumnMap.get(expectedCol.name);
        
        if (!actualCol) {
          inconsistencies.push({
            type: 'column_mismatch',
            tableName,
            details: `Missing expected column '${expectedCol.name}' (${expectedCol.type})`,
            severity: 'high',
            resolution: `Add column '${expectedCol.name}' with type '${expectedCol.type}'`
          });
        } else {
          // Check type mismatch
          if (!this.areTypesCompatible(expectedCol.type, (actualCol as any).type)) {
            inconsistencies.push({
              type: 'column_mismatch',
              tableName,
              details: `Column '${expectedCol.name}' type mismatch: expected '${expectedCol.type}', found '${(actualCol as any).type}'`,
              severity: 'medium',
              resolution: `Alter column '${expectedCol.name}' to type '${expectedCol.type}'`
            });
          }

          // Check nullable mismatch
          if (expectedCol.nullable !== (actualCol as any).nullable) {
            inconsistencies.push({
              type: 'column_mismatch',
              tableName,
              details: `Column '${expectedCol.name}' nullable mismatch: expected ${expectedCol.nullable}, found ${(actualCol as any).nullable}`,
              severity: 'low',
              resolution: `Alter column '${expectedCol.name}' nullable property to ${expectedCol.nullable}`
            });
          }
        }
      }

      // Check for unexpected columns
      for (const [actualColName] of actualColumnMap) {
        const expectedCol = expectedColumns.find(col => col.name === actualColName);
        if (!expectedCol) {
          inconsistencies.push({
            type: 'column_mismatch',
            tableName,
            details: `Unexpected column '${actualColName}' found in table`,
            severity: 'low',
            resolution: `Remove unexpected column '${actualColName}' or update expected schema`
          });
        }
      }

    } catch (error) {
      inconsistencies.push({
        type: 'column_mismatch',
        tableName,
        details: `Error checking column consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        resolution: 'Clear schema cache and retry validation'
      });
    }

    return inconsistencies;
  }

  /**
   * Detect schema cache issues
   */
  private async detectCacheIssues(): Promise<SchemaInconsistency[]> {
    const inconsistencies: SchemaInconsistency[] = [];

    try {
      // Test information_schema access
      const { data, error } = await this.supabase
        .from('information_schema.columns')
        .select('table_name')
        .limit(1);

      if (error) {
        if (error.message.includes('schema cache')) {
          inconsistencies.push({
            type: 'cache_issue',
            tableName: 'information_schema',
            details: `Schema cache inconsistency detected: ${error.message}`,
            severity: 'critical',
            resolution: 'Execute aggressive schema cache clear'
          });
        }
      }

      // Test basic table access
      const { error: strategiesError } = await this.supabase
        .from('strategies')
        .select('id')
        .limit(1);

      if (strategiesError) {
        if (strategiesError.message.includes('schema cache')) {
          inconsistencies.push({
            type: 'cache_issue',
            tableName: 'strategies',
            details: `Schema cache inconsistency affecting strategies table: ${strategiesError.message}`,
            severity: 'critical',
            resolution: 'Execute aggressive schema cache clear and rebuild'
          });
        }
      }

    } catch (error) {
      inconsistencies.push({
        type: 'cache_issue',
        tableName: 'schema',
        details: `Cache detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        resolution: 'Clear all caches and restart application'
      });
    }

    return inconsistencies;
  }

  /**
   * Automatically resolve detected inconsistencies
   */
  async resolveInconsistencies(inconsistencies: SchemaInconsistency[]): Promise<{
    resolved: string[];
    failed: string[];
    errors: string[];
  }> {
    const resolved: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    for (const inconsistency of inconsistencies) {
      try {
        console.log(`🔧 Resolving: ${inconsistency.details}`);
        
        switch (inconsistency.type) {
          case 'cache_issue':
            const cacheResolved = await this.resolveCacheIssue(inconsistency);
            if (cacheResolved) {
              resolved.push(inconsistency.details);
            } else {
              failed.push(inconsistency.details);
            }
            break;

          case 'extra_table':
            const tableRemoved = await this.removeExtraTable(inconsistency.tableName);
            if (tableRemoved) {
              resolved.push(inconsistency.details);
            } else {
              failed.push(inconsistency.details);
            }
            break;

          case 'missing_table':
            // Missing tables require manual intervention
            failed.push(inconsistency.details);
            errors.push(`Missing table '${inconsistency.tableName}' requires manual recreation`);
            break;

          case 'column_mismatch':
            // Column mismatches require manual intervention
            failed.push(inconsistency.details);
            errors.push(`Column mismatch in '${inconsistency.tableName}' requires manual schema update`);
            break;

          default:
            failed.push(inconsistency.details);
            errors.push(`Unknown inconsistency type: ${inconsistency.type}`);
        }
      } catch (error) {
        const errorMsg = `Failed to resolve '${inconsistency.details}': ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        failed.push(inconsistency.details);
      }
    }

    return { resolved, failed, errors };
  }

  /**
   * Resolve cache issues
   */
  private async resolveCacheIssue(inconsistency: SchemaInconsistency): Promise<boolean> {
    try {
      // Clear all caches
      this.clearCache();

      // Force cache invalidation via service role
      const cacheStatements = [
        'DISCARD PLANS',
        'DISCARD TEMP',
        'DISCARD ALL',
        'DEALLOCATE ALL',
        'ANALYZE'
      ];

      for (const statement of cacheStatements) {
        try {
          await this.serviceSupabase.rpc('exec_sql', { sql_query: statement });
        } catch (err) {
          // Expected for some statements
        }
      }

      // Force configuration reload
      try {
        await this.serviceSupabase.rpc('pg_reload_conf');
      } catch (err) {
        // Expected
      }

      return true;
    } catch (error) {
      console.error('Failed to resolve cache issue:', error);
      return false;
    }
  }

  /**
   * Remove extra table
   */
  private async removeExtraTable(tableName: string): Promise<boolean> {
    try {
      const { error } = await this.serviceSupabase.rpc('exec_sql', {
        sql_query: `DROP TABLE IF EXISTS ${tableName} CASCADE;`
      });
      
      return !error;
    } catch (error) {
      console.error(`Failed to remove table ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Check if two data types are compatible
   */
  private areTypesCompatible(expected: string, actual: string): boolean {
    // Normalize type names
    const normalizeType = (type: string) => type.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const expectedNorm = normalizeType(expected);
    const actualNorm = normalizeType(actual);

    // Direct match
    if (expectedNorm === actualNorm) {
      return true;
    }

    // Compatible type mappings
    const compatibleTypes: Record<string, string[]> = {
      'uuid': ['uuid'],
      'text': ['text', 'character varying', 'varchar'],
      'boolean': ['boolean', 'bool'],
      'numeric': ['numeric', 'decimal'],
      'integer': ['integer', 'int', 'int4'],
      'timestamp': ['timestamp', 'timestamp with time zone', 'timestamptz'],
      'date': ['date'],
      'time': ['time', 'time without time zone'],
      'array': ['array']
    };

    // Check if actual type is in the compatible list for expected type
    for (const [baseType, compatibleList] of Object.entries(compatibleTypes)) {
      if (expectedNorm.includes(baseType) && compatibleList.some(ct => actualNorm.includes(ct))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle undefined UUID values in type checking
   */
  private handleUndefinedUUID(value: any, columnName: string): any {
    // If value is undefined, null, or a string 'undefined', sanitize it
    if (value === undefined || value === null || value === 'undefined') {
      console.warn(`⚠️ [UUID] Undefined/invalid UUID detected in column '${columnName}', setting to null`);
      return null;
    }
    
    // If it's a string that looks like it might be a UUID, try to sanitize it
    if (typeof value === 'string') {
      const sanitized = sanitizeUUID(value);
      if (sanitized === null) {
        console.warn(`⚠️ [UUID] Invalid UUID string '${value}' in column '${columnName}', setting to null`);
        return null;
      }
      return sanitized;
    }
    
    return value;
  }

  /**
   * Validate and sanitize UUID values in data objects
   */
  public validateUUIDsInData(data: any, tableName: string): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Define UUID columns for different tables
    const uuidColumns: Record<string, string[]> = {
      'strategies': ['id', 'user_id'],
      'trades': ['id', 'user_id', 'strategy_id'],
      'strategy_rules': ['id', 'strategy_id'],
      'users': ['id']
    };

    // Get UUID columns for the current table
    const tableUuidColumns = uuidColumns[tableName] || [];

    // Create a copy to avoid mutating the original
    const validatedData = { ...data };

    // Validate each UUID column
    for (const column of tableUuidColumns) {
      if (column in validatedData) {
        validatedData[column] = this.handleUndefinedUUID(validatedData[column], `${tableName}.${column}`);
      }
    }

    return validatedData;
  }

  /**
   * Create a safe query wrapper that validates before execution
   */
  async safeQuery<T = any>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    tableName: string,
    operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
  ): Promise<{ data: T | null; error: any; validationError?: string }> {
    // Validate before executing
    const validation = await this.validateQuery(tableName, operation);
    if (!validation.isValid) {
      return {
        data: null,
        error: null,
        validationError: validation.error
      };
    }

    // Execute the query
    try {
      const result = await queryFn();
      
      // For insert/update operations, validate UUIDs in the returned data
      if ((operation === 'insert' || operation === 'update') && result.data) {
        if (Array.isArray(result.data)) {
          (result.data as any) = result.data.map(item => this.validateUUIDsInData(item, tableName));
        } else if (typeof result.data === 'object') {
          (result.data as any) = this.validateUUIDsInData(result.data, tableName);
        }
      }
      
      return result;
    } catch (error) {
      // Check if the error is related to schema cache
      if (error instanceof Error && error.message.includes('schema cache')) {
        // Clear cache and retry once
        this.clearCache();
        
        try {
          const retryResult = await queryFn();
          
          // Validate UUIDs in retry result as well
          if ((operation === 'insert' || operation === 'update') && retryResult.data) {
            if (Array.isArray(retryResult.data)) {
              (retryResult.data as any) = retryResult.data.map(item => this.validateUUIDsInData(item, tableName));
            } else if (typeof retryResult.data === 'object') {
              (retryResult.data as any) = this.validateUUIDsInData(retryResult.data, tableName);
            }
          }
          
          return retryResult;
        } catch (retryError) {
          return {
            data: null,
            error: retryError,
            validationError: `Schema cache inconsistency detected and retry failed: ${error.message}`
          };
        }
      }

      return {
        data: null,
        error
      };
    }
  }
}

// Lazy initialization for SchemaValidator
let schemaValidatorInstance: SchemaValidator | null = null;

// Function to get the singleton instance
const getSchemaValidator = (): SchemaValidator => {
  if (!schemaValidatorInstance) {
    schemaValidatorInstance = new SchemaValidator();
  }
  return schemaValidatorInstance;
};

// Export convenience functions with lazy initialization
export const validateSchema = () => getSchemaValidator().validateSchema();
export const validateTable = (tableName: string) => getSchemaValidator().validateTable(tableName);
export const validateQuery = (tableName: string, operation?: 'select' | 'insert' | 'update' | 'delete') =>
  getSchemaValidator().validateQuery(tableName, operation);
export const safeQuery = <T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  tableName: string,
  operation?: 'select' | 'insert' | 'update' | 'delete'
) => getSchemaValidator().safeQuery(queryFn, tableName, operation);
export const clearSchemaCache = () => getSchemaValidator().clearCache();
export const schemaValidator = getSchemaValidator();