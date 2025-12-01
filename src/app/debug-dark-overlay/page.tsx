'use client';

import React, { useEffect, useState } from 'react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import AuthGuard from '@/components/AuthGuard';

interface OverlayElement {
  element: HTMLElement;
  tagName: string;
  className: string;
  id: string;
  zIndex: string;
  position: string;
  backgroundColor: string;
  backdropFilter: string;
  opacity: string;
  display: string;
  visibility: string;
  pointerEvents: string;
  computedStyle: CSSStyleDeclaration;
  rect: DOMRect;
  isOverlay: boolean;
  overlayReason: string;
}

interface DiagnosticResult {
  timestamp: string;
  url: string;
  userAgent: string;
  viewportSize: { width: number; height: number };
  overlayElements: OverlayElement[];
  modalElements: OverlayElement[];
  fixedElements: OverlayElement[];
  highZIndexElements: OverlayElement[];
  backdropFilterElements: OverlayElement[];
  suspiciousElements: OverlayElement[];
}

function DarkOverlayDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const scanForOverlays = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const results: DiagnosticResult = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        overlayElements: [],
        modalElements: [],
        fixedElements: [],
        highZIndexElements: [],
        backdropFilterElements: [],
        suspiciousElements: []
      };

      // Get all elements in the DOM
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlElement);
        const rect = htmlElement.getBoundingClientRect();
        
        // Skip elements that are not visible or too small
        if (computedStyle.display === 'none' || 
            computedStyle.visibility === 'hidden' ||
            rect.width === 0 || 
            rect.height === 0) {
          return;
        }

        const overlayElement: OverlayElement = {
          element: htmlElement,
          tagName: htmlElement.tagName,
          className: htmlElement.className,
          id: htmlElement.id,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position,
          backgroundColor: computedStyle.backgroundColor,
          backdropFilter: computedStyle.backdropFilter,
          opacity: computedStyle.opacity,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          pointerEvents: computedStyle.pointerEvents,
          computedStyle,
          rect,
          isOverlay: false,
          overlayReason: ''
        };

        // Check for various overlay conditions
        const isFixed = computedStyle.position === 'fixed';
        const isAbsolute = computedStyle.position === 'absolute';
        const hasHighZIndex = parseInt(computedStyle.zIndex) > 100;
        const hasBackdropFilter = computedStyle.backdropFilter && computedStyle.backdropFilter !== 'none';
        const hasDarkBackground = computedStyle.backgroundColor.includes('rgba(0, 0, 0') || 
                                  computedStyle.backgroundColor === 'black' ||
                                  computedStyle.backgroundColor === '#000000';
        const hasSemiTransparent = computedStyle.opacity && parseFloat(computedStyle.opacity) < 1;
        const isFullScreen = rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9;
        const hasModalClass = htmlElement.className.toLowerCase().includes('modal') ||
                            htmlElement.className.toLowerCase().includes('overlay') ||
                            htmlElement.className.toLowerCase().includes('backdrop');
        const hasModalId = htmlElement.id.toLowerCase().includes('modal') ||
                         htmlElement.id.toLowerCase().includes('overlay') ||
                         htmlElement.id.toLowerCase().includes('backdrop');

        // Determine if this is an overlay element
        let isOverlay = false;
        let overlayReason = '';

        if (isFullScreen && (hasDarkBackground || hasBackdropFilter)) {
          isOverlay = true;
          overlayReason = 'Full screen element with dark background or backdrop filter';
        } else if (hasModalClass || hasModalId) {
          isOverlay = true;
          overlayReason = 'Element has modal/overlay/backdrop class or ID';
        } else if (isFixed && hasHighZIndex && hasDarkBackground) {
          isOverlay = true;
          overlayReason = 'Fixed positioned element with high z-index and dark background';
        } else if (hasBackdropFilter && isFixed) {
          isOverlay = true;
          overlayReason = 'Fixed positioned element with backdrop filter';
        }

        overlayElement.isOverlay = isOverlay;
        overlayElement.overlayReason = overlayReason;

        // Categorize elements
        if (isOverlay) {
          results.overlayElements.push(overlayElement);
        }
        
        if (isFixed) {
          results.fixedElements.push(overlayElement);
        }
        
        if (hasHighZIndex) {
          results.highZIndexElements.push(overlayElement);
        }
        
        if (hasBackdropFilter) {
          results.backdropFilterElements.push(overlayElement);
        }

        // Check for suspicious elements that might cause overlay issues
        if ((isFixed || isAbsolute) && 
            (hasDarkBackground || hasBackdropFilter) && 
            !htmlElement.textContent?.includes('VeroTrade') &&
            !htmlElement.querySelector('nav') &&
            !htmlElement.querySelector('header')) {
          results.suspiciousElements.push(overlayElement);
        }
      });

      // Sort elements by z-index (highest first)
      const sortByZIndex = (a: OverlayElement, b: OverlayElement) => {
        const aZ = parseInt(a.zIndex) || 0;
        const bZ = parseInt(b.zIndex) || 0;
        return bZ - aZ;
      };

      results.overlayElements.sort(sortByZIndex);
      results.highZIndexElements.sort(sortByZIndex);
      results.fixedElements.sort(sortByZIndex);
      results.backdropFilterElements.sort(sortByZIndex);
      results.suspiciousElements.sort(sortByZIndex);

      setDiagnosticResults(results);
      setIsScanning(false);
    }, 100);
  };

  const highlightElement = (element: HTMLElement) => {
    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.style.outline = '';
      highlightedElement.style.backgroundColor = '';
    }

    // Add new highlight
    element.style.outline = '3px solid red';
    element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    setHighlightedElement(element);

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.style.outline = '';
      element.style.backgroundColor = '';
      if (highlightedElement === element) {
        setHighlightedElement(null);
      }
    }, 3000);
  };

  const removeHighlight = () => {
    if (highlightedElement) {
      highlightedElement.style.outline = '';
      highlightedElement.style.backgroundColor = '';
      setHighlightedElement(null);
    }
  };

  const formatElementInfo = (element: OverlayElement) => (
    <div key={`${element.tagName}-${element.className}-${element.id}`} className="mb-2 p-2 border border-gray-300 rounded">
      <div className="font-mono text-sm">
        <strong>{element.tagName}</strong>
        {element.id && <span className="text-blue-600">#{element.id}</span>}
        {element.className && <span className="text-green-600">.{element.className.split(' ').join('.')}</span>}
      </div>
      <div className="text-xs text-gray-600 mt-1">
        <div>z-index: {element.zIndex}</div>
        <div>position: {element.position}</div>
        <div>background: {element.backgroundColor}</div>
        <div>backdrop-filter: {element.backdropFilter}</div>
        <div>opacity: {element.opacity}</div>
        <div>size: {Math.round(element.rect.width)}x{Math.round(element.rect.height)}</div>
        {element.overlayReason && <div className="text-red-600 font-semibold">Reason: {element.overlayReason}</div>}
      </div>
      <button
        onClick={() => highlightElement(element.element)}
        className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
      >
        Highlight Element
      </button>
    </div>
  );

  return (
    <UnifiedLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dark Overlay Diagnostic Tool</h1>
        
        <div className="mb-6">
          <button
            onClick={scanForOverlays}
            disabled={isScanning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isScanning ? 'Scanning...' : 'Scan for Overlay Elements'}
          </button>
          
          {highlightedElement && (
            <button
              onClick={removeHighlight}
              className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove Highlight
            </button>
          )}
        </div>

        {diagnosticResults && (
          <div className="space-y-6">
            <div className="bg-gray-100 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">Diagnostic Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                <div>
                  <strong>Overlay Elements:</strong> {diagnosticResults.overlayElements.length}
                </div>
                <div>
                  <strong>Fixed Elements:</strong> {diagnosticResults.fixedElements.length}
                </div>
                <div>
                  <strong>High z-index:</strong> {diagnosticResults.highZIndexElements.length}
                </div>
                <div>
                  <strong>Backdrop Filter:</strong> {diagnosticResults.backdropFilterElements.length}
                </div>
                <div>
                  <strong>Suspicious:</strong> {diagnosticResults.suspiciousElements.length}
                </div>
                <div>
                  <strong>Viewport:</strong> {diagnosticResults.viewportSize.width}x{diagnosticResults.viewportSize.height}
                </div>
              </div>
            </div>

            {diagnosticResults.overlayElements.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <h2 className="text-xl font-semibold mb-4 text-red-800">🚨 Overlay Elements Found</h2>
                <div className="space-y-2">
                  {diagnosticResults.overlayElements.map(formatElementInfo)}
                </div>
              </div>
            )}

            {diagnosticResults.suspiciousElements.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                <h2 className="text-xl font-semibold mb-4 text-yellow-800">⚠️ Suspicious Elements</h2>
                <div className="space-y-2">
                  {diagnosticResults.suspiciousElements.map(formatElementInfo)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {diagnosticResults.backdropFilterElements.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                  <h2 className="text-xl font-semibold mb-4 text-blue-800">Backdrop Filter Elements</h2>
                  <div className="space-y-2">
                    {diagnosticResults.backdropFilterElements.map(formatElementInfo)}
                  </div>
                </div>
              )}

              {diagnosticResults.highZIndexElements.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded">
                  <h2 className="text-xl font-semibold mb-4 text-purple-800">High z-index Elements</h2>
                  <div className="space-y-2">
                    {diagnosticResults.highZIndexElements.slice(0, 10).map(formatElementInfo)}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h2 className="text-xl font-semibold mb-4">Technical Details</h2>
              <div className="text-sm font-mono">
                <div><strong>Timestamp:</strong> {diagnosticResults.timestamp}</div>
                <div><strong>URL:</strong> {diagnosticResults.url}</div>
                <div><strong>User Agent:</strong> {diagnosticResults.userAgent}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedLayout>
  );
}

// Wrapper component with authentication guard
function DarkOverlayDiagnosticWithAuth() {
  return (
    <AuthGuard requireAuth={true}>
      <DarkOverlayDiagnostic />
    </AuthGuard>
  );
}

export default DarkOverlayDiagnosticWithAuth;