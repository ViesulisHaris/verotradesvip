const { createClient } = require('@supabase/supabase-js');
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

async function diagnoseStrategyIssues() {
  console.log('🔍 DIAGNOSING STRATEGY ISSUES\n');
  console.log('=====================================\n');

  try {
    // 1. Check if strategy_rule_compliance table exists
    console.log('1️⃣ Checking if strategy_rule_compliance table exists...');
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_name', 'strategy_rule_compliance')
        .eq('table_schema', 'public');

      if (tablesError) {
        console.log(`   ❌ Error checking table: ${tablesError.message}`);
      } else {
        if (tables && tables.length > 0) {
          console.log('   ❌ strategy_rule_compliance table STILL EXISTS!');
          console.log('   📍 This explains the "relation does not exist" error');
        } else {
          console.log('   ✅ strategy_rule_compliance table does not exist (as expected)');
        }
      }
    } catch (error) {
      console.log(`   ❌ Exception checking table: ${error.message}`);
    }

    // 2. Test basic strategies query
    console.log('\n2️⃣ Testing basic strategies query...');
    try {
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, name, user_id, is_active')
        .limit(5);

      if (strategiesError) {
        console.log(`   ❌ Error querying strategies: ${strategiesError.message}`);
        if (strategiesError.message.includes('strategy_rule_compliance')) {
          console.log('   🔍 CONFIRMED: This error references strategy_rule_compliance!');
        }
      } else {
        console.log(`   ✅ Strategies query successful: ${strategies.length} strategies found`);
        if (strategies.length > 0) {
          console.log('   📋 Sample strategies:');
          strategies.forEach(s => console.log(`      - ${s.name} (user: ${s.user_id}, active: ${s.is_active})`));
        }
      }
    } catch (error) {
      console.log(`   ❌ Exception querying strategies: ${error.message}`);
    }

    // 3. Check RLS policies on strategies table
    console.log('\n3️⃣ Checking RLS policies on strategies table...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('policyname, tablename, permissive, roles, cmd, qual')
        .eq('tablename', 'strategies');

      if (policiesError) {
        console.log(`   ❌ Error checking policies: ${policiesError.message}`);
      } else {
        if (policies && policies.length > 0) {
          console.log(`   📋 Found ${policies.length} RLS policies on strategies table:`);
          policies.forEach(p => {
            console.log(`      - ${p.policyname} (${p.cmd}): ${p.roles}`);
          });
        } else {
          console.log('   ⚠️  No RLS policies found on strategies table');
        }
      }
    } catch (error) {
      console.log(`   ❌ Exception checking policies: ${error.message}`);
    }

    // 4. Test with anon key (simulating regular user)
    console.log('\n4️⃣ Testing with anon key (simulating regular user)...');
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    try {
      const { data: anonStrategies, error: anonError } = await anonClient
        .from('strategies')
        .select('id, name')
        .limit(5);

      if (anonError) {
        console.log(`   ❌ Error with anon key: ${anonError.message}`);
        if (anonError.message.includes('permission') || anonError.message.includes('policy')) {
          console.log('   🔍 CONFIRMED: This is a permission issue!');
        }
      } else {
        console.log(`   ✅ Anon query successful: ${anonStrategies.length} strategies found`);
      }
    } catch (error) {
      console.log(`   ❌ Exception with anon key: ${error.message}`);
    }

    // 5. Check for any cached references
    console.log('\n5️⃣ Checking for cached references...');
    try {
      const { data: cachedRefs, error: cacheError } = await supabase
        .from('pg_tables')
        .select('schemaname, tablename')
        .like('tablename', '%strategy_rule_compliance%');

      if (cacheError) {
        console.log(`   ❌ Error checking cache: ${cacheError.message}`);
      } else {
        if (cachedRefs && cachedRefs.length > 0) {
          console.log(`   ⚠️  Found ${cachedRefs.length} cached references:`);
          cachedRefs.forEach(ref => console.log(`      - ${ref.schemaname}.${ref.tablename}`));
        } else {
          console.log('   ✅ No cached references found');
        }
      }
    } catch (error) {
      console.log(`   ❌ Exception checking cache: ${error.message}`);
    }

    // 6. Test strategy creation (if we have a test user)
    console.log('\n6️⃣ Testing strategy creation permissions...');
    try {
      const testStrategy = {
        name: 'Test Strategy for Diagnosis',
        description: 'Temporary test strategy',
        user_id: '00000000-0000-0000-0000-000000000000', // Default UUID
        is_active: true
      };

      const { data: newStrategy, error: createError } = await supabase
        .from('strategies')
        .insert(testStrategy)
        .select('id, name')
        .single();

      if (createError) {
        console.log(`   ❌ Error creating strategy: ${createError.message}`);
        if (createError.message.includes('permission') || createError.message.includes('policy')) {
          console.log('   🔍 CONFIRMED: Strategy creation permission issue!');
        }
      } else {
        console.log(`   ✅ Strategy creation successful: ${newStrategy.name} (ID: ${newStrategy.id})`);
        
        // Clean up the test strategy
        await supabase
          .from('strategies')
          .delete()
          .eq('id', newStrategy.id);
        console.log('   🧹 Test strategy cleaned up');
      }
    } catch (error) {
      console.log(`   ❌ Exception creating strategy: ${error.message}`);
    }

    console.log('\n=====================================');
    console.log('🏁 DIAGNOSIS COMPLETE\n');

  } catch (error) {
    console.error('Error during diagnosis:', error);
    process.exit(1);
  }
}

// Execute the diagnosis
diagnoseStrategyIssues();