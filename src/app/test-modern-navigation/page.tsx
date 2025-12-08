'use client';

import { useState, useEffect } from 'react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import AuthGuard from '@/components/AuthGuard';

export default function TestModernNavigation() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results = [];

    // Test 1: Navigation component renders
    results.push({
      name: 'Navigation Component Renders',
      status: 'running',
      details: 'Checking if ModernNavigation component is present...'
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const navExists = document.querySelector('aside[role="navigation"]');
    results.push({
      name: 'Navigation Component Renders',
      status: navExists ? 'pass' : 'fail',
      details: navExists ? 'ModernNavigation component found in DOM' : 'ModernNavigation component not found'
    });

    // Test 2: Mobile menu button
    const mobileMenuButton = document.querySelector('button[aria-label*="Open navigation menu"]');
    results.push({
      name: 'Mobile Menu Button',
      status: mobileMenuButton ? 'pass' : 'fail',
      details: mobileMenuButton ? 'Mobile menu button found' : 'Mobile menu button not found'
    });

    // Test 3: Desktop sidebar toggle
    const desktopToggle = document.querySelector('button[aria-label*="sidebar"]');
    results.push({
      name: 'Desktop Sidebar Toggle',
      status: desktopToggle ? 'pass' : 'fail',
      details: desktopToggle ? 'Desktop sidebar toggle found' : 'Desktop sidebar toggle not found'
    });

    // Test 4: Navigation links
    const navLinks = document.querySelectorAll('a[role="navigation"]');
    results.push({
      name: 'Navigation Links',
      status: navLinks.length > 0 ? 'pass' : 'fail',
      details: `Found ${navLinks.length} navigation links`
    });

    // Test 5: Active state indicators
    const activeLinks = document.querySelectorAll('.nav-item-luxury.active');
    results.push({
      name: 'Active State Indicators',
      status: activeLinks.length > 0 ? 'pass' : 'fail',
      details: `Found ${activeLinks.length} active navigation items`
    });

    // Test 6: Responsive behavior
    const testResponsive = async () => {
      const originalWidth = window.innerWidth;
      
      // Test mobile view
      if (originalWidth < 1024) {
        results.push({
          name: 'Mobile View',
          status: 'running',
          details: 'Testing mobile navigation...'
        });
        
        // Check mobile menu is visible
        const mobileMenu = document.querySelector('aside:not(.lg\\:flex)');
        const isVisible = mobileMenu && window.getComputedStyle(mobileMenu).transform !== 'translateX(-100%)';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        results.push({
          name: 'Mobile Menu Visibility',
          status: isVisible ? 'pass' : 'fail',
          details: isVisible ? 'Mobile menu is visible when opened' : 'Mobile menu visibility issue'
        });
      }
      
      // Test desktop view
      if (originalWidth >= 1024) {
        results.push({
          name: 'Desktop View',
          status: 'running',
          details: 'Testing desktop navigation...'
        });
        
        // Check desktop sidebar is visible
        const desktopSidebar = document.querySelector('aside.lg\\:flex');
        const isDesktopVisible = desktopSidebar && window.getComputedStyle(desktopSidebar).display !== 'none';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        results.push({
          name: 'Desktop Sidebar Visibility',
          status: isDesktopVisible ? 'pass' : 'fail',
          details: isDesktopVisible ? 'Desktop sidebar is visible' : 'Desktop sidebar visibility issue'
        });
      }
    };

    await testResponsive();

    // Test 7: Keyboard navigation
    results.push({
      name: 'Keyboard Navigation',
      status: 'running',
      details: 'Testing Tab key navigation...'
    });

    // Simulate Tab key presses
    const tabKeys = ['Tab'];
    let currentLinkIndex = 0;
    const links = Array.from(document.querySelectorAll('a[role="navigation"]'));
    
    for (let i = 0; i < 3; i++) {
      const event = new KeyboardEvent('keydown');
      (event as any).key = 'Tab';
      event.preventDefault();
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const focusedElement = document.activeElement;
      const expectedLink = links[currentLinkIndex % links.length];
      currentLinkIndex++;
      
      results.push({
        name: `Tab Navigation ${i + 1}`,
        status: focusedElement === expectedLink ? 'pass' : 'fail',
        details: focusedElement === expectedLink ?
          `Correctly focused on: ${expectedLink?.textContent || 'unknown'}` :
          `Expected: ${expectedLink?.textContent || 'unknown'}, Got: ${focusedElement?.textContent || 'unknown'}`
      });
    }

    // Test 8: Accessibility attributes
    results.push({
      name: 'Accessibility Attributes',
      status: 'running',
      details: 'Checking ARIA labels and roles...'
    });

    const hasAriaLabels = document.querySelectorAll('[aria-label]');
    const hasRoles = document.querySelectorAll('[role]');
    
    results.push({
      name: 'ARIA Labels',
      status: hasAriaLabels.length > 0 ? 'pass' : 'fail',
      details: `Found ${hasAriaLabels.length} elements with aria-label`
    });
    
    results.push({
      name: 'ARIA Roles',
      status: hasRoles.length > 0 ? 'pass' : 'fail',
      details: `Found ${hasRoles.length} elements with role attributes`
    });

    // Test 9: Performance
    const startTime = performance.now();
    
    // Trigger multiple state changes to test performance
    const mobileButton = document.querySelector('button[aria-label*="Open navigation menu"]');
    if (mobileButton) {
      for (let i = 0; i < 10; i++) {
        (mobileButton as HTMLElement).click();
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    const endTime = performance.now();
    const performanceTime = endTime - startTime;
    
    results.push({
      name: 'Performance Test',
      status: performanceTime < 1000 ? 'pass' : 'fail',
      details: `Navigation interactions completed in ${performanceTime.toFixed(2)}ms`
    });

    setTestResults(results);
    setIsRunning(false);
  };

  const resetTests = () => {
    setTestResults([]);
  };

  return (
    <AuthGuard>
      <UnifiedLayout>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[60px] pb-8">
          <div className="card-luxury p-8">
            <h1 className="heading-luxury text-3xl mb-6">Modern Navigation Test Suite</h1>
            <p className="body-text mb-8">
              Comprehensive testing suite for the new modern navigation system. 
              Tests responsive design, accessibility, performance, and functionality.
            </p>
            
            <div className="flex gap-4 mb-8">
              <button
                onClick={runTests}
                disabled={isRunning}
                className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? 'Running Tests...' : 'Run Navigation Tests'}
              </button>
              
              <button
                onClick={resetTests}
                className="btn-secondary px-6 py-3"
              >
                Reset Results
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-4">
                <h2 className="heading-4 mb-4">Test Results</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {testResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`card-luxury p-4 ${
                        result.status === 'pass' ? 'border-success' : 
                        result.status === 'fail' ? 'border-error' : 
                        'border-info'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="heading-4">{result.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          result.status === 'pass' ? 'bg-success text-primary' :
                          result.status === 'fail' ? 'bg-error text-primary' :
                          'bg-info text-primary'
                        }`}>
                          {result.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-secondary">{result.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </UnifiedLayout>
    </AuthGuard>
  );
}