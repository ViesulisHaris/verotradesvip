'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardCard from '@/components/ui/DashboardCard';
import DominantEmotionCard from '@/components/ui/DominantEmotionCard';
import SharpeRatioGauge from '@/components/ui/SharpeRatioGauge';
import EmotionRadar from '@/components/ui/EmotionRadar';
import FixedPnLChart from '@/components/ui/FixedPnLChart';
import PnLChart from '@/components/ui/PnLChart';
import PerformanceChart from '@/components/ui/PerformanceChart';
import EquityGraph from '@/components/ui/EquityGraph';
import MarketDistributionChart from '@/components/ui/MarketDistributionChart';
import PerformanceTrendChart from '@/components/ui/PerformanceTrendChart';
import StrategyPerformanceChart from '@/components/ui/StrategyPerformanceChart';
import VRatingCard from '@/components/ui/VRatingCard';

interface ChartTestResult {
  componentName: string;
  hasTransparentBackground: boolean;
  backgroundColor?: string;
  backgroundImage?: string;
  issues: string[];
  status: 'PASS' | 'FAIL' | 'WARNING';
}

interface TestResults {
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  balatroBackgroundVisible: boolean;
  chartResults: ChartTestResult[];
  summary: {
    totalCharts: number;
    passedCharts: number;
    failedCharts: number;
    warningCharts: number;
  };
  timestamp: string;
}

export default function ChartTransparencyTest() {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const router = useRouter();
  const testContainerRef = useRef<HTMLDivElement>(null);

  // Sample data for charts
  const sampleEmotionData = [
    { subject: 'FOMO', value: 25, fullMark: 50, leaning: 'Balanced', side: 'Buy', leaningValue: 10, totalTrades: 5 },
    { subject: 'PATIENCE', value: 40, fullMark: 50, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 25, totalTrades: 8 },
    { subject: 'DISCIPLINE', value: 35, fullMark: 50, leaning: 'Balanced', side: 'NULL', leaningValue: 0, totalTrades: 7 },
    { subject: 'CONFIDENT', value: 30, fullMark: 50, leaning: 'Buy Leaning', side: 'Buy', leaningValue: 15, totalTrades: 6 }
  ];

  const samplePnLData = Array.from({ length: 10 }, (_, i) => ({
    date: `Day ${i + 1}`,
    pnl: Math.random() * 1000 - 500,
    cumulative: (Math.random() - 0.5) * (i + 1) * 100
  }));

  const sampleMarketData = [
    { market: 'Stock', count: 45, percentage: 45 },
    { market: 'Crypto', count: 30, percentage: 30 },
    { market: 'Forex', count: 15, percentage: 15 },
    { market: 'Futures', count: 10, percentage: 10 }
  ];

  const sampleVRatingData = {
    overallScore: 75,
    categories: {
      profitability: {
        name: 'Profitability',
        score: 80,
        weight: 30,
        contribution: 24,
        keyMetrics: ['Win Rate', 'P&L', 'Profit Factor'],
        icon: () => null
      },
      riskManagement: {
        name: 'Risk Management',
        score: 70,
        weight: 25,
        contribution: 17.5,
        keyMetrics: ['Drawdown', 'Position Size', 'Stop Loss'],
        icon: () => null
      },
      consistency: {
        name: 'Consistency',
        score: 75,
        weight: 20,
        contribution: 15,
        keyMetrics: ['Steady P&L', 'Regular Trading', 'Low Variance'],
        icon: () => null
      },
      emotionalDiscipline: {
        name: 'Emotional Discipline',
        score: 72,
        weight: 15,
        contribution: 10.8,
        keyMetrics: ['Positive Emotions', 'Emotional Control', 'Mindfulness'],
        icon: () => null
      },
      journalingAdherence: {
        name: 'Journaling Adherence',
        score: 68,
        weight: 10,
        contribution: 6.8,
        keyMetrics: ['Complete Notes', 'Regular Updates', 'Strategy Tracking'],
        icon: () => null
      }
    },
    adjustments: [],
    calculatedAt: new Date().toISOString()
  };

  const checkElementTransparency = (element: HTMLElement, componentName: string): ChartTestResult => {
    const issues: string[] = [];
    let hasTransparentBackground = true;
    let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';

    // Get computed styles
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    const backgroundImage = computedStyle.backgroundImage;
    const opacity = parseFloat(computedStyle.opacity);

    // Check for solid/opaque backgrounds
    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
      // Check if it's a solid color (not rgba with transparency)
      if (!backgroundColor.includes('rgba') || backgroundColor.includes('rgba(0, 0, 0, 0)')) {
        hasTransparentBackground = false;
        issues.push(`Non-transparent background detected: ${backgroundColor}`);
        status = 'FAIL';
      }
    }

    // Check for background images that might block transparency
    if (backgroundImage && backgroundImage !== 'none') {
      issues.push(`Background image detected: ${backgroundImage}`);
      status = status === 'FAIL' ? 'FAIL' : 'WARNING';
    }

    // Check for opacity less than 1 (which might indicate transparency issues)
    if (opacity < 0.95) {
      issues.push(`Low opacity detected: ${opacity}`);
      status = status === 'FAIL' ? 'FAIL' : 'WARNING';
    }

    return {
      componentName,
      hasTransparentBackground,
      backgroundColor,
      backgroundImage,
      issues,
      status
    };
  };

  const checkBalatroBackground = (): boolean => {
    // Check if Balatro background canvas is present and visible
    const balatroCanvas = document.querySelector('.balatro-canvas') as HTMLCanvasElement;
    if (!balatroCanvas) {
      return false;
    }

    // Check if canvas is visible and has content
    const rect = balatroCanvas.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    
    // Check if canvas is actually rendering (has WebGL context)
    const gl = balatroCanvas.getContext('webgl') || balatroCanvas.getContext('experimental-webgl');
    const hasWebGL = !!gl;
    
    return isVisible && hasWebGL;
  };

  const runTransparencyTest = async () => {
    setIsRunning(true);
    setCurrentTest('Initializing test environment...');

    // Wait a moment for components to render
    await new Promise(resolve => setTimeout(resolve, 1000));

    const chartResults: ChartTestResult[] = [];
    const chartSelectors = [
      { selector: '.chart-container-enhanced', name: 'Chart Container Enhanced' },
      { selector: '.chart-container', name: 'Chart Container' },
      { selector: '[class*="chart"]', name: 'Chart Elements' },
      { selector: '.recharts-wrapper', name: 'Recharts Wrapper' },
      { selector: '.recharts-surface', name: 'Recharts Surface' }
    ];

    // Test each chart component
    const chartComponents = [
      { selector: '[data-testid="emotion-radar"]', name: 'EmotionRadar' },
      { selector: '[data-testid="fixed-pnl-chart"]', name: 'FixedPnLChart' },
      { selector: '[data-testid="pnl-chart"]', name: 'PnLChart' },
      { selector: '[data-testid="performance-chart"]', name: 'PerformanceChart' },
      { selector: '[data-testid="equity-graph"]', name: 'EquityGraph' },
      { selector: '[data-testid="market-distribution-chart"]', name: 'MarketDistributionChart' },
      { selector: '[data-testid="performance-trend-chart"]', name: 'PerformanceTrendChart' },
      { selector: '[data-testid="strategy-performance-chart"]', name: 'StrategyPerformanceChart' }
    ];

    for (const component of chartComponents) {
      setCurrentTest(`Testing ${component.name}...`);
      
      const elements = document.querySelectorAll(component.selector);
      if (elements.length === 0) {
        // Try to find elements by other means
        const alternativeElements = document.querySelectorAll(component.selector.replace(/\[data-testid="[^"]*"\]/g, ''));
        if (alternativeElements.length > 0) {
          alternativeElements.forEach((element, index) => {
            const result = checkElementTransparency(element as HTMLElement, `${component.name} (${index + 1})`);
            chartResults.push(result);
          });
        } else {
          chartResults.push({
            componentName: component.name,
            hasTransparentBackground: false,
            issues: ['Component not found in DOM'],
            status: 'WARNING'
          });
        }
      } else {
        elements.forEach((element, index) => {
          const result = checkElementTransparency(element as HTMLElement, `${component.name} (${index + 1})`);
          chartResults.push(result);
        });
      }
    }

    // Test general chart containers
    for (const selector of chartSelectors) {
      setCurrentTest(`Testing ${selector.name}...`);
      const elements = document.querySelectorAll(selector.selector);
      elements.forEach((element, index) => {
        const result = checkElementTransparency(element as HTMLElement, `${selector.name} (${index + 1})`);
        chartResults.push(result);
      });
    }

    setCurrentTest('Checking Balatro background...');
    const balatroBackgroundVisible = checkBalatroBackground();

    // Calculate overall status
    const passedCharts = chartResults.filter(r => r.status === 'PASS').length;
    const failedCharts = chartResults.filter(r => r.status === 'FAIL').length;
    const warningCharts = chartResults.filter(r => r.status === 'WARNING').length;

    let overallStatus: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
    if (failedCharts > 0) {
      overallStatus = 'FAIL';
    } else if (warningCharts > 0 || !balatroBackgroundVisible) {
      overallStatus = 'WARNING';
    }

    const results: TestResults = {
      overallStatus,
      balatroBackgroundVisible,
      chartResults,
      summary: {
        totalCharts: chartResults.length,
        passedCharts,
        failedCharts,
        warningCharts
      },
      timestamp: new Date().toISOString()
    };

    setTestResults(results);
    setCurrentTest('Test completed!');
    setIsRunning(false);
  };

  const downloadResults = () => {
    if (!testResults) return;

    const dataStr = JSON.stringify(testResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `chart-transparency-test-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-400';
      case 'FAIL': return 'text-red-400';
      case 'WARNING': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'PASS': return 'bg-green-500/20 border-green-500/30';
      case 'FAIL': return 'bg-red-500/20 border-red-500/30';
      case 'WARNING': return 'bg-yellow-500/20 border-yellow-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen p-6" ref={testContainerRef}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Chart Background Transparency Test</h1>
          <p className="text-slate-400">
            Verify that all chart components have transparent backgrounds and integrate seamlessly with the Balatro background
          </p>
        </div>

        {/* Test Controls */}
        <div className="glass-enhanced rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Test Controls</h2>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                View Dashboard
              </button>
              <button
                onClick={runTransparencyTest}
                disabled={isRunning}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isRunning ? 'Running Test...' : 'Run Transparency Test'}
              </button>
            </div>
          </div>
          
          {isRunning && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-white">{currentTest}</span>
              </div>
            </div>
          )}
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className={`glass-enhanced rounded-xl p-6 border ${getStatusBg(testResults.overallStatus)}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Overall Test Results</h2>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${getStatusColor(testResults.overallStatus)}`}>
                    {testResults.overallStatus}
                  </span>
                  <button
                    onClick={downloadResults}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Download Results
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{testResults.summary.totalCharts}</div>
                  <div className="text-sm text-slate-400">Total Charts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{testResults.summary.passedCharts}</div>
                  <div className="text-sm text-slate-400">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{testResults.summary.failedCharts}</div>
                  <div className="text-sm text-slate-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{testResults.summary.warningCharts}</div>
                  <div className="text-sm text-slate-400">Warnings</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-white">Balatro Background:</span>
                  <span className={`font-bold ${testResults.balatroBackgroundVisible ? 'text-green-400' : 'text-red-400'}`}>
                    {testResults.balatroBackgroundVisible ? 'VISIBLE' : 'NOT VISIBLE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="glass-enhanced rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Detailed Chart Results</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.chartResults.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getStatusBg(result.status)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{result.componentName}</span>
                      <span className={`font-bold ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-slate-300 mb-2">
                      <div>Transparent Background: {result.hasTransparentBackground ? 'YES' : 'NO'}</div>
                      {result.backgroundColor && (
                        <div>Background Color: {result.backgroundColor}</div>
                      )}
                      {result.backgroundImage && result.backgroundImage !== 'none' && (
                        <div>Background Image: {result.backgroundImage}</div>
                      )}
                    </div>
                    
                    {result.issues.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-red-400 mb-1">Issues:</div>
                        <ul className="text-xs text-red-300 list-disc list-inside">
                          {result.issues.map((issue, issueIndex) => (
                            <li key={issueIndex}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Test Metadata */}
            <div className="glass-enhanced rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Test Metadata</h3>
              <div className="text-sm text-slate-300">
                <div>Test Timestamp: {new Date(testResults.timestamp).toLocaleString()}</div>
                <div>Browser: {navigator.userAgent}</div>
                <div>Screen Resolution: {window.screen.width}x{window.screen.height}</div>
                <div>Viewport Size: {window.innerWidth}x{window.innerHeight}</div>
              </div>
            </div>
          </div>
        )}

        {/* Sample Charts for Testing */}
        {!testResults && (
          <div className="space-y-6">
            <div className="glass-enhanced rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Sample Charts for Testing</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Emotion Radar */}
                <div data-testid="emotion-radar" className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Emotion Radar</h3>
                  <div className="chart-container-enhanced">
                    <EmotionRadar data={sampleEmotionData} />
                  </div>
                </div>

                {/* P&L Chart */}
                <div data-testid="fixed-pnl-chart" className="space-y-4">
                  <h3 className="text-lg font-medium text-white">P&L Chart</h3>
                  <div className="chart-container-enhanced">
                    <FixedPnLChart data={samplePnLData} />
                  </div>
                </div>

                {/* Performance Chart */}
                <div data-testid="performance-chart" className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Performance Chart</h3>
                  <div className="chart-container-enhanced">
                    <PerformanceChart data={samplePnLData} />
                  </div>
                </div>

                {/* Equity Graph */}
                <div data-testid="equity-graph" className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Equity Graph</h3>
                  <div className="chart-container-enhanced">
                    <EquityGraph data={samplePnLData} />
                  </div>
                </div>

                {/* Market Distribution Chart */}
                <div data-testid="market-distribution-chart" className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Market Distribution</h3>
                  <div className="chart-container-enhanced">
                    <MarketDistributionChart data={sampleMarketData} />
                  </div>
                </div>

                {/* Performance Trend Chart */}
                <div data-testid="performance-trend-chart" className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Performance Trend</h3>
                  <div className="chart-container-enhanced">
                    <PerformanceTrendChart data={samplePnLData} />
                  </div>
                </div>

                {/* Strategy Performance Chart */}
                <div data-testid="strategy-performance-chart" className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Strategy Performance</h3>
                  <div className="chart-container-enhanced">
                    <StrategyPerformanceChart data={samplePnLData} />
                  </div>
                </div>

                {/* VRating Card */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">VRating Card</h3>
                  <div className="glass-enhanced">
                    <VRatingCard vRatingData={sampleVRatingData} />
                  </div>
                </div>

                {/* Dashboard Cards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Dashboard Cards</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DashboardCard
                      title="Sample P&L"
                      value="$1,234.56"
                      profitability="good"
                    />
                    <DashboardCard
                      title="Sample Winrate"
                      value="65.5%"
                      profitability="medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}