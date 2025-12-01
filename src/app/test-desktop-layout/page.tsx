'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Monitor, Smartphone, Tablet, Monitor as Desktop, Maximize2, Minimize2, Download, Play, Pause, RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ViewportSize {
  name: string;
  width: number;
  height: number;
  type: 'mobile' | 'tablet' | 'desktop' | 'large-desktop';
  icon: React.ComponentType<any>;
}

interface TestResult {
  viewport: ViewportSize;
  contentWidth: number;
  contentWidthPercent: number;
  sidebarVisible: boolean;
  sidebarWidth: number;
  mobileLikeAppearance: boolean;
  screenshot?: string;
  timestamp: string;
}

interface LayoutMetrics {
  totalWidth: number;
  contentAreaWidth: number;
  sidebarWidth: number;
  contentUtilization: number;
  sidebarType: 'desktop' | 'mobile' | 'none';
  overflowX: boolean;
}

const VIEWPORTS: ViewportSize[] = [
  { name: 'Mobile Small', width: 375, height: 667, type: 'mobile', icon: Smartphone },
  { name: 'Mobile Large', width: 414, height: 896, type: 'mobile', icon: Smartphone },
  { name: 'Tablet', width: 768, height: 1024, type: 'tablet', icon: Tablet },
  { name: 'Desktop Small', width: 1024, height: 768, type: 'desktop', icon: Desktop },
  { name: 'Desktop Medium', width: 1280, height: 800, type: 'desktop', icon: Desktop },
  { name: 'Desktop Large', width: 1440, height: 900, type: 'desktop', icon: Desktop },
  { name: 'Desktop Ultra', width: 1920, height: 1080, type: 'large-desktop', icon: Monitor },
];

// Ensure we have at least one viewport
const DEFAULT_VIEWPORT: ViewportSize = VIEWPORTS[0] || {
  name: 'Default Desktop',
  width: 1280,
  height: 800,
  type: 'desktop',
  icon: Desktop
};

export default function DesktopLayoutTest() {
  const [selectedViewport, setSelectedViewport] = useState<ViewportSize>(DEFAULT_VIEWPORT);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<LayoutMetrics | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [autoTest, setAutoTest] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const testContainerRef = useRef<HTMLDivElement>(null);

  // Measure layout metrics from iframe
  const measureLayoutMetrics = useCallback(async (): Promise<LayoutMetrics | null> => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      return null;
    }

    try {
      const iframeWindow = iframeRef.current.contentWindow;
      const iframeDocument = iframeWindow.document;

      // Wait a bit for any layout changes to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get computed styles
      const bodyStyle = iframeWindow.getComputedStyle(iframeDocument.body);
      const mainElement = iframeDocument.querySelector('main') || iframeDocument.body;
      const mainStyle = iframeWindow.getComputedStyle(mainElement);
      
      // Find sidebar elements
      const desktopSidebar = iframeDocument.querySelector('[class*="lg:flex"]') as HTMLElement;
      const mobileSidebar = iframeDocument.querySelector('[class*="lg:hidden"]') as HTMLElement;
      
      // Calculate metrics
      const totalWidth = iframeWindow.innerWidth;
      const contentAreaWidth = mainElement ? mainElement.offsetWidth : 0;
      const sidebarWidth = desktopSidebar ? desktopSidebar.offsetWidth : (mobileSidebar ? mobileSidebar.offsetWidth : 0);
      const contentUtilization = totalWidth > 0 ? ((contentAreaWidth / totalWidth) * 100) : 0;
      
      // Determine sidebar type
      let sidebarType: 'desktop' | 'mobile' | 'none' = 'none';
      if (desktopSidebar && iframeWindow.getComputedStyle(desktopSidebar).display !== 'none') {
        sidebarType = 'desktop';
      } else if (mobileSidebar && iframeWindow.getComputedStyle(mobileSidebar).display !== 'none') {
        sidebarType = 'mobile';
      }

      // Check for horizontal overflow
      const overflowX = bodyStyle.overflowX === 'hidden' && totalWidth < iframeDocument.documentElement.scrollWidth;

      return {
        totalWidth,
        contentAreaWidth,
        sidebarWidth,
        contentUtilization,
        sidebarType,
        overflowX
      };
    } catch (error) {
      console.error('Error measuring layout:', error);
      return null;
    }
  }, []);

  // Capture screenshot of iframe
  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    if (!iframeRef.current) return null;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = selectedViewport.width;
      canvas.height = selectedViewport.height;

      // Draw iframe content to canvas (simplified version)
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add viewport info overlay
      ctx.fillStyle = '#B89B5E';
      ctx.font = '14px monospace';
      ctx.fillText(`${selectedViewport.name} (${selectedViewport.width}x${selectedViewport.height})`, 10, 25);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  }, [selectedViewport]);

  // Test single viewport
  const testViewport = useCallback(async (viewport: ViewportSize): Promise<TestResult | null> => {
    if (!iframeRef.current) return null;

    // Set iframe size
    iframeRef.current.style.width = `${viewport.width}px`;
    iframeRef.current.style.height = `${viewport.height}px`;

    // Wait for iframe to resize and settle
    await new Promise(resolve => setTimeout(resolve, 500));

    // Measure metrics
    const metrics = await measureLayoutMetrics();
    if (!metrics) return null;

    // Determine if mobile-like appearance exists
    const mobileLikeAppearance = 
      viewport.type === 'desktop' && (
        metrics.contentUtilization < 75 || // Content uses less than 75% of available width
        metrics.sidebarType === 'mobile' || // Mobile sidebar on desktop
        metrics.overflowX // Horizontal overflow detected
      );

    // Capture screenshot
    const screenshot = await captureScreenshot();

    return {
      viewport,
      contentWidth: metrics.contentAreaWidth,
      contentWidthPercent: metrics.contentUtilization,
      sidebarVisible: metrics.sidebarType !== 'none',
      sidebarWidth: metrics.sidebarWidth,
      mobileLikeAppearance,
      screenshot: screenshot || undefined,
      timestamp: new Date().toISOString()
    };
  }, [measureLayoutMetrics, captureScreenshot]);

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setTestProgress(0);
    const results: TestResult[] = [];

    for (let i = 0; i < VIEWPORTS.length; i++) {
      const viewport = VIEWPORTS[i];
      if (viewport) {
        setSelectedViewport(viewport);
        
        const result = await testViewport(viewport);
        if (result) {
          results.push(result);
        }
      }
      
      setTestProgress(((i + 1) / VIEWPORTS.length) * 100);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTestResults(results);
    setIsRunning(false);
    setTestProgress(0);
  }, [testViewport]);

  // Run auto test continuously
  useEffect(() => {
    if (autoTest && !isRunning) {
      const interval = setInterval(() => {
        runAllTests();
      }, 30000); // Run every 30 seconds

      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoTest, isRunning, runAllTests]);

  // Update current metrics when viewport changes
  useEffect(() => {
    const updateMetrics = async () => {
      const metrics = await measureLayoutMetrics();
      setCurrentMetrics(metrics);
    };

    if (iframeLoaded) {
      updateMetrics();
    }
  }, [selectedViewport, iframeLoaded, measureLayoutMetrics]);

  // Download test results
  const downloadResults = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      testResults,
      summary: {
        totalTests: testResults.length,
        passedTests: testResults.filter(r => !r.mobileLikeAppearance).length,
        failedTests: testResults.filter(r => r.mobileLikeAppearance).length,
        averageContentUtilization: testResults.reduce((sum, r) => sum + r.contentWidthPercent, 0) / testResults.length
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desktop-layout-test-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [testResults]);

  return (
    <div className="min-h-screen bg-primary text-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-1 text-4xl font-bold text-gradient mb-4">
            Desktop Layout Verification Test
          </h1>
          <p className="body-text text-lg text-secondary mb-6">
            Comprehensive test to verify NUCLEAR fix has eliminated mobile-like appearance on desktop screens
          </p>
          
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card-luxury p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {testResults.filter(r => !r.mobileLikeAppearance).length}/{testResults.length}
              </div>
              <div className="text-sm text-secondary">Tests Passed</div>
            </div>
            <div className="card-luxury p-4 text-center">
              <div className="text-2xl font-bold text-error mb-2">
                {testResults.filter(r => r.mobileLikeAppearance).length}
              </div>
              <div className="text-sm text-secondary">Mobile-Like Issues</div>
            </div>
            <div className="card-luxury p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {testResults.length > 0 ? 
                  (testResults.reduce((sum, r) => sum + r.contentWidthPercent, 0) / testResults.length).toFixed(1) : 
                  '0'}%
              </div>
              <div className="text-sm text-secondary">Avg Width Utilization</div>
            </div>
            <div className="card-luxury p-4 text-center">
              <div className={`text-2xl font-bold mb-2 ${
                testResults.filter(r => r.mobileLikeAppearance).length === 0 ? 'text-success' : 'text-error'
              }`}>
                {testResults.filter(r => r.mobileLikeAppearance).length === 0 ? 'PASS' : 'FAIL'}
              </div>
              <div className="text-sm text-secondary">Overall Status</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card-luxury p-6 mb-8">
          <h2 className="heading-3 text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Viewport Selection */}
            <div>
              <h3 className="heading-4 text-lg font-medium mb-3">Viewport Selection</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VIEWPORTS.map((viewport) => {
                  const Icon = viewport.icon;
                  return (
                    <button
                      key={viewport.name}
                      onClick={() => setSelectedViewport(viewport)}
                      className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                        selectedViewport.name === viewport.name
                          ? 'border-yellow-600 bg-yellow-900/10 text-yellow-600'
                          : 'border-luxury hover:border-yellow-600/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{viewport.name}</span>
                      <span className="text-xs text-muted">{viewport.width}×{viewport.height}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test Actions */}
            <div>
              <h3 className="heading-4 text-lg font-medium mb-3">Test Actions</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={runAllTests}
                    disabled={isRunning}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run All Tests
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setAutoTest(!autoTest)}
                    className={`btn-secondary flex items-center gap-2 ${
                      autoTest ? 'bg-yellow-600 text-primary' : ''
                    }`}
                  >
                    {autoTest ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    Auto Test
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadResults}
                    disabled={testResults.length === 0}
                    className="btn-ghost flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Results
                  </button>
                  
                  <button
                    onClick={() => setTestResults([])}
                    disabled={testResults.length === 0}
                    className="btn-ghost flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear Results
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {isRunning && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Test Progress</span>
                    <span>{testProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-elevated rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${testProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="card-luxury p-6 mb-8">
          <h2 className="heading-3 text-xl font-semibold mb-4">Live Preview</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Iframe Preview */}
            <div>
              <h3 className="heading-4 text-lg font-medium mb-3">Dashboard Preview</h3>
              <div 
                ref={testContainerRef}
                className="border border-luxury rounded-lg overflow-hidden bg-secondary"
                style={{ 
                  width: 'fit-content',
                  maxWidth: '100%'
                }}
              >
                <iframe
                  ref={iframeRef}
                  src="/dashboard"
                  className="block"
                  style={{
                    width: `${selectedViewport.width}px`,
                    height: `${selectedViewport.height}px`,
                    border: 'none'
                  }}
                  onLoad={() => setIframeLoaded(true)}
                />
              </div>
            </div>

            {/* Current Metrics */}
            <div>
              <h3 className="heading-4 text-lg font-medium mb-3">Current Metrics</h3>
              {currentMetrics ? (
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-elevated rounded-lg">
                    <span className="text-sm text-secondary">Total Width:</span>
                    <span className="font-medium">{currentMetrics.totalWidth}px</span>
                  </div>
                  <div className="flex justify-between p-3 bg-elevated rounded-lg">
                    <span className="text-sm text-secondary">Content Width:</span>
                    <span className="font-medium">{currentMetrics.contentAreaWidth}px</span>
                  </div>
                  <div className="flex justify-between p-3 bg-elevated rounded-lg">
                    <span className="text-sm text-secondary">Width Utilization:</span>
                    <span className={`font-medium ${
                      currentMetrics.contentUtilization >= 75 ? 'text-success' : 'text-error'
                    }`}>
                      {currentMetrics.contentUtilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-elevated rounded-lg">
                    <span className="text-sm text-secondary">Sidebar Type:</span>
                    <span className={`font-medium capitalize ${
                      currentMetrics.sidebarType === 'desktop' ? 'text-success' :
                      currentMetrics.sidebarType === 'mobile' ? 'text-error' : 'text-muted'
                    }`}>
                      {currentMetrics.sidebarType}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-elevated rounded-lg">
                    <span className="text-sm text-secondary">Sidebar Width:</span>
                    <span className="font-medium">{currentMetrics.sidebarWidth}px</span>
                  </div>
                  <div className="flex justify-between p-3 bg-elevated rounded-lg">
                    <span className="text-sm text-secondary">Horizontal Overflow:</span>
                    <span className={`font-medium ${
                      currentMetrics.overflowX ? 'text-error' : 'text-success'
                    }`}>
                      {currentMetrics.overflowX ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted p-8">
                  <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Waiting for metrics...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="card-luxury p-6">
            <h2 className="heading-3 text-xl font-semibold mb-4">Test Results</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-luxury">
                    <th className="text-left p-3">Viewport</th>
                    <th className="text-left p-3">Size</th>
                    <th className="text-left p-3">Content Width</th>
                    <th className="text-left p-3">Utilization</th>
                    <th className="text-left p-3">Sidebar</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index} className="border-b border-luxury/50">
                      <td className="p-3 font-medium">{result.viewport.name}</td>
                      <td className="p-3">{result.viewport.width}×{result.viewport.height}</td>
                      <td className="p-3">{result.contentWidth}px</td>
                      <td className="p-3">
                        <span className={`font-medium ${
                          result.contentWidthPercent >= 75 ? 'text-success' : 'text-error'
                        }`}>
                          {result.contentWidthPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-medium capitalize ${
                          result.sidebarVisible ? 'text-yellow-600' : 'text-muted'
                        }`}>
                          {result.sidebarVisible ? `${result.sidebarWidth}px` : 'Hidden'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          result.mobileLikeAppearance 
                            ? 'bg-error-subtle text-error' 
                            : 'bg-success-subtle text-success'
                        }`}>
                          {result.mobileLikeAppearance ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              Mobile-Like
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Desktop
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}