'use client';

import React, { useState, useEffect } from 'react';
import ZoomAwareLayout from '@/components/ZoomAwareLayout';
import { useZoomDetection } from '@/lib/zoom-detection';

export default function TestZoomDetectionPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [manualZoom, setManualZoom] = useState(1);
  
  const zoomInfo = useZoomDetection();

  useEffect(() => {
    const results = [
      `✅ Zoom detection hook loaded: ${!!zoomInfo}`,
      `📊 Current zoom level: ${zoomInfo.level}`,
      `📊 Zoom percentage: ${zoomInfo.percentage}%`,
      `📏 Actual width: ${zoomInfo.actualWidth}px`,
      `📏 Effective width: ${zoomInfo.effectiveWidth}px`,
      `📏 Actual height: ${zoomInfo.actualHeight}px`,
      `📏 Effective height: ${zoomInfo.effectiveHeight}px`,
      `🖥️ Is desktop: ${zoomInfo.isDesktop}`,
      `📱 Is tablet: ${zoomInfo.isTablet}`,
      `📱 Is mobile: ${zoomInfo.isMobile}`,
      `🎯 Breakpoint: ${zoomInfo.breakpoint}`,
      `🔧 Device pixel ratio: ${zoomInfo.devicePixelRatio}`,
      `⏰ Last updated: ${new Date().toLocaleTimeString()}`
    ];
    setTestResults(results);
  }, [zoomInfo]);

  const handleManualZoom = (zoomLevel: number) => {
    setManualZoom(zoomLevel);
    document.body.style.zoom = zoomLevel.toString();
    window.dispatchEvent(new Event('resize'));
  };

  const resetZoom = () => {
    setManualZoom(1);
    document.body.style.zoom = '1';
    window.dispatchEvent(new Event('resize'));
  };

  const forceRecalculate = () => {
    if (zoomInfo.recalculate) {
      zoomInfo.recalculate();
    }
  };

  return (
    <ZoomAwareLayout>
      <div className="min-h-screen p-8 bg-primary text-primary">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-yellow-600 mb-4">Zoom Detection Test</h1>
            <p className="text-lg text-secondary">Verify zoom detection functionality</p>
          </div>

          {/* Zoom Controls */}
          <div className="card-luxury p-6">
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Manual Zoom Controls</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <button
                onClick={() => handleManualZoom(0.5)}
                className="btn-secondary"
              >
                50%
              </button>
              <button
                onClick={() => handleManualZoom(0.75)}
                className="btn-secondary"
              >
                75%
              </button>
              <button
                onClick={() => handleManualZoom(1.0)}
                className="btn-secondary"
              >
                100%
              </button>
              <button
                onClick={() => handleManualZoom(1.25)}
                className="btn-secondary"
              >
                125%
              </button>
              <button
                onClick={() => handleManualZoom(1.5)}
                className="btn-secondary"
              >
                150%
              </button>
              <button
                onClick={() => handleManualZoom(2.0)}
                className="btn-secondary"
              >
                200%
              </button>
              <button
                onClick={resetZoom}
                className="btn-primary"
              >
                Reset
              </button>
              <button
                onClick={forceRecalculate}
                className="btn-info"
              >
                Recalculate
              </button>
            </div>
            <p className="text-sm text-secondary">
              Current manual zoom: {manualZoom * 100}%
            </p>
          </div>

          {/* Zoom Information */}
          <div className="card-luxury p-6">
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Zoom Detection Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testResults.map((result, index) => (
                <div key={index} className="p-3 bg-elevated rounded-lg">
                  <code className="text-sm">{result}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Breakpoint Information */}
          <div className="card-luxury p-6">
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Breakpoint Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zoomInfo.breakpoints?.map((bp, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    bp.isActive
                      ? 'border-yellow-600 bg-yellow-900/10'
                      : 'border-subtle bg-secondary'
                  }`}
                >
                  <h3 className="font-bold text-lg mb-2">{bp.name}</h3>
                  <p className="text-sm">Min width: {bp.min}px</p>
                  <p className="text-sm">Zoom adjusted: {Math.round(bp.zoomAdjusted)}px</p>
                  <p className="text-sm font-medium">
                    Status: {bp.isActive ? '✅ Active' : '❌ Inactive'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Indicators */}
          <div className="card-luxury p-6">
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Visual Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg text-center ${
                zoomInfo.isDesktop ? 'bg-success-subtle text-success' : 'bg-secondary text-secondary'
              }`}>
                <h3 className="font-bold">Desktop View</h3>
                <p className="text-2xl">{zoomInfo.isDesktop ? '✅' : '❌'}</p>
              </div>
              <div className={`p-4 rounded-lg text-center ${
                zoomInfo.isTablet ? 'bg-warning-subtle text-warning' : 'bg-secondary text-secondary'
              }`}>
                <h3 className="font-bold">Tablet View</h3>
                <p className="text-2xl">{zoomInfo.isTablet ? '✅' : '❌'}</p>
              </div>
              <div className={`p-4 rounded-lg text-center ${
                zoomInfo.isMobile ? 'bg-info-subtle text-info' : 'bg-secondary text-secondary'
              }`}>
                <h3 className="font-bold">Mobile View</h3>
                <p className="text-2xl">{zoomInfo.isMobile ? '✅' : '❌'}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card-luxury p-6">
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Test Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-secondary">
              <li>Use the manual zoom controls to test different zoom levels</li>
              <li>Use browser zoom (Ctrl +/-) to test native zoom detection</li>
              <li>Resize the browser window to test responsive behavior</li>
              <li>Check the debug panel in the bottom-left corner for real-time info</li>
              <li>Look for the zoom indicator in the top-right corner when zoom ≠ 100%</li>
              <li>Verify that layout adapts correctly to zoom changes</li>
            </ol>
          </div>
        </div>
      </div>
    </ZoomAwareLayout>
  );
}