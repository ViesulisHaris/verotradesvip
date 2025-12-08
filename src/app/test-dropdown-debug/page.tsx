'use client';

import { useState, useEffect, useRef } from 'react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

export default function DropdownDebugPage() {
  const [mounted, setMounted] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [strategyDropdownOpen, setStrategyDropdownOpen] = useState(false);
  const [sideDropdownOpen, setSideDropdownOpen] = useState(false);
  const [emotionDropdownOpen, setEmotionDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    runDiagnostics();
  }, []);

  const addTestResult = (test: string, passed: boolean, details: string = '') => {
    const result = `✅ ${test} ${passed ? 'PASSED' : 'FAILED'}${details ? ` - ${details}` : ''}`;
    setTestResults(prev => [...prev, result]);
  };

  const runDiagnostics = () => {
    // Test 1: Check CSS Variables
    const rootElement = document.documentElement;
    const surfaceColor = getComputedStyle(rootElement).getPropertyValue('--surface');
    addTestResult('CSS Variable --surface exists', !!surfaceColor, surfaceColor);

    // Test 2: Check z-index values
    const dropdowns = document.querySelectorAll('[class*="z-"]');
    addTestResult('Elements with z-index found', dropdowns.length > 0, `Found ${dropdowns.length} elements`);

    // Test 3: Check backdrop filter support
    const testElement = document.createElement('div');
    testElement.style.backdropFilter = 'blur(10px)';
    const backdropFilterSupported = testElement.style.backdropFilter !== '';
    addTestResult('Backdrop filter supported', backdropFilterSupported);

    // Test 4: Check computed styles for dropdown backgrounds
    setTimeout(() => {
      const dropdownElements = document.querySelectorAll('.dropdown-test');
      dropdownElements.forEach((el, index) => {
        const styles = getComputedStyle(el);
        const backgroundColor = styles.backgroundColor;
        const opacity = styles.opacity;
        const zIndex = styles.zIndex;
        
        addTestResult(`Dropdown ${index + 1} background`, backgroundColor !== 'rgba(0, 0, 0, 0)', backgroundColor);
        addTestResult(`Dropdown ${index + 1} opacity`, opacity === '1', opacity);
        addTestResult(`Dropdown ${index + 1} z-index`, parseInt(zIndex) > 0, zIndex);
      });
    }, 100);
  };

  const sideOptions = ['Buy', 'Sell'];
  const emotionOptions = ['Neutral', 'Greed', 'Fear', 'Confidence', 'Frustration', 'Discipline', 'Impatience', 'Euphoria'];

  return (
    <UnifiedLayout>
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Title */}
          <div className={`text-center mb-8 ${mounted ? 'text-reveal-animation' : 'opacity-0'}`}>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold-dim)] bg-clip-text text-transparent">
              Dropdown Debugging Test Page
            </h1>
            <p className="text-gray-400 text-lg">Comprehensive dropdown transparency and z-index testing</p>
          </div>

          {/* Test Results */}
          <div className="spotlight-wrapper relative rounded-2xl border border-[rgba(197,160,101,0.2)] bg-[rgba(18,18,18,0.4)] backdrop-blur-md p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Diagnostic Results</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono text-gray-300">
                  {result}
                </div>
              ))}
            </div>
            <button 
              onClick={runDiagnostics}
              className="mt-4 px-4 py-2 bg-[var(--gold)] text-black rounded-lg hover:bg-[var(--gold-light)] transition-colors"
            >
              Re-run Diagnostics
            </button>
          </div>

          {/* Dropdown Test Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strategy Dropdown Test */}
            <div className="spotlight-wrapper relative rounded-2xl border border-[rgba(197,160,101,0.2)] bg-[rgba(18,18,18,0.4)] backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Strategy Dropdown</h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStrategyDropdownOpen(!strategyDropdownOpen)}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white text-left flex items-center justify-between hover:border-[var(--gold)] transition-all duration-300"
                >
                  <span>Select Strategy</span>
                  <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: strategyDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    expand_more
                  </span>
                </button>
                
                {strategyDropdownOpen && (
                  <div className="dropdown-test absolute top-full left-0 right-0 z-50 w-full mt-2 max-h-60 overflow-y-auto rounded-lg shadow-2xl border border-[rgba(197,160,101,0.5)] bg-[#0A0A0A] custom-scrollbar">
                    <div className="px-4 py-3 cursor-pointer hover:bg-[rgba(197,160,101,0.1)] text-gray-400">
                      No Strategy
                    </div>
                    <div className="px-4 py-3 cursor-pointer hover:bg-[rgba(197,160,101,0.1)] text-white">
                      Strategy 1
                    </div>
                    <div className="px-4 py-3 cursor-pointer hover:bg-[rgba(197,160,101,0.1)] text-white">
                      Strategy 2
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side Dropdown Test */}
            <div className="spotlight-wrapper relative rounded-2xl border border-[rgba(197,160,101,0.2)] bg-[rgba(18,18,18,0.4)] backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Side Dropdown</h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSideDropdownOpen(!sideDropdownOpen)}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white text-left flex items-center justify-between hover:border-[var(--gold)] transition-all duration-300"
                >
                  <span>Buy</span>
                  <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: sideDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    expand_more
                  </span>
                </button>
                
                {sideDropdownOpen && (
                  <div className="dropdown-test absolute top-full left-0 right-0 z-30 w-full mt-2 max-h-60 overflow-y-auto rounded-lg shadow-2xl border border-[rgba(197,160,101,0.5)] bg-[#0A0A0A] custom-scrollbar">
                    {sideOptions.map(side => (
                      <div key={side} className="px-4 py-3 cursor-pointer hover:bg-[rgba(197,160,101,0.1)] text-white flex items-center gap-2">
                        <span className={`material-symbols-outlined ${side === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                          {side === 'Buy' ? 'trending_up' : 'trending_down'}
                        </span>
                        {side}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Emotion Dropdown Test */}
            <div className="spotlight-wrapper relative rounded-2xl border border-[rgba(197,160,101,0.2)] bg-[rgba(18,18,18,0.4)] backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Emotion Dropdown</h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmotionDropdownOpen(!emotionDropdownOpen)}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white text-left flex items-center justify-between hover:border-[var(--gold)] transition-all duration-300"
                >
                  <span>Neutral</span>
                  <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: emotionDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    expand_more
                  </span>
                </button>
                
                {emotionDropdownOpen && (
                  <div className="dropdown-test absolute top-full left-0 right-0 z-20 w-full mt-2 max-h-60 overflow-y-auto rounded-lg shadow-2xl border border-[rgba(197,160,101,0.5)] bg-[#0A0A0A] custom-scrollbar">
                    {emotionOptions.map(emotion => (
                      <div key={emotion} className="px-4 py-3 cursor-pointer hover:bg-[rgba(197,160,101,0.1)] text-white">
                        {emotion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Z-Index Layer Visualization */}
          <div className="spotlight-wrapper relative rounded-2xl border border-[rgba(197,160,101,0.2)] bg-[rgba(18,18,18,0.4)] backdrop-blur-md p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Z-Index Layer Visualization</h2>
            <div className="relative h-64 bg-[rgba(0,0,0,0.3)] rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-white text-lg font-semibold">
                Z-Index Stack Test
              </div>
              {/* Different z-index layers */}
              <div className="absolute top-4 left-4 w-20 h-20 bg-red-500/50" style={{ zIndex: 10 }}>z-10</div>
              <div className="absolute top-8 left-8 w-20 h-20 bg-green-500/50" style={{ zIndex: 20 }}>z-20</div>
              <div className="absolute top-12 left-12 w-20 h-20 bg-blue-500/50" style={{ zIndex: 30 }}>z-30</div>
              <div className="absolute top-16 left-16 w-20 h-20 bg-yellow-500/50" style={{ zIndex: 40 }}>z-40</div>
              <div className="absolute top-20 left-20 w-20 h-20 bg-purple-500/50" style={{ zIndex: 50 }}>z-50</div>
            </div>
          </div>

          {/* CSS Specificity Tests */}
          <div className="spotlight-wrapper relative rounded-2xl border border-[rgba(197,160,101,0.2)] bg-[rgba(18,18,18,0.4)] backdrop-blur-md p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">CSS Specificity Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[rgba(197,160,101,0.3)]">
                <h4 className="text-white font-semibold mb-2">Inline Style</h4>
                <div className="px-4 py-2 bg-[#1A1A1A] rounded text-white" style={{ backgroundColor: '#FF0000' }}>
                  Should be red (inline style)
                </div>
              </div>
              <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[rgba(197,160,101,0.3)]">
                <h4 className="text-white font-semibold mb-2">CSS Class</h4>
                <div className="px-4 py-2 bg-blue-500 rounded text-white">
                  Should be blue (CSS class)
                </div>
              </div>
            </div>
          </div>

          {/* Browser Compatibility Info */}
          <div className="spotlight-wrapper relative rounded-2xl border border-[rgba(197,160,101,0.2)] bg-[rgba(18,18,18,0.4)] backdrop-blur-md p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Browser Compatibility</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-[#0A0A0A] rounded-lg">
                <h4 className="text-white font-semibold mb-2">User Agent</h4>
                <p className="text-gray-300">{typeof window !== 'undefined' ? navigator.userAgent : 'Server-side'}</p>
              </div>
              <div className="p-4 bg-[#0A0A0A] rounded-lg">
                <h4 className="text-white font-semibold mb-2">Viewport</h4>
                <p className="text-gray-300">{typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Server-side'}</p>
              </div>
              <div className="p-4 bg-[#0A0A0A] rounded-lg">
                <h4 className="text-white font-semibold mb-2">CSS Support</h4>
                <p className="text-gray-300">Backdrop Filter: {typeof document !== 'undefined' && CSS.supports('backdrop-filter', 'blur(10px)') ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Close dropdowns when clicking outside */}
        {(strategyDropdownOpen || sideDropdownOpen || emotionDropdownOpen) && (
          <div
            className="fixed inset-0 z-15 bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setStrategyDropdownOpen(false);
              setSideDropdownOpen(false);
              setEmotionDropdownOpen(false);
            }}
          />
        )}
      </div>
    </UnifiedLayout>
  );
}