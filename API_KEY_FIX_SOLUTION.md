# API Key Fix Solution

## Root Cause Identified

After thorough analysis, I've found the following issues:

1. **Invalid ANON Key Format**: The provided ANON key `sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP` is not in valid JWT format
2. **Wrong Project Reference**: The SERVICE ROLE key has incorrect project reference
3. **Missing exec_sql Function**: The RPC function needed for SQL execution doesn't exist

## Immediate Solution

The credentials you provided don't match Supabase's standard JWT format. Here's what needs to be done:

### Option 1: Get Correct Credentials from Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx
2. Navigate to **Settings → API**
3. Copy the **Project URL** (should be: `https://bzmixuxautbmqbrqtufx.supabase.co`)
4. Copy the **anon public** key (should start with `eyJhbGciOiJIUzI1NiIs...`)
5. Copy the **service_role** key (should start with `eyJhbGciOiJIUzI1NiIs...`)

### Option 2: Create exec_sql Function Manually

Since we can't connect with current credentials, you'll need to create the exec_sql function manually:

1. Go to **Supabase Dashboard → SQL Editor**
2. Click **New Query**
3. Paste and run this SQL:

```sql
create or replace function exec_sql(sql_query text)
returns table(success boolean, error text, result json)
language plpgsql
security definer
as $$
declare
    query_result record;
    return_json json;
begin
    -- Execute the SQL query
    execute sql_query;
    
    -- Try to get the result if it's a SELECT query
    begin
        -- For SELECT queries, try to return the result
        execute 'select array_to_json(array_agg(row_to_json(t))) from (' || sql_query || ') t'
        into return_json;
        
        return query select true as success, null as error, return_json as result;
    exception when others then
        -- For non-SELECT queries, just return success
        return query select true as success, null as error, null as result;
    end;
    
exception when others then
    -- Return error if query fails
    return query select false as success, sqlerrm as error, null as result;
end;
$$;
```

## Expected Format for .env File

```
NEXT_PUBLIC_SUPABASE_URL=https://bzmixuxautbmqbrqtufx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (full JWT token)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (full JWT token)
```

## Next Steps

1. **Get correct API keys** from your Supabase dashboard
2. **Update .env file** with proper JWT tokens
3. **Create exec_sql function** manually in Supabase
4. **Test the connection** by running: `node test-api-key-debug.js`
5. **Run the original test**: `node test-relationship-rebuild-table-fix.js`

The current keys appear to be either:
- From a different Supabase project
- Placeholder/example keys
- In incorrect format

Please verify the exact keys from your Supabase dashboard and I'll help you update the configuration properly.