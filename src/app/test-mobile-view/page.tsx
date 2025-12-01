'use client';

import { useEffect, useState } from 'react';
import { useZoomDetection } from '@/lib/zoom-detection';
import ZoomAwareLayout from '@/components/ZoomAwareLayout';

export default function MobileViewTestPage() {
  const zoomInfo = useZoomDetection();
  const [showZoomFix, setShowZoomFix] = useState(false);

  useEffect(() => {
    // Load the enhanced diagnostic script
    const script = document.createElement('script');
    script.src = '/mobile-view-diagnostic-enhanced.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Check if zoom is causing mobile view on desktop
  useEffect(() => {
    const shouldShowFix = zoomInfo.effectiveWidth >= 1024 && !zoomInfo.isDesktop;
    setShowZoomFix(shouldShowFix);
  }, [zoomInfo.effectiveWidth, zoomInfo.isDesktop]);

  return (
    <ZoomAwareLayout>
      <div className="min-h-screen bg-primary">
        <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gold mb-6">Mobile View Diagnostic Tool</h1>
        
        <div className="card-luxury mb-6">
          <h2 className="text-xl font-semibold text-gold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-secondary">
            <li>Open browser developer tools (F12 or Ctrl+Shift+I)</li>
            <li>Go to Console tab to see diagnostic output</li>
            <li>Check if your browser window is at least 1024px wide</li>
            <li>The diagnostic will run automatically and show results</li>
            <li>You can also run <code className="bg-elevated px-2 py-1 rounded">window.mobileViewDiagnostic()</code> in console anytime</li>
          </ol>
        </div>

        <div className="card-luxury mb-6">
          <h2 className="text-xl font-semibold text-gold mb-4">Current Viewport Info</h2>
          
          {/* Zoom Issue Alert */}
          {showZoomFix && (
            <div className="bg-warning/20 border border-warning/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v.01M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-warning mb-1">Zoom Level Detected</h3>
                  <p className="text-secondary text-sm">
                    Browser zoom is {zoomInfo.percentage}% (effective width: {Math.round(zoomInfo.effectiveWidth)}px).
                    This is causing mobile layout on desktop. The fix has been applied.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-elevated p-4 rounded-lg">
              <h3 className="font-semibold text-primary mb-2">Window Size</h3>
              <p className="text-secondary">Actual Width: <span className="text-gold">{zoomInfo.actualWidth}px</span></p>
              <p className="text-secondary">Actual Height: <span className="text-gold">{zoomInfo.actualHeight}px</span></p>
              <p className="text-secondary">Zoom Level: <span className="text-warning">{zoomInfo.percentage}%</span></p>
              <p className="text-secondary">Effective Width: <span className="text-gold">{Math.round(zoomInfo.effectiveWidth)}px</span></p>
              <p className="text-secondary">Effective Height: <span className="text-gold">{Math.round(zoomInfo.effectiveHeight)}px</span></p>
            </div>
            <div className="bg-elevated p-4 rounded-lg">
              <h3 className="font-semibold text-primary mb-2">Breakpoint Status</h3>
              <p className="text-secondary">SM (640px+): <span className={zoomInfo.effectiveWidth >= 640 ? "text-gold" : "text-muted"}>✅ ACTIVE</span></p>
              <p className="text-secondary">MD (768px+): <span className={zoomInfo.effectiveWidth >= 768 ? "text-gold" : "text-muted"}>✅ ACTIVE</span></p>
              <p className="text-secondary">LG (1024px+): <span className={zoomInfo.effectiveWidth >= 1024 ? "text-gold" : "text-muted"}>✅ ACTIVE</span></p>
              <p className="text-secondary mt-2">Current View: <span className="text-gold font-semibold">{zoomInfo.breakpoint.toUpperCase()}</span></p>
              <p className="text-secondary">Layout Type: <span className="text-gold font-semibold">{zoomInfo.isDesktop ? 'Desktop' : zoomInfo.isTablet ? 'Tablet' : 'Mobile'}</span></p>
            </div>
          </div>
        </div>

        <div className="card-luxury mb-6">
          <h2 className="text-xl font-semibold text-gold mb-4">Layout Test (Zoom-Aware)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-elevated p-4 rounded-lg text-center">
              <h3 className="font-semibold text-primary mb-2">Mobile Layout</h3>
              <p className="text-sm text-secondary">Visible on: {"<"} 768px (effective)</p>
              <div className={zoomInfo.isMobile ? "bg-gold text-primary px-3 py-1 rounded mt-2 inline-block" : "bg-error text-primary px-3 py-1 rounded mt-2 inline-block"}>
                {zoomInfo.isMobile ? "VISIBLE" : "HIDDEN"}
              </div>
              {zoomInfo.effectiveWidth < 768 && zoomInfo.actualWidth >= 768 && (
                <p className="text-xs text-warning mt-2">Zoom affecting display</p>
              )}
            </div>
            <div className="bg-elevated p-4 rounded-lg text-center">
              <h3 className="font-semibold text-primary mb-2">Tablet Layout</h3>
              <p className="text-sm text-secondary">Visible on: 768px - 1023px (effective)</p>
              <div className={zoomInfo.isTablet ? "bg-gold text-primary px-3 py-1 rounded mt-2 inline-block" : "bg-error text-primary px-3 py-1 rounded mt-2 inline-block"}>
                {zoomInfo.isTablet ? "VISIBLE" : "HIDDEN"}
              </div>
              {(zoomInfo.effectiveWidth >= 768 && zoomInfo.effectiveWidth < 1024) && (
                <p className="text-xs text-warning mt-2">Zoom affecting display</p>
              )}
            </div>
            <div className="bg-elevated p-4 rounded-lg text-center">
              <h3 className="font-semibold text-primary mb-2">Desktop Layout</h3>
              <p className="text-sm text-secondary">Visible on: ≥ 1024px (effective)</p>
              <div className={zoomInfo.isDesktop ? "bg-gold text-primary px-3 py-1 rounded mt-2 inline-block" : "bg-error text-primary px-3 py-1 rounded mt-2 inline-block"}>
                {zoomInfo.isDesktop ? "VISIBLE" : "HIDDEN"}
              </div>
              {zoomInfo.effectiveWidth >= 1024 && !zoomInfo.isDesktop && (
                <p className="text-xs text-warning mt-2">Zoom fix applied</p>
              )}
            </div>
          </div>
        </div>

        <div className="card-luxury">
          <h2 className="text-xl font-semibold text-gold mb-4">Expected Behavior</h2>
          <div className="space-y-2 text-secondary">
            <p>✅ On desktop (≥1024px): You should see "Desktop Layout: VISIBLE" and others hidden</p>
            <p>✅ On tablet (768px-1023px): You should see "Tablet Layout: VISIBLE" and others hidden</p>
            <p>✅ On mobile ({"<"}768px): You should see "Mobile Layout: VISIBLE" and others hidden</p>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Update viewport info in real-time
          function updateViewportInfo() {
            // Get zoom info from our detector
            const zoomInfo = window.__zoomInfo || {
              level: 1,
              percentage: 100,
              actualWidth: window.innerWidth,
              effectiveWidth: window.innerWidth,
              actualHeight: window.innerHeight,
              effectiveHeight: window.innerHeight
            };
            
            // Update display elements
            if (document.getElementById('actual-width')) {
              document.getElementById('actual-width').textContent = zoomInfo.actualWidth;
            }
            if (document.getElementById('actual-height')) {
              document.getElementById('actual-height').textContent = zoomInfo.actualHeight;
            }
            if (document.getElementById('effective-width')) {
              document.getElementById('effective-width').textContent = Math.round(zoomInfo.effectiveWidth);
            }
            if (document.getElementById('effective-height')) {
              document.getElementById('effective-height').textContent = Math.round(zoomInfo.effectiveHeight);
            }
          }

          updateViewportInfo();
          window.addEventListener('resize', updateViewportInfo);
        `
      }} />
    </div>
    </ZoomAwareLayout>
  );
}