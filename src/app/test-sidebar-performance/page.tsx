'use client';

import React, { useState } from 'react';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import { useSidebarSync } from '@/hooks/useSidebarSync';

export default function SidebarPerformanceTest() {
  const [showMonitor, setShowMonitor] = useState(true);
  const { isCollapsed, isTransitioning, toggleSidebar } = useSidebarSync();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="glass-enhanced p-8 rounded-xl mb-8">
          <h1 className="text-3xl font-bold text-white mb-6 text-gradient">
            Sidebar Performance Test
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="glass p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
              
              <div className="space-y-4">
                <button
                  onClick={toggleSidebar}
                  className="w-full btn-primary text-lg py-4"
                  disabled={isTransitioning}
                >
                  {isTransitioning ? 'Transitioning...' : `Toggle Sidebar (${isCollapsed ? 'Collapsed' : 'Expanded'})`}
                </button>
                
                <button
                  onClick={() => setShowMonitor(!showMonitor)}
                  className="w-full btn-secondary text-lg py-4"
                >
                  {showMonitor ? 'Hide' : 'Show'} Performance Monitor
                </button>
              </div>
            </div>
            
            <div className="glass p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
              
              <div className="space-y-3 text-white/80">
                <p>1. Click "Toggle Sidebar" multiple times to test the performance</p>
                <p>2. Watch the Performance Monitor for real-time metrics</p>
                <p>3. Look for these improvements:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li className="text-green-400">✓ Sidebar transitions should complete in ~300ms</li>
                  <li className="text-green-400">✓ Charts should resize immediately with sidebar</li>
                  <li className="text-green-400">✓ No lag between sidebar and chart animations</li>
                  <li className="text-green-400">✓ Smooth 60fps animations throughout</li>
                  <li className="text-green-400">✓ Performance grade should be A or A+</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Expected Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2">Before Optimization</h3>
                <div className="space-y-2 text-sm text-red-400">
                  <p>• 2-5 second lag on sidebar toggle</p>
                  <p>• Charts resize after sidebar completes</p>
                  <p>• Sequential animation execution</p>
                  <p>• Multiple re-renders causing lag</p>
                  <p>• Poor performance grade (C or D)</p>
                </div>
              </div>
              
              <div className="glass p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2">After Optimization</h3>
                <div className="space-y-2 text-sm text-green-400">
                  <p>• ~300ms sidebar transition time</p>
                  <p>• Charts resize simultaneously with sidebar</p>
                  <p>• Parallel animation execution</p>
                  <p>• Optimized re-renders with debouncing</p>
                  <p>• Performance grade A or A+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Monitor */}
        {showMonitor && <PerformanceMonitor enabled={true} />}
        
        {/* Test Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="glass-enhanced p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Test Chart 1</h2>
            <div className="chart-container-stable h-80 bg-black/20 rounded-lg flex items-center justify-center">
              <div className="text-white/60 text-center">
                <div className="w-16 h-16 bg-blue-500/30 rounded-lg mb-2 mx-auto animate-pulse"></div>
                <p>EmotionRadar Test Area</p>
                <p className="text-xs text-white/40 mt-1">Should resize with sidebar</p>
              </div>
            </div>
          </div>
          
          <div className="glass-enhanced p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Test Chart 2</h2>
            <div className="chart-container-stable h-80 bg-black/20 rounded-lg flex items-center justify-center">
              <div className="text-white/60 text-center">
                <div className="w-16 h-16 bg-teal-500/30 rounded-lg mb-2 mx-auto animate-pulse"></div>
                <p>PnLChart Test Area</p>
                <p className="text-xs text-white/40 mt-1">Should resize with sidebar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}