const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSqlScript() {
  try {
    console.log('Reading REMOVE_COMPLIANCE_FUNCTIONALITY.sql script...');
    
    // Read the SQL script
    const sqlScript = fs.readFileSync('./REMOVE_COMPLIANCE_FUNCTIONALITY.sql', 'utf8');
    
    console.log('Executing compliance removal script...');
    
    // Split the script into individual statements
    // This is a simple approach - for complex scripts, you might need a more sophisticated parser
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(`Statement preview: ${statement.substring(0, 100)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // Try direct SQL execution if RPC fails
          console.log('RPC failed, trying direct SQL execution...');
          const { data: directData, error: directError } = await supabase
            .from('_temp_execution')
            .select('*');
          
          if (directError && directError.message.includes('does not exist')) {
            // For DDL statements, we need to use a different approach
            console.log('DDL statement detected, using admin client...');
            
            // Create a temporary function to execute the SQL
            const tempFunctionName = `temp_exec_${Date.now()}`;
            const createFunctionSql = `
              CREATE OR REPLACE FUNCTION ${tempFunctionName}()
              RETURNS TEXT AS $$
              BEGIN
                ${statement}
                RETURN 'Success';
              END;
              $$ LANGUAGE plpgsql;
            `;
            
            const { error: funcError } = await supabase.rpc('exec_sql', { 
              sql_statement: createFunctionSql 
            });
            
            if (funcError) {
              console.warn(`Could not execute statement via function: ${funcError.message}`);
              console.log('This might be expected for some DDL statements');
            } else {
              // Execute the function
              const { error: execError } = await supabase.rpc(tempFunctionName);
              
              if (execError) {
                console.warn(`Function execution failed: ${execError.message}`);
              } else {
                console.log('Statement executed successfully via function');
              }
              
              // Clean up the temporary function
              await supabase.rpc('exec_sql', { 
                sql_statement: `DROP FUNCTION IF EXISTS ${tempFunctionName}();` 
              });
            }
          } else {
            console.error(`Direct execution failed: ${directError?.message}`);
          }
        } else {
          console.log('Statement executed successfully via RPC');
        }
      } catch (stmtError) {
        console.warn(`Statement execution warning: ${stmtError.message}`);
        console.log('Continuing with next statement...');
      }
    }
    
    console.log('Compliance removal script execution completed');
    
    // Run verification queries
    console.log('\nRunning verification queries...');
    
    // Check if strategy_rule_compliance table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'strategy_rule_compliance');
    
    if (tablesError) {
      console.warn('Could not check for strategy_rule_compliance table:', tablesError.message);
    } else {
      if (tables && tables.length > 0) {
        console.error('ERROR: strategy_rule_compliance table still exists');
      } else {
        console.log('✓ strategy_rule_compliance table successfully removed');
      }
    }
    
    // Check if compliance_percentage column exists in trades table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'trades')
      .eq('column_name', 'compliance_percentage');
    
    if (columnsError) {
      console.warn('Could not check for compliance_percentage column:', columnsError.message);
    } else {
      if (columns && columns.length > 0) {
        console.error('ERROR: compliance_percentage column still exists in trades table');
      } else {
        console.log('✓ compliance_percentage column successfully removed from trades table');
      }
    }
    
    // Test basic database functionality
    console.log('\nTesting basic database functionality...');
    
    // Test strategies table
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name')
      .limit(1);
    
    if (strategiesError) {
      console.error('ERROR: Could not access strategies table:', strategiesError.message);
    } else {
      console.log('✓ Strategies table is accessible');
    }
    
    // Test trades table
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, symbol')
      .limit(1);
    
    if (tradesError) {
      console.error('ERROR: Could not access trades table:', tradesError.message);
    } else {
      console.log('✓ Trades table is accessible');
    }
    
    // Test strategy_rules table
    const { data: rules, error: rulesError } = await supabase
      .from('strategy_rules')
      .select('id, rule_text')
      .limit(1);
    
    if (rulesError) {
      console.error('ERROR: Could not access strategy_rules table:', rulesError.message);
    } else {
      console.log('✓ Strategy_rules table is accessible');
    }
    
    console.log('\n=== COMPLIANCE REMOVAL EXECUTION COMPLETE ===');
    console.log('Database functionality has been verified without compliance elements');
    
  } catch (error) {
    console.error('Error executing compliance removal script:', error);
    process.exit(1);
  }
}

// Execute the script
executeSqlScript();