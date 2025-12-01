'use client';

import { useState, useEffect } from 'react';
import TradeForm from '@/components/forms/TradeForm';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';

export default function TestTradePreviewRemoval() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const runTests = () => {
    const results = [];
    
    // Test 1: Trade Form renders without preview
    const tradeForm = document.querySelector('form');
    if (tradeForm) {
      results.push({
        name: 'Trade Form Renders',
        status: 'pass',
        details: 'Trade form component renders successfully'
      });
    } else {
      results.push({
        name: 'Trade Form Renders',
        status: 'fail',
        details: 'Trade form component not found'
      });
    }

    // Test 2: Trade Preview is removed
    const tradePreview = document.querySelector('h3');
    const previewHeaders = Array.from(document.querySelectorAll('h3')).filter(h => 
      h.textContent?.includes('Trade Preview')
    );
    
    if (previewHeaders.length === 0) {
      results.push({
        name: 'Trade Preview Removed',
        status: 'pass',
        details: 'Trade preview section successfully removed'
      });
    } else {
      results.push({
        name: 'Trade Preview Removed',
        status: 'fail',
        details: 'Trade preview section still found in DOM'
      });
    }

    // Test 3: Form fields are present
    const requiredFields = ['symbol', 'entry_price', 'exit_price', 'quantity'];
    const missingFields: string[] = [];
    
    requiredFields.forEach(field => {
      const input = document.querySelector(`input[name="${field}"]`) || 
                   document.querySelector(`input[placeholder*="${field.includes('_') ? field.split('_').join(' ') : field}"]`);
      if (!input) {
        missingFields.push(field);
      }
    });

    if (missingFields.length === 0) {
      results.push({
        name: 'Form Fields Present',
        status: 'pass',
        details: 'All required form fields are present'
      });
    } else {
      results.push({
        name: 'Form Fields Present',
        status: 'fail',
        details: `Missing fields: ${missingFields.join(', ')}`
      });
    }

    // Test 4: Submit button is present
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      results.push({
        name: 'Submit Button Present',
        status: 'pass',
        details: 'Submit button is present and functional'
      });
    } else {
      results.push({
        name: 'Submit Button Present',
        status: 'fail',
        details: 'Submit button not found'
      });
    }

    // Test 5: Layout is clean without preview
    const glassContainers = document.querySelectorAll('.glass');
    const previewContainers = Array.from(glassContainers).filter(container => {
      const h3 = container.querySelector('h3');
      return h3 && h3.textContent?.includes('Preview');
    });

    if (previewContainers.length === 0) {
      results.push({
        name: 'Clean Layout',
        status: 'pass',
        details: 'Layout is clean without preview containers'
      });
    } else {
      results.push({
        name: 'Clean Layout',
        status: 'fail',
        details: `Found ${previewContainers.length} preview containers`
      });
    }

    setTestResults(results);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/70">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="glass p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Authentication Required</h2>
          <p className="text-white/70 mb-4">Please log in to test trade preview removal</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-white">Trade Preview Removal Test</h1>
        
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Test Controls</h2>
          <button
            onClick={runTests}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Run Tests
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="glass p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'pass'
                      ? 'bg-green-600/20 border-green-500/30'
                      : 'bg-red-600/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{result.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        result.status === 'pass'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-white/70 mt-2">{result.details}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Summary</h3>
              <p className="text-white/70">
                {testResults.filter(r => r.status === 'pass').length} of {testResults.length} tests passed
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">Trade Form (Without Preview)</h2>
          <TradeForm onSuccess={() => {}} />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">Test Instructions</h2>
          <div className="glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 text-white">What to Test:</h3>
            <ul className="space-y-2 text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Verify that the trade preview section is completely removed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Check that all form fields are still present and functional</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Ensure the layout is clean without preview containers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Test form submission still works correctly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Verify responsiveness on different screen sizes</span>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
              <h4 className="font-semibold text-yellow-300 mb-2">Expected Result:</h4>
              <p className="text-white/70 text-sm">
                The trade form should work exactly as before, but without the glitchy preview section. 
                All functionality should remain intact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}