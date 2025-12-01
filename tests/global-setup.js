import { config } from 'dotenv';
import { chromium } from '@playwright/test';

// Load environment variables from .env file
config({ path: '.env' });

export default async function globalSetup() {
  console.log('🔧 [TEST SETUP] Loading environment variables for tests...');
  
  // Log the loaded environment variables (for debugging)
  console.log(`🌐 [TEST SETUP] NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
  console.log(`🔑 [TEST SETUP] NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
  console.log(`🔑 [TEST SETUP] SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}`);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ [TEST SETUP] Missing required environment variables for Supabase connection');
    process.exit(1);
  }
  
  console.log('✅ [TEST SETUP] Environment variables loaded successfully');
  
  // Optional: Verify the test user exists before running tests
  // This could be expanded to ensure the test user is ready for testing
  console.log('👤 [TEST SETUP] Test user verification will be handled by individual tests');
}