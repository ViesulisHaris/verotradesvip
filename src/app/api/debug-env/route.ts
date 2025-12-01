import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const serverEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'undefined',
    };

    // Test server-side Supabase client creation
    let serverClientTest = 'NOT_ATTEMPTED';
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      serverClientTest = 'SUCCESS';
    } catch (error: any) {
      serverClientTest = `FAILED: ${error.message}`;
    }

    // Test server-side schema validation import
    let serverSchemaValidationTest = 'NOT_ATTEMPTED';
    try {
      const { schemaValidator } = await import('@/lib/schema-validation');
      serverSchemaValidationTest = 'IMPORT_SUCCESS';
      
      // Don't actually run validation to avoid potential errors
    } catch (error: any) {
      serverSchemaValidationTest = `IMPORT_FAILED: ${error.message}`;
    }

    return NextResponse.json({
      ...serverEnv,
      serverClientTest,
      serverSchemaValidationTest,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: `Diagnostics failed: ${error.message}`,
      stack: error.stack,
    }, { status: 500 });
  }
}