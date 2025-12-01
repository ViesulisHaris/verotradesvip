'use client';

import { useState, useEffect, useCallback } from 'react';
import { Monitor, Ruler, Eye, EyeOff, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface LayoutMetrics {
  viewportWidth: number;
  viewportHeight: number;
  contentWidth: number;
  contentHeight: number;
  sidebarWidth: number;
  sidebarType: 'desktop' | 'mobile' | 'none';
  contentUtilization: number;
  hasHorizontalOverflow: boolean;
  bodyOverflowX: string;
  bodyMaxWidth: string;
  bodyWidth: string;
  isMobileLikeAppearance: boolean;
}

interface DiagnosticIssue {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  fix?: string;
}

export default function LayoutDiagnostic() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<LayoutMetrics | null>(null);
  const [issues, setIssues] = useState<DiagnosticIssue[]>([]);

  const measureLayout = useCallback(() => {
    if (typeof window === 'undefined') return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Find main content area
    const mainElement = document.querySelector('main') || document.body;
    const mainRect = mainElement.getBoundingClientRect();
    
    // Find sidebar elements
    const desktopSidebar = document.querySelector('aside[class*="lg:flex"]') || 
                         document.querySelector('[class*="hidden lg:flex"]');
    const mobileSidebar = document.querySelector('aside[class*="lg:hidden"]') || 
                         document.querySelector('[class*="hidden lg:block"]');

    // Calculate sidebar metrics
    let sidebarType: 'desktop' | 'mobile' | 'none' = 'none';
    let sidebarWidth = 0;
    
    if (desktopSidebar && window.getComputedStyle(desktopSidebar).display !== 'none') {
      sidebarType = 'desktop';
      sidebarWidth = (desktopSidebar as HTMLElement).offsetWidth;
    } else if (mobileSidebar && window.getComputedStyle(mobileSidebar).display !== 'none') {
      sidebarType = 'mobile';
      sidebarWidth = (mobileSidebar as HTMLElement).offsetWidth;
    }

    // Get body styles
    const bodyStyle = window.getComputedStyle(document.body);

    // Calculate content utilization
    const contentAreaWidth = mainRect.width;
    const contentUtilization = viewportWidth > 0 ? (contentAreaWidth / viewportWidth) * 100 : 0;

    // Check for horizontal overflow
    const hasHorizontalOverflow = document.documentElement.scrollWidth > viewportWidth;

    // Determine if mobile-like appearance exists
    const isDesktop = viewportWidth >= 1024;
    const isMobileLikeAppearance = isDesktop && (
      contentUtilization < 75 || // Content uses less than 75% of available width
      sidebarType === 'mobile' || // Mobile sidebar on desktop
      hasHorizontalOverflow || // Horizontal overflow detected
      bodyStyle.overflowX === 'hidden' // Body has overflow hidden (mobile pattern)
    );

    const newMetrics: LayoutMetrics = {
      viewportWidth,
      viewportHeight,
      contentWidth: Math.round(contentAreaWidth),
      contentHeight: Math.round(mainRect.height),
      sidebarWidth,
      sidebarType,
      contentUtilization: Math.round(contentUtilization * 10) / 10,
      hasHorizontalOverflow,
      bodyOverflowX: bodyStyle.overflowX,
      bodyMaxWidth: bodyStyle.maxWidth,
      bodyWidth: bodyStyle.width,
      isMobileLikeAppearance
    };

    setMetrics(newMetrics);

    // Generate diagnostic issues
    const newIssues: DiagnosticIssue[] = [];

    if (isDesktop) {
      if (contentUtilization < 75) {
        newIssues.push({
          type: 'error',
          title: 'Low Content Utilization',
          description: `Content area only uses ${contentUtilization.toFixed(1)}% of available viewport width.`,
          fix: 'Check container widths and margins. Desktop should utilize full viewport width.'
        });
      }

      if (sidebarType === 'mobile') {
        newIssues.push({
          type: 'error',
          title: 'Mobile Sidebar on Desktop',
          description: 'Mobile sidebar is visible on desktop viewport.',
          fix: 'Check responsive breakpoint logic. Desktop should use desktop sidebar.'
        });
      }

      if (hasHorizontalOverflow) {
        newIssues.push({
          type: 'error',
          title: 'Horizontal Overflow',
          description: 'Page content extends beyond viewport width causing horizontal scroll.',
          fix: 'Review container constraints and overflow settings.'
        });
      }

      if (bodyStyle.overflowX === 'hidden') {
        newIssues.push({
          type: 'warning',
          title: 'Body Overflow Hidden',
          description: 'Body has overflow-x: hidden which is a mobile pattern.',
          fix: 'Consider using overflow-x: auto for desktop layouts.'
        });
      }

      if (bodyStyle.maxWidth === 'none' && bodyStyle.width === '100%') {
        newIssues.push({
          type: 'info',
          title: 'Mobile Layout Patterns Detected',
          description: 'Body styles suggest mobile-first layout patterns.',
          fix: 'Ensure desktop-specific overrides are applied correctly.'
        });
      }

      if (sidebarWidth > 0 && sidebarWidth < 200) {
        newIssues.push({
          type: 'warning',
          title: 'Narrow Sidebar',
          description: `Desktop sidebar is only ${sidebarWidth}px wide.`,
          fix: 'Consider using standard desktop sidebar width (256px recommended).'
        });
      }
    } else {
      newIssues.push({
        type: 'info',
        title: 'Mobile Viewport',
        description: `Current viewport is ${viewportWidth}px wide (mobile).`,
        fix: 'Desktop layout tests should be performed on viewports ≥1024px.'
      });
    }

    setIssues(newIssues);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Initial measurement
    measureLayout();

    // Set up listeners for real-time updates
    const handleResize = () => {
      measureLayout();
    };

    const handleMutation = () => {
      setTimeout(measureLayout, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Observe DOM changes
    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      observer.disconnect();
    };
  }, [isVisible, measureLayout]);

  const getIssueIcon = (type: DiagnosticIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-error" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'info':
        return <Info className="w-4 h-4 text-info" />;
    }
  };

  const getIssueColor = (type: DiagnosticIssue['type']) => {
    switch (type) {
      case 'error':
        return 'border-error bg-error-subtle';
      case 'warning':
        return 'border-warning bg-warning-subtle';
      case 'info':
        return 'border-info bg-info-subtle';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all ${
          isVisible 
            ? 'bg-error text-primary'
            : 'bg-yellow-600 text-primary hover:bg-yellow-500'
        }`}
        title={isVisible ? 'Hide Layout Diagnostic' : 'Show Layout Diagnostic'}
      >
        {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {/* Diagnostic Panel */}
      {isVisible && (
        <div className="fixed top-0 right-0 h-full w-96 bg-secondary border-l border-luxury shadow-2xl z-40 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-3 text-lg font-semibold flex items-center gap-2">
                <Monitor className="w-5 h-5 text-yellow-600" />
                Layout Diagnostic
              </h2>
              <button
                onClick={() => setIsVisible(false)}
                className="p-2 rounded-lg hover:bg-elevated transition-all"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

            {/* Status Overview */}
            {metrics && (
              <div className={`mb-6 p-4 rounded-lg border ${
                metrics.isMobileLikeAppearance 
                  ? 'border-error bg-error-subtle' 
                  : 'border-success bg-success-subtle'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  {metrics.isMobileLikeAppearance ? (
                    <AlertTriangle className="w-5 h-5 text-error" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  <h3 className="font-semibold">
                    {metrics.isMobileLikeAppearance ? 'Mobile-Like Detected' : 'Desktop Layout OK'}
                  </h3>
                </div>
                <p className="text-sm text-secondary">
                  {metrics.isMobileLikeAppearance 
                    ? 'Desktop viewport shows mobile-like appearance patterns'
                    : 'Desktop layout is properly configured'}
                </p>
              </div>
            )}

            {/* Metrics */}
            {metrics && (
              <div className="mb-6">
                <h3 className="heading-4 text-base font-medium mb-3 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-yellow-600" />
                  Layout Metrics
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Viewport:</span>
                    <span className="font-medium">{metrics.viewportWidth}×{metrics.viewportHeight}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Content Area:</span>
                    <span className="font-medium">{metrics.contentWidth}px</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Utilization:</span>
                    <span className={`font-medium ${
                      metrics.contentUtilization >= 75 ? 'text-success' : 'text-error'
                    }`}>
                      {metrics.contentUtilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Sidebar:</span>
                    <span className={`font-medium capitalize ${
                      metrics.sidebarType === 'desktop' ? 'text-success' :
                      metrics.sidebarType === 'mobile' ? 'text-error' : 'text-muted'
                    }`}>
                      {metrics.sidebarType} ({metrics.sidebarWidth}px)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Horizontal Overflow:</span>
                    <span className={`font-medium ${
                      metrics.hasHorizontalOverflow ? 'text-error' : 'text-success'
                    }`}>
                      {metrics.hasHorizontalOverflow ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Body Overflow-X:</span>
                    <span className="font-medium">{metrics.bodyOverflowX}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Body Max-Width:</span>
                    <span className="font-medium">{metrics.bodyMaxWidth}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Body Width:</span>
                    <span className="font-medium">{metrics.bodyWidth}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Issues */}
            {issues.length > 0 && (
              <div>
                <h3 className="heading-4 text-base font-medium mb-3">Issues Detected</h3>
                <div className="space-y-3">
                  {issues.map((issue, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${getIssueColor(issue.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{issue.title}</h4>
                          <p className="text-xs text-secondary mb-2">{issue.description}</p>
                          {issue.fix && (
                            <p className="text-xs font-medium text-yellow-600">💡 {issue.fix}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={measureLayout}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Ruler className="w-4 h-4" />
                Refresh Measurements
              </button>
              
              <button
                onClick={() => {
                  const data = {
                    timestamp: new Date().toISOString(),
                    metrics,
                    issues,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                  };
                  
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `layout-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                Download Diagnostic Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}