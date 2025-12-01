'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function TestStrategiesNavigation() {
  const [navigationResults, setNavigationResults] = useState<string[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const results = [
      `Current pathname: ${pathname}`,
      `Strategies page should be accessible at: /strategies`,
      `Dashboard page should be accessible at: /dashboard`,
      '',
      'Testing navigation links:',
      '1. Strategies button should navigate to /strategies (not /dashboard)',
      '2. All other navigation links should work correctly',
      '3. No unwanted redirects should occur',
      '',
      'Expected behavior:',
      '- Clicking Strategies button → /strategies page',
      '- Clicking Dashboard button → /dashboard page',
      '- Clicking Log Trade button → /log-trade page',
      '- Clicking Calendar button → /calendar page',
      '- Clicking Confluence button → /confluence page',
      '',
      'If the strategies button still redirects to dashboard,',
      'the AuthProvider fix may need further adjustment.'
    ];

    setNavigationResults(results);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Strategies Navigation Test</h1>
        
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold mb-4">Navigation Test Results</h2>
          <div className="space-y-2">
            {navigationResults.map((result, index) => (
              <div key={index} className="text-white/80">
                {result}
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Manual Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>Click the Strategies button in the sidebar</li>
            <li>Verify the URL changes to /strategies (not /dashboard)</li>
            <li>Check that the strategies page loads correctly</li>
            <li>Test other navigation buttons to ensure they still work</li>
            <li>Verify no unwanted redirects occur</li>
          </ol>
        </div>

        <div className="mt-6 flex gap-4">
          <a 
            href="/strategies" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Test Direct Link to Strategies
          </a>
          <a 
            href="/dashboard" 
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}