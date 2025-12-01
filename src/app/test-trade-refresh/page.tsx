'use client';

import { useState, useEffect } from 'react';
import TradeForm from '@/components/forms/TradeForm';
import { supabase } from '@/supabase/client';

export default function TestTradeRefresh() {
  const [events, setEvents] = useState<string[]>([]);
  const [localStorageUpdates, setLocalStorageUpdates] = useState<string[]>([]);

  useEffect(() => {
    // Listen for custom trade data update events
    const handleTradeDataUpdated = (event: CustomEvent) => {
      const timestamp = new Date().toLocaleTimeString();
      const newEvent = `[${timestamp}] Custom Event: ${JSON.stringify(event.detail)}`;
      setEvents(prev => [...prev.slice(-4), newEvent]); // Keep only last 5 events
    };

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tradeDataLastUpdated') {
        const timestamp = new Date().toLocaleTimeString();
        const newUpdate = `[${timestamp}] localStorage Updated: ${e.newValue}`;
        setLocalStorageUpdates(prev => [...prev.slice(-4), newUpdate]); // Keep only last 5 updates
      }
    };

    // Add event listeners
    window.addEventListener('tradeDataUpdated', handleTradeDataUpdated as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Check initial localStorage value
    const initialValue = localStorage.getItem('tradeDataLastUpdated');
    if (initialValue) {
      setLocalStorageUpdates([`Initial value found: ${initialValue}`]);
    }

    // Cleanup
    return () => {
      window.removeEventListener('tradeDataUpdated', handleTradeDataUpdated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const clearLogs = () => {
    setEvents([]);
    setLocalStorageUpdates([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Trade Refresh Trigger Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Event Logs */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Custom Events</h2>
              <button
                onClick={clearLogs}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Clear Logs
              </button>
            </div>
            <div className="space-y-2 font-mono text-sm">
              {events.length === 0 ? (
                <p className="text-gray-400">No events detected yet. Submit a trade to test.</p>
              ) : (
                events.map((event, index) => (
                  <div key={index} className="bg-gray-700 p-2 rounded">
                    {event}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* localStorage Updates */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">localStorage Updates</h2>
            <div className="space-y-2 font-mono text-sm">
              {localStorageUpdates.length === 0 ? (
                <p className="text-gray-400">No localStorage updates detected yet.</p>
              ) : (
                localStorageUpdates.map((update, index) => (
                  <div key={index} className="bg-gray-700 p-2 rounded">
                    {update}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">How to Test:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Fill out and submit the trade form below</li>
            <li>Watch for custom events in the left panel</li>
            <li>Watch for localStorage updates in the right panel</li>
            <li>Both should trigger immediately after successful trade submission</li>
          </ol>
        </div>

        {/* Trade Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Trade Form</h2>
          <TradeForm onSuccess={() => {
            const timestamp = new Date().toLocaleTimeString();
            setEvents(prev => [...prev.slice(-4), `[${timestamp}] onSuccess callback triggered`]);
          }} />
        </div>
      </div>
    </div>
  );
}