-- Setup exec_sql function for Supabase
-- This function is needed to execute SQL commands through the Supabase RPC API
-- 
-- Instructions:
-- 1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx
-- 2. Navigate to SQL Editor
-- 3. Click New Query
-- 4. Paste and run this SQL script
-- 5. Verify the function was created successfully

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

-- Grant execution permissions to authenticated users
grant execute on function exec_sql(text) to authenticated;
grant execute on function exec_sql(text) to service_role;

-- Verify the function was created
select 'exec_sql function created successfully' as status;