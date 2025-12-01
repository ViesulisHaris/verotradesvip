# API Key Fix Implementation Guide

This guide provides step-by-step instructions to fix the Supabase API key issues identified in the diagnosis.

## Problem Summary

The debug mode identified three main issues:
1. **Invalid ANON Key Format**: The ANON key is not in valid JWT format
2. **Wrong Project Reference**: The SERVICE ROLE key has incorrect project reference
3. **Missing exec_sql Function**: The RPC function needed for SQL execution doesn't exist

## Files Created to Fix These Issues

1. **setup-exec-sql-function.sql** - SQL script to create the missing exec_sql function
2. **test-supabase-credentials.js** - Test script to verify Supabase credentials are working
3. **test-relationship-rebuild-table-fix.js** - Updated test script with better error messages

## Step-by-Step Fix Implementation

### Step 1: Get Correct API Keys from Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx
2. Navigate to **Settings → API**
3. Copy the **Project URL** (should be: `https://bzmixuxautbmqbrqtufx.supabase.co`)
4. Copy the **anon public** key (should start with `eyJhbGciOiJIUzI1NiIs...`)
5. Copy the **service_role** key (should start with `eyJhbGciOiJIUzI1NiIs...`)

### Step 2: Update Your .env File

Update your `.env` file with the correct credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://bzmixuxautbmqbrqtufx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (full JWT token)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (full JWT token)
```

### Step 3: Create the exec_sql Function

1. Go to **Supabase Dashboard → SQL Editor**
2. Click **New Query**
3. Paste and run the SQL from [`setup-exec-sql-function.sql`](setup-exec-sql-function.sql)
4. Verify the function was created successfully

### Step 4: Verify Your Credentials

Run the credentials test script to verify everything is working:

```bash
node test-supabase-credentials.js
```

This script will:
- Validate the format of your API keys
- Test the connection to your Supabase project
- Verify the exec_sql function is working
- Provide detailed feedback if any issues are found

### Step 5: Run the Original Test

Once your credentials are verified, run the original test script:

```bash
node test-relationship-rebuild-table-fix.js
```

This script now includes:
- Better error messages for API key issues
- Clear instructions on how to fix problems
- Helpful links to the Supabase dashboard

## Troubleshooting

### If API Keys Are Invalid

The test script will detect if your keys are not in valid JWT format and provide instructions to fix them.

### If exec_sql Function Is Missing

The test script will detect if the exec_sql function is missing and provide instructions to create it using the setup-exec-sql-function.sql file.

### If Connection Fails

The test script will provide detailed error messages and suggest next steps to resolve connection issues.

## Expected Format for API Keys

Valid Supabase API keys should be in JWT format and start with:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If your keys don't start with this pattern, they are likely:
- From a different Supabase project
- Placeholder/example keys
- In incorrect format

## Quick Reference Commands

```bash
# Test your Supabase credentials
node test-supabase-credentials.js

# Run the relationship rebuild test
node test-relationship-rebuild-table-fix.js
```

## Additional Resources

- [Supabase Dashboard](https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx)
- [API_KEY_FIX_SOLUTION.md](API_KEY_FIX_SOLUTION.md) - Detailed technical solution
- [setup-exec-sql-function.sql](setup-exec-sql-function.sql) - SQL script to create exec_sql function
- [test-supabase-credentials.js](test-supabase-credentials.js) - Credentials verification script

## Support

If you encounter any issues:
1. Run `node test-supabase-credentials.js` to diagnose the problem
2. Follow the instructions provided by the test script
3. Refer to the API_KEY_FIX_SOLUTION.md for technical details
4. Make sure you're using the correct project ID: `bzmixuxautbmqbrqtufx`