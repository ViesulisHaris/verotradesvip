'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { validateSchema } from '@/lib/schema-validation';

interface SchemaValidatorProps {
  children: React.ReactNode;
}

export default function SchemaValidator({ children }: SchemaValidatorProps) {
  const [isClientReady, setIsClientReady] = useState(false);
  const hasValidatedRef = useRef(false);
  
  // Memoize the validation function to prevent recreation on every render
  const validateAndFixSchema = useCallback(async () => {
    try {
      console.log('🔍 [STARTUP] Running lightweight schema check on application startup...');
      
      // Dynamically import Supabase client to ensure it's loaded on client side
      let supabaseClient;
      try {
        const { supabase } = await import('@/supabase/client');
        supabaseClient = supabase;
      } catch (importError) {
        console.error('❌ [STARTUP] Failed to import Supabase client:', importError);
        return;
      }
      
      // Check if environment variables are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('❌ [STARTUP] Supabase environment variables are not available');
        return;
      }
      
      // SIMPLIFIED APPROACH: Only test basic table access, skip full schema validation
      // This avoids the information_schema.columns queries that cause cache issues
      let basicAccessPassed = false;
      
      // Test basic strategies access first
      try {
        const { data: strategiesTest, error: strategiesError } = await supabaseClient
          .from('strategies')
          .select('id')
          .limit(1);
        
        if (strategiesError) {
          if (strategiesError.message?.includes('schema cache') ||
              strategiesError.message?.includes('information_schema.columns')) {
            console.warn('⚠️ [STARTUP] Schema cache error detected in strategies access:', strategiesError.message);
            
            // Force cache clear
            try {
              const { clearSupabaseCache } = await import('@/supabase/client');
              await clearSupabaseCache();
              console.log('✅ [STARTUP] Cache cleared due to strategies schema error');
              
              // Retry basic access after cache clear
              const { data: retryTest, error: retryError } = await supabaseClient
                .from('strategies')
                .select('id')
                .limit(1);
                
              if (!retryError) {
                basicAccessPassed = true;
                console.log('✅ [STARTUP] Strategies table accessible after cache clear');
              } else {
                console.error('❌ [STARTUP] Strategies still inaccessible after cache clear:', retryError.message);
              }
            } catch (cacheError) {
              console.error('❌ [STARTUP] Failed to clear cache:', cacheError);
            }
          } else {
            console.error('❌ [STARTUP] Strategies access failed with non-cache error:', strategiesError.message);
          }
        } else {
          basicAccessPassed = true;
          console.log('✅ [STARTUP] Strategies table accessible - basic check passed');
        }
      } catch (accessError) {
        console.warn('⚠️ [STARTUP] Error accessing strategies table:', accessError);
      }
      
      // Only run full schema validation if basic access passed and we haven't had recent cache issues
      if (basicAccessPassed) {
        try {
          // Check if we recently had cache issues (avoid spamming validation)
          const lastCacheError = localStorage.getItem('lastSchemaCacheError');
          const now = Date.now();
          const CACHE_ERROR_COOLDOWN = 5 * 60 * 1000; // 5 minutes
          
          if (lastCacheError && (now - parseInt(lastCacheError)) < CACHE_ERROR_COOLDOWN) {
            console.log('⏭️ [STARTUP] Skipping full schema validation due to recent cache error (cooldown period)');
            return;
          }
          
          // Run lightweight validation only (skip full information_schema queries)
          console.log('🔍 [STARTUP] Running lightweight validation...');
          const validation = await validateSchema();
          
          if (!validation.isValid) {
            if (validation.error?.includes('information_schema.columns') ||
                validation.error?.includes('schema cache')) {
              console.warn('⚠️ [STARTUP] Schema cache issue detected, clearing cache and skipping validation');
              
              // Record cache error timestamp
              localStorage.setItem('lastSchemaCacheError', now.toString());
              
              // Clear cache
              try {
                const { clearSupabaseCache } = await import('@/supabase/client');
                await clearSupabaseCache();
                console.log('✅ [STARTUP] Cache cleared, skipping further validation to avoid errors');
              } catch (cacheError) {
                console.error('❌ [STARTUP] Failed to clear cache:', cacheError);
              }
            } else {
              console.error('❌ [STARTUP] Schema validation failed (non-cache issue):', validation.error);
            }
          } else {
            console.log('✅ [STARTUP] Schema validation passed - database is consistent');
            // Clear any previous cache error timestamp on success
            localStorage.removeItem('lastSchemaCacheError');
          }
        } catch (validationError) {
          const currentTime = Date.now();
          if (validationError instanceof Error &&
              (validationError.message.includes('information_schema.columns') ||
               validationError.message.includes('schema cache'))) {
            console.warn('⚠️ [STARTUP] Schema validation hit cache issue, recording and skipping');
            localStorage.setItem('lastSchemaCacheError', currentTime.toString());
          } else {
            console.error('❌ [STARTUP] Schema validation process failed:', validationError);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ [STARTUP] Schema validation process failed:', error);
    }
  }, []);

  useEffect(() => {
    // Only set client ready state once
    if (!isClientReady) {
      setIsClientReady(true);
    }
  }, [isClientReady]);

  useEffect(() => {
    // Only run validation once when client is ready and we haven't validated before
    if (isClientReady && !hasValidatedRef.current) {
      hasValidatedRef.current = true;
      validateAndFixSchema();
    }
  }, [isClientReady, validateAndFixSchema]);

  // Don't render children until client is ready to prevent hydration issues
  if (!isClientReady) {
    return <>{children}</>;
  }

  return <>{children}</>;
}