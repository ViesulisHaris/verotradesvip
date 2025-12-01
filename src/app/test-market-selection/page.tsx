'use client';

import { useState } from 'react';
import TradeForm from '@/components/forms/TradeForm';

export default function TestMarketSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Market Selection Redesign Test
        </h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions:</h2>
          <ul className="text-white/80 space-y-2">
            <li>✅ Market selection should now use modern card-style buttons like emotion selector</li>
            <li>✅ Custom rules should also use the same modern button style</li>
            <li>✅ Both should have smooth hover animations and transitions</li>
            <li>✅ Selected state should show blue/green color coding respectively</li>
            <li>✅ Glass morphism effect should be maintained</li>
          </ul>
        </div>

        <TradeForm />
      </div>
    </div>
  );
}