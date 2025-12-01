'use client';

import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';

export default function TestDashboardCardVRating() {
  const [renderCount, setRenderCount] = useState(0);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Track render count for performance testing
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            DashboardCard VRating Feature Test
          </h1>
          <p className="text-slate-300 mb-4">
            Comprehensive testing of enhanced DashboardCard component with VRating support
          </p>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
            <p className="text-sm text-slate-400">
              Component Render Count: <span className="text-green-400 font-mono">{renderCount}</span>
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Testing memoization performance - count should only increase when props change
            </p>
          </div>
        </div>

        {/* VRating Color Coding Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">1. VRating Color Coding Tests</h2>
          <p className="text-slate-400 mb-4">Testing all VRating ranges (1.0-10.0 scale)</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Red Range (1.0-1.9) */}
            <DashboardCard
              title="VRating 1.5 (Red Range)"
              value="1.5/10"
              vRating={1.5}
              vRatingCategory="profitability"
              icon="alert"
              tooltip="Red range: 1.0-1.9 - Critical performance issues"
            />
            
            {/* Orange Range (2.0-3.9) */}
            <DashboardCard
              title="VRating 3.2 (Orange Range)"
              value="3.2/10"
              vRating={3.2}
              vRatingCategory="riskManagement"
              icon="alert"
              tooltip="Orange range: 2.0-3.9 - Poor performance"
            />
            
            {/* Yellow Range (4.0-5.9) */}
            <DashboardCard
              title="VRating 5.0 (Yellow Range)"
              value="5.0/10"
              vRating={5.0}
              vRatingCategory="consistency"
              icon="clock"
              tooltip="Yellow range: 4.0-5.9 - Average performance"
            />
            
            {/* Green Range (6.0-7.9) */}
            <DashboardCard
              title="VRating 7.2 (Green Range)"
              value="7.2/10"
              vRating={7.2}
              vRatingCategory="emotionalDiscipline"
              icon="brain"
              tooltip="Green range: 6.0-7.9 - Good performance"
            />
            
            {/* Blue Range (8.0-8.9) */}
            <DashboardCard
              title="VRating 8.5 (Blue Range)"
              value="8.5/10"
              vRating={8.5}
              vRatingCategory="journalingAdherence"
              icon="book"
              tooltip="Blue range: 8.0-8.9 - Very good performance"
            />
            
            {/* Purple Range (9.0-10.0) */}
            <DashboardCard
              title="VRating 9.8 (Purple Range)"
              value="9.8/10"
              vRating={9.8}
              vRatingCategory="profitability"
              icon="star"
              tooltip="Purple range: 9.0-10.0 - Excellent performance"
            />
          </div>
        </section>

        {/* Tooltip Functionality Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">2. Tooltip Functionality Tests</h2>
          <p className="text-slate-400 mb-4">Hover over cards to test glass morphism tooltips</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Short Tooltip"
              value="Test"
              vRating={7.5}
              icon="info"
              tooltip="Short tooltip text"
            />
            
            <DashboardCard
              title="Long Tooltip"
              value="Test"
              vRating={8.2}
              icon="info"
              tooltip="This is a much longer tooltip that should demonstrate how the component handles extended text content with proper wrapping and sizing"
            />
            
            <DashboardCard
              title="No Tooltip"
              value="Test"
              vRating={6.8}
              icon="info"
            />
          </div>
        </section>

        {/* Icon Selection Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">3. Icon Selection Tests</h2>
          <p className="text-slate-400 mb-4">Testing all supported icon types</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Trending Icon"
              value="+15.2%"
              vRating={8.1}
              icon="trending"
              tooltip="Trending up/down based on value"
            />
            
            <DashboardCard
              title="Shield Icon"
              value="Protected"
              vRating={7.5}
              icon="shield"
              tooltip="Security/risk management icon"
            />
            
            <DashboardCard
              title="Target Icon"
              value="85%"
              vRating={8.5}
              icon="target"
              tooltip="Goal/achievement icon"
            />
            
            <DashboardCard
              title="Brain Icon"
              value="Analytical"
              vRating={9.2}
              icon="brain"
              tooltip="Intelligence/strategy icon"
            />
            
            <DashboardCard
              title="Book Icon"
              value="Educational"
              vRating={7.8}
              icon="book"
              tooltip="Learning/journaling icon"
            />
            
            <DashboardCard
              title="Activity Icon"
              value="Active"
              vRating={8.3}
              icon="activity"
              tooltip="Performance/activity icon"
            />
            
            <DashboardCard
              title="Alert Icon"
              value="Warning"
              vRating={3.5}
              icon="alert"
              tooltip="Alert/warning icon"
            />
            
            <DashboardCard
              title="Check Icon"
              value="Complete"
              vRating={9.5}
              icon="check"
              tooltip="Success/completion icon"
            />
            
            <DashboardCard
              title="Star Icon"
              value="Premium"
              vRating={9.8}
              icon="star"
              tooltip="Premium/excellence icon"
            />
            
            <DashboardCard
              title="Clock Icon"
              value="24h"
              vRating={7.2}
              icon="clock"
              tooltip="Time/duration icon"
            />
            
            <DashboardCard
              title="Zap Icon"
              value="Fast"
              vRating={8.7}
              icon="zap"
              tooltip="Speed/energy icon"
            />
            
            <DashboardCard
              title="Info Icon"
              value="Details"
              vRating={6.9}
              icon="info"
              tooltip="Information icon"
            />
            
            <DashboardCard
              title="Chart Icon"
              value="Analytics"
              vRating={8.4}
              icon="chart"
              tooltip="Data/analytics icon"
            />
          </div>
        </section>

        {/* Responsive Design Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">4. Responsive Design Tests</h2>
          <p className="text-slate-400 mb-4">Testing text truncation for long metric names</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="This is an extremely long metric name that should be truncated properly"
              value="1,234.56"
              vRating={7.5}
              icon="chart"
              tooltip="Testing text truncation with very long titles"
            />
            
            <DashboardCard
              title="Normal Title"
              value="This is an extremely long value that should also be truncated properly when it exceeds the available space"
              vRating={8.2}
              icon="info"
              tooltip="Testing value truncation"
            />
            
            <DashboardCard
              title="Both Long Title and Value That Should Be Truncated"
              value="Extremely Long Value Text That Exceeds Normal Display Width"
              vRating={6.7}
              icon="alert"
              tooltip="Testing both title and value truncation"
            />
          </div>
        </section>

        {/* Backward Compatibility Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">5. Backward Compatibility Tests</h2>
          <p className="text-slate-400 mb-4">Testing existing DashboardCard usage without VRating</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Original profitability prop */}
            <DashboardCard
              title="Profitability Good"
              value="+25.5%"
              profitability="good"
              icon="trending"
              tooltip="Original profitability prop test"
            />
            
            <DashboardCard
              title="Profitability Medium"
              value="+5.2%"
              profitability="medium"
              icon="trending"
              tooltip="Original profitability prop test"
            />
            
            <DashboardCard
              title="Profitability Bad"
              value="-15.3%"
              profitability="bad"
              icon="trending"
              tooltip="Original profitability prop test"
            />
            
            {/* Negative value detection */}
            <DashboardCard
              title="Negative Value"
              value="-42.7%"
              icon="trending"
              tooltip="Negative value should show red"
            />
            
            <DashboardCard
              title="Positive Value"
              value="+18.9%"
              icon="trending"
              tooltip="Positive value should show green"
            />
            
            {/* Minimal props */}
            <DashboardCard
              title="Minimal Props"
              value="Basic"
              tooltip="Only required props provided"
            />
          </div>
        </section>

        {/* Performance Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">6. Performance Tests</h2>
          <p className="text-slate-400 mb-4">Testing memoization and render optimization</p>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Render Performance Test</h3>
              <button
                onClick={() => setRenderCount(0)}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
              >
                Reset Counter
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              The cards below should not trigger re-renders when other state changes occur
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DashboardCard
                title="Memoized Card 1"
                value="8.5/10"
                vRating={8.5}
                icon="star"
                tooltip="This card should not re-render unnecessarily"
              />
              <DashboardCard
                title="Memoized Card 2"
                value="7.2/10"
                vRating={7.2}
                icon="shield"
                tooltip="Memoization prevents unnecessary renders"
              />
              <DashboardCard
                title="Memoized Card 3"
                value="9.1/10"
                vRating={9.1}
                icon="target"
                tooltip="Performance optimized with React.memo"
              />
              <DashboardCard
                title="Memoized Card 4"
                value="6.8/10"
                vRating={6.8}
                icon="brain"
                tooltip="Efficient rendering with stable props"
              />
            </div>
          </div>
        </section>

        {/* VRating Categories Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">7. VRating Categories Test</h2>
          <p className="text-slate-400 mb-4">Testing all VRating category types</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Profitability Rating"
              value="8.7/10"
              vRating={8.7}
              vRatingCategory="profitability"
              icon="trending"
              tooltip="Profitability category rating"
            />
            
            <DashboardCard
              title="Risk Management"
              value="7.9/10"
              vRating={7.9}
              vRatingCategory="riskManagement"
              icon="shield"
              tooltip="Risk management category rating"
            />
            
            <DashboardCard
              title="Consistency"
              value="8.2/10"
              vRating={8.2}
              vRatingCategory="consistency"
              icon="activity"
              tooltip="Consistency category rating"
            />
            
            <DashboardCard
              title="Emotional Discipline"
              value="9.1/10"
              vRating={9.1}
              vRatingCategory="emotionalDiscipline"
              icon="brain"
              tooltip="Emotional discipline category rating"
            />
            
            <DashboardCard
              title="Journaling Adherence"
              value="7.5/10"
              vRating={7.5}
              vRatingCategory="journalingAdherence"
              icon="book"
              tooltip="Journaling adherence category rating"
            />
          </div>
        </section>

        {/* Test Results Log */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">8. Test Results</h2>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Manual Test Verification</h3>
              <button
                onClick={() => {
                  addTestResult("Manual verification completed - All features working correctly");
                }}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
              >
                Mark Tests Complete
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">VRating color coding: Verify colors match expected ranges</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Tooltips: Hover over cards to see glass morphism tooltips</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Icons: Verify all icon types render correctly</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Responsive: Resize browser to test text truncation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Backward compatibility: Original props still work</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Performance: Monitor render count for memoization</span>
              </div>
            </div>
            
            {testResults.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Test Log:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-xs text-slate-400 font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Color Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-400">9. VRating Color Reference</h2>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-400 rounded"></div>
                <span className="text-sm text-slate-300">1.0-1.9: Red (Critical)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-400 rounded"></div>
                <span className="text-sm text-slate-300">2.0-3.9: Orange (Poor)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded"></div>
                <span className="text-sm text-slate-300">4.0-5.9: Yellow (Average)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-400 rounded"></div>
                <span className="text-sm text-slate-300">6.0-7.9: Green (Good)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded"></div>
                <span className="text-sm text-slate-300">8.0-8.9: Blue (Very Good)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-400 rounded"></div>
                <span className="text-sm text-slate-300">9.0-10.0: Purple (Excellent)</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}