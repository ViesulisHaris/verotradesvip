'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function TestStrategyFix() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const supabase = getSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    async function testStrategiesLoading() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Testing strategies loading...');
        
        // Attempt to load strategies directly
        const { data, error } = await supabase
          .from('strategies')
          .select('*');
        
        if (error) {
          console.error('Error loading strategies:', error);
          setError(error.message);
        } else {
          console.log('Strategies loaded successfully:', data);
          setStrategies(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    testStrategiesLoading();
  }, [supabase]);

  const handleNavigateToStrategies = () => {
    router.push('/strategies');
  };

  const handleRestartServer = () => {
    // This will require manual restart of the dev server
    window.open('https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/sql', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Strategy Loading Fix Test
          </h1>
          
          <div className="space-y-6">
            {/* Status Section */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Test Status</h2>
              
              {loading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-600">Loading strategies...</span>
                </div>
              )}
              
              {!loading && !error && (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  <span className="text-green-600">Strategies loaded successfully!</span>
                </div>
              )}
              
              {!loading && error && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-red-600 rounded-full"></div>
                    <span className="text-red-600">Error loading strategies</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Results Section */}
            {!loading && !error && strategies.length > 0 && (
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Strategy Results</h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Found {strategies.length} strategies:</p>
                  <ul className="space-y-1">
                    {strategies.map((strategy) => (
                      <li key={strategy.id} className="text-sm bg-gray-50 p-2 rounded">
                        <span className="font-medium">{strategy.name}</span>
                        {strategy.description && (
                          <span className="text-gray-600 ml-2">- {strategy.description}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Actions Section */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleNavigateToStrategies}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Navigate to Strategies Page
                </button>
                
                {error && (
                  <button
                    onClick={handleRestartServer}
                    className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                  >
                    Open Supabase Dashboard to Clear Cache
                  </button>
                )}
              </div>
            </div>

            {/* Instructions Section */}
            {error && (
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h2 className="text-lg font-semibold mb-3 text-yellow-800">Manual Fix Instructions</h2>
                <div className="space-y-2 text-sm text-yellow-800">
                  <p>If the schema cache error persists, follow these steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click the "Open Supabase Dashboard" button above</li>
                    <li>Navigate to the SQL Editor</li>
                    <li>Execute these commands one by one:</li>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><code>DISCARD PLANS;</code></li>
                      <li><code>DISCARD TEMP;</code></li>
                      <li><code>DISCARD ALL;</code></li>
                      <li><code>DEALLOCATE ALL;</code></li>
                      <li><code>ANALYZE strategies;</code></li>
                      <li><code>ANALYZE trades;</code></li>
                      <li><code>ANALYZE users;</code></li>
                      <li><code>RESET CONNECTION;</code></li>
                    </ul>
                    <li>Restart the development server</li>
                    <li>Test the strategies page again</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}