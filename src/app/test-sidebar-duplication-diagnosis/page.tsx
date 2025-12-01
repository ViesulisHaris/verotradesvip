'use client';

import React, { useEffect, useState } from 'react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import UnifiedSidebar from '@/components/navigation/UnifiedSidebar';

export default function SidebarDuplicationDiagnosis() {
  const [sidebarCount, setSidebarCount] = useState(0);
  const [cssClasses, setCssClasses] = useState<string[]>([]);

  useEffect(() => {
    // Count sidebar elements in DOM
    const sidebars = document.querySelectorAll('aside');
    setSidebarCount(sidebars.length);
    
    // Get CSS classes from first sidebar
    if (sidebars.length > 0) {
      const firstSidebar = sidebars[0] as HTMLElement;
      setCssClasses(firstSidebar.className.split(' '));
    }

    console.log('🔍 SIDEBAR DUPLICATION DIAGNOSIS:');
    console.log('📊 Total sidebar elements found:', sidebars.length);
    console.log('🎨 CSS classes on first sidebar:', sidebars[0]?.className);
    
    sidebars.forEach((sidebar, index) => {
      const element = sidebar as HTMLElement;
      console.log(`📍 Sidebar ${index + 1}:`, {
        transform: window.getComputedStyle(element).transform,
        translateX: window.getComputedStyle(element).translate,
        left: window.getComputedStyle(element).left,
        position: window.getComputedStyle(element).position,
        zIndex: window.getComputedStyle(element).zIndex,
        display: window.getComputedStyle(element).display,
        visibility: window.getComputedStyle(element).visibility,
        width: window.getComputedStyle(element).width,
        classes: element.className
      });
    });

    // Check for nested layouts
    const layouts = document.querySelectorAll('[class*="layout"], [class*="Layout"]');
    console.log('🏗️ Layout elements found:', layouts.length);
    layouts.forEach((layout, index) => {
      console.log(`🏗️ Layout ${index + 1}:`, layout.className);
    });

    // Check for conflicting CSS classes
    const conflictingElements = document.querySelectorAll('.translate-x-0.translate-x-\\[-100%\\]');
    console.log('⚠️ Elements with conflicting translate classes:', conflictingElements.length);
    conflictingElements.forEach((el, index) => {
      console.log(`⚠️ Conflicting element ${index + 1}:`, el.className);
    });

  }, []);

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Sidebar Duplication Diagnosis</h1>
      
      <div className="space-y-4">
        <div className="bg-red-900/20 border border-red-500 p-4 rounded">
          <h2 className="text-lg font-semibold text-red-400 mb-2">🚨 CRITICAL FINDINGS:</h2>
          <div className="space-y-2 text-sm">
            <p>📊 Sidebar elements in DOM: <span className="text-red-400 font-bold">{sidebarCount}</span></p>
            <p className="text-red-400">{sidebarCount > 1 ? '❌ MULTIPLE SIDEBARS DETECTED!' : '✅ Single sidebar found'}</p>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500 p-4 rounded">
          <h2 className="text-lg font-semibold text-yellow-400 mb-2">🎨 CSS CLASSES ANALYSIS:</h2>
          <div className="space-y-1 text-sm">
            {cssClasses.map((cls, index) => (
              <div key={index} className={`font-mono text-xs ${cls.includes('translate-x') ? 'text-yellow-400' : 'text-gray-400'}`}>
                {cls}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500 p-4 rounded">
          <h2 className="text-lg font-semibold text-blue-400 mb-2">🔍 INSTRUCTIONS:</h2>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li>Open browser DevTools and inspect the sidebar elements</li>
            <li>Look for multiple <code className="bg-gray-800 px-1 rounded"><aside></aside></code> elements</li>
            <li>Check for conflicting CSS classes like <code className="bg-gray-800 px-1 rounded">translate-x-0 translate-x-[-100%]</code></li>
            <li>Navigate between /trades and /strategies pages to see duplication</li>
            <li>Try collapsing/expanding the sidebar to observe behavior</li>
          </ol>
        </div>

        <div className="bg-green-900/20 border border-green-500 p-4 rounded">
          <h2 className="text-lg font-semibold text-green-400 mb-2">✅ EXPECTED BEHAVIOR:</h2>
          <ul className="space-y-1 text-sm list-disc list-inside">
            <li>Only ONE sidebar element should exist in the DOM</li>
            <li>No conflicting CSS transform classes</li>
            <li>Smooth collapse/expand without visual duplication</li>
          </ul>
        </div>
      </div>
    </div>
  );
}