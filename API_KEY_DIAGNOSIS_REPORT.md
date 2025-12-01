# API Key Issue Diagnosis Report

## Problem Summary
The test script `test-relationship-rebuild-table-fix.js` is failing with "Invalid API key" errors when trying to execute SQL scripts via Supabase RPC calls.

## Root Cause Analysis

After systematic investigation, I've identified the following issues:

### 1. **Project Reference Mismatch (Primary Issue)**
- **URL**: `https://bzmixuxautbmqbrqtufx.supabase.co`
- **Expected Project Ref**: `bzmixuxautbmqbrqtufx`
- **Actual in JWT tokens**: `supabase`

The JWT tokens have `"iss": "supabase"` instead of `"iss": "https://bzmixuxautbmqbrqtufx.supabase.co"` or containing the correct project reference.

### 2. **Token Format Analysis**
Both tokens are properly formatted JWT with:
- Valid HS256 algorithm
- Correct typ: JWT
- Valid expiration dates (not expired)
- Correct roles (anon and service_role)

### 3. **Connection Test Results**
- ANON key: Returns schema cache error (different issue)
- SERVICE ROLE key: Returns "Invalid API key" error
- RPC calls: Fail with "Invalid API key" error

## Most Likely Causes

1. **Incorrect API Keys**: The API keys in the .env file don't match the Supabase project URL. They appear to be from a different Supabase project or are placeholder/example keys.

2. **Missing exec_sql Function**: The RPC call to `exec_sql` might not exist in the current Supabase project, which could also cause "Invalid API key" errors.

## Recommended Fixes

### Option 1: Update API Keys (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the correct Project URL and API keys
4. Update the .env file with the correct values

### Option 2: Verify exec_sql Function
1. Check if the `exec_sql` RPC function exists in your Supabase project
2. If not, create it using the SQL:
```sql
create or replace function exec_sql(sql_query text)
returns table(success boolean, error text)
language plpgsql
security definer
as $$
begin
  execute sql_query;
  return query select true as success, null as error;
exception when others then
  return query select false as success, sqlerrm as error;
end;
$$;
```

## Validation Steps
After applying the fix:
1. Run `node test-api-key-debug.js` to verify connection
2. Run `node test-relationship-rebuild-table-fix.js` to test the original script
3. Verify no "Invalid API key" errors appear

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key