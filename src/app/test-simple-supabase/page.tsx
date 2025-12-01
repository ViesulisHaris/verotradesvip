'use client';

import { useEffect, useState } from 'react';

export default function TestSimpleSupabase() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const addLog = (message: string) => {
      setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    };

    const testSupabase = async () => {
      try {
        addLog('Starting Supabase test...');
        
        // Test 1: Check environment variables
        addLog(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
        addLog(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
        
        // Test 2: Import and create client
        addLog('Importing Supabase client...');
        const { supabase } = await import('@/supabase/client');
        addLog('✅ Supabase client imported successfully');
        
        // Test 3: Simple query
        addLog('Testing simple query...');
        const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
        
        if (error) {
          addLog(`❌ Query failed: ${error.message}`);
        } else {
          addLog('✅ Query successful');
        }
        
        // Test 4: Schema validation import
        addLog('Testing schema validation import...');
        const { schemaValidator } = await import('@/lib/schema-validation');
        addLog('✅ Schema validator imported successfully');
        
        // Test 5: Cache fallback import
        addLog('Testing cache fallback import...');
        const { schemaCacheFallback } = await import('@/lib/schema-cache-fallback');
        addLog('✅ Cache fallback imported successfully');
        
      } catch (error: any) {
        addLog(`❌ ERROR: ${error.message}`);
        addLog(`Stack: ${error.stack}`);
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Supabase Test</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Test Logs</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className={`p-2 rounded text-sm font-mono ${
                log.includes('✅') ? 'bg-green-900' : 
                log.includes('❌') ? 'bg-red-900' : 
                'bg-gray-700'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}