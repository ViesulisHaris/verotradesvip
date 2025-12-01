'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function SidebarCollapsedDiagnosisPage() {
  const [diagnosticResults, setDiagnosticResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setDiagnosticResults(prev => [...prev, result]);
    console.log(result);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sidebar Collapsed State Diagnosis</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Open browser DevTools (F12)</li>
            <li>Go to Console tab</li>
            <li>Navigate to any authenticated page (e.g., /dashboard)</li>
            <li>Observe the diagnostic output in console</li>
            <li>Check if sidebar is visible when collapsed</li>
          </ol>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Expected Behavior</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>When collapsed, sidebar should be visible but narrow (80px width)</li>
            <li>Collapsed sidebar should show only icons</li>
            <li>Toggle button should be visible to expand sidebar</li>
            <li>Sidebar should NOT be completely hidden when collapsed</li>
          </ul>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Issue Analysis</h2>
          <div className="space-y-3 text-gray-300">
            <p><strong>Most Likely Cause:</strong> CSS transform issue</p>
            <p>The sidebar is being translated off-screen (translateX(-100%)) even when collapsed.</p>
            <p>This happens in <code className="bg-gray-700 px-2 rounded">verotrade-design-system.css</code> line 305:</p>
            <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
{`.verotrade-sidebar.collapsed {
  width: 80px;
  transform: translateX(-100%); /* ← This hides sidebar completely */
}`}
            </pre>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
          {diagnosticResults.length === 0 ? (
            <p className="text-gray-400">Run the diagnostic script to see results here...</p>
          ) : (
            <div className="space-y-2">
              {diagnosticResults.map((result, index) => (
                <p key={index} className="text-sm text-gray-300">{result}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      <Script
        src="/sidebar-collapsed-diagnostic.js"
        onLoad={() => {
          addResult('🔧 Diagnostic script loaded successfully');
        }}
        onError={() => {
          addResult('❌ Failed to load diagnostic script');
        }}
      />
    </div>
  );
}