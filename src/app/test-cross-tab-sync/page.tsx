'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function CrossTabSyncTestPage() {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [storageEvents, setStorageEvents] = useState<Array<{ timestamp: string; key: string; value: string }>>([]);
  const [customEvents, setCustomEvents] = useState<Array<{ timestamp: string; detail: any }>>([]);

  useEffect(() => {
    // Listen for custom events
    const handleTradeDataUpdated = (event: CustomEvent) => {
      console.log('Test Page: Received tradeDataUpdated event', event.detail);
      setCustomEvents(prev => [...prev, {
        timestamp: new Date().toISOString(),
        detail: event.detail
      }]);
      setUpdateCount(prev => prev + 1);
      setLastUpdate(new Date().toISOString());
    };

    // Listen for localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      console.log('Test Page: Storage event detected', event);
      setStorageEvents(prev => [...prev, {
        timestamp: new Date().toISOString(),
        key: event.key || '',
        value: event.newValue || ''
      }]);
      setUpdateCount(prev => prev + 1);
      setLastUpdate(new Date().toISOString());
    };

    window.addEventListener('tradeDataUpdated', handleTradeDataUpdated as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('tradeDataUpdated', handleTradeDataUpdated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const simulateTradeUpdate = () => {
    const updateId = `test_${Date.now()}`;
    const updateData = {
      tradeId: 'test-trade-id',
      timestamp: new Date().toISOString(),
      action: 'test_trade_created',
      updateId: updateId,
      source: 'TestPage'
    };

    // Dispatch custom event
    const event = new CustomEvent('tradeDataUpdated', {
      detail: updateData
    });
    window.dispatchEvent(event);

    // Update localStorage
    localStorage.setItem('tradeDataLastUpdated', JSON.stringify(updateData));
    localStorage.setItem('tradeDataLastUpdatedSimple', new Date().toISOString());
  };

  const clearEvents = () => {
    setStorageEvents([]);
    setCustomEvents([]);
    setUpdateCount(0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-blue-400">Cross-Tab Synchronization Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-400">Test Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={simulateTradeUpdate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Simulate Trade Update
              </button>
              
              <button
                onClick={clearEvents}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Clear Events
              </button>
            </div>
            
            <div className="mt-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Updates:</span>
                <span className="font-mono text-yellow-400">{updateCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Update:</span>
                <span className="font-mono text-green-400 text-sm">
                  {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-yellow-400">Test Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              <li>Open this page in multiple browser tabs</li>
              <li>Click "Simulate Trade Update" in one tab</li>
              <li>Verify that all tabs receive the update events</li>
              <li>Open TradeForm in another tab and submit a trade</li>
              <li>Verify that this test page shows the update events</li>
              <li>Check that duplicate events are properly filtered</li>
            </ol>
          </div>
        </div>

        {/* Storage Events */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Storage Events</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {storageEvents.length === 0 ? (
              <p className="text-gray-500">No storage events detected yet</p>
            ) : (
              storageEvents.map((event, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-blue-300">{event.timestamp}</span>
                    <span className="text-yellow-300">Key: {event.key}</span>
                  </div>
                  <div className="mt-1 text-gray-300 break-all">
                    Value: {event.value.substring(0, 100)}{event.value.length > 100 ? '...' : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Events */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Custom Events</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {customEvents.length === 0 ? (
              <p className="text-gray-500">No custom events detected yet</p>
            ) : (
              customEvents.map((event, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded text-sm">
                  <div className="font-mono text-blue-300">{event.timestamp}</div>
                  <div className="mt-1 text-gray-300">
                    <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(event.detail, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}