'use client';

import React, { useEffect, useState } from 'react';
import ZoomAwareLayout from '@/components/ZoomAwareLayout';

export default function TestHydrationFixPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    
    // Check for hydration errors
    const originalError = console.error;
    console.error = function(...args) {
      const errorMessage = args.join(' ');
      
      if (errorMessage.includes('Text content does not match server-rendered HTML') || 
          errorMessage.includes('hydration')) {
        setHydrationError(errorMessage);
      }
      
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <ZoomAwareLayout>
      <div className="verotrade-min-h-screen bg-verotrade-primary-black p-verotrade-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="verotrade-heading-1 text-verotrade-gold-primary mb-verotrade-6">Hydration Fix Test</h1>
          
          <div className="verotrade-card rounded-lg p-verotrade-6 mb-verotrade-6">
            <h2 className="verotrade-heading-4 text-verotrade-gold-primary mb-verotrade-4">Test Results</h2>
            
            <div className="space-y-verotrade-4">
              <div className="verotrade-flex verotrade-items-center">
                <div className={`w-4 h-4 rounded-full mr-verotrade-3 ${isHydrated ? 'bg-verotrade-success' : 'bg-verotrade-warning'}`}></div>
                <span className="verotrade-text-body">Hydration Status: {isHydrated ? 'Complete' : 'Pending'}</span>
              </div>
              
              <div className="verotrade-flex verotrade-items-center">
                <div className={`w-4 h-4 rounded-full mr-verotrade-3 ${hydrationError ? 'bg-verotrade-error' : 'bg-verotrade-success'}`}></div>
                <span className="verotrade-text-body">Hydration Error: {hydrationError || 'None detected'}</span>
              </div>
            </div>
          </div>
          
          <div className="verotrade-card rounded-lg p-verotrade-6">
            <h2 className="verotrade-heading-4 text-verotrade-gold-primary mb-verotrade-4">Instructions</h2>
            <ol className="list-decimal list-inside space-y-verotrade-2 verotrade-text-body">
              <li>Check if there are any hydration errors in the browser console</li>
              <li>Verify that the zoom indicator shows consistent values</li>
              <li>Confirm that the debug panel (in development) shows correct values</li>
              <li>Check that the component renders correctly after hydration</li>
            </ol>
          </div>
          
          <div className="mt-verotrade-6 verotrade-text-small verotrade-text-secondary">
            <p>This test page verifies that the ZoomAwareLayout component no longer causes hydration errors.</p>
            <p>The fix ensures that server and client render the same initial zoom level (100%) during hydration.</p>
          </div>
        </div>
      </div>
    </ZoomAwareLayout>
  );
}