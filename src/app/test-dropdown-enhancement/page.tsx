'use client';

import React, { useState } from 'react';

export default function TestDropdownEnhancement() {
  const [marketValue, setMarketValue] = useState('');
  const [strategyValue, setStrategyValue] = useState('');
  const [sideValue, setSideValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Enhanced Dropdown Test</h1>
          <p className="text-white/70">Testing the new elegant dropdown styling</p>
        </div>

        {/* Test Container */}
        <div className="glass-enhanced p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Dropdown Components Test</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Market Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Market</label>
              <select
                value={marketValue}
                onChange={(e) => setMarketValue(e.target.value)}
                className="dropdown-enhanced w-full text-sm lg:text-base px-4 py-3"
              >
                <option value="">All Markets</option>
                <option value="Stock">Stock</option>
                <option value="Crypto">Crypto</option>
                <option value="Forex">Forex</option>
                <option value="Futures">Futures</option>
              </select>
            </div>

            {/* Strategy Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Strategy</label>
              <select
                value={strategyValue}
                onChange={(e) => setStrategyValue(e.target.value)}
                className="dropdown-enhanced w-full text-sm lg:text-base px-4 py-3"
              >
                <option value="">All Strategies</option>
                <option value="strategy1">Momentum Trading</option>
                <option value="strategy2">Breakout Strategy</option>
                <option value="strategy3">Mean Reversion</option>
                <option value="strategy4">Scalping</option>
              </select>
            </div>

            {/* Side Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Side</label>
              <select
                value={sideValue}
                onChange={(e) => setSideValue(e.target.value)}
                className="dropdown-enhanced w-full text-sm lg:text-base px-4 py-3"
              >
                <option value="">All Sides</option>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-enhanced w-full text-sm lg:text-base px-4 py-3"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-enhanced w-full text-sm lg:text-base px-4 py-3"
              />
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Sort By</label>
              <select
                value=""
                onChange={() => {}}
                className="dropdown-enhanced text-sm px-3 py-2"
              >
                <option value="">Default</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="date-desc">Date (Newest)</option>
                <option value="pnl-desc">P&L (High to Low)</option>
                <option value="pnl-asc">P&L (Low to High)</option>
                <option value="symbol-asc">Symbol (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Current Values Display */}
          <div className="mt-8 p-4 bg-black/20 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Current Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-white/60">Market:</span>
                <span className="ml-2 text-white font-medium">{marketValue || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-white/60">Strategy:</span>
                <span className="ml-2 text-white font-medium">{strategyValue || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-white/60">Side:</span>
                <span className="ml-2 text-white font-medium">{sideValue || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-white/60">Start Date:</span>
                <span className="ml-2 text-white font-medium">{startDate || 'Not selected'}</span>
              </div>
              <div>
                <span className="text-white/60">End Date:</span>
                <span className="ml-2 text-white font-medium">{endDate || 'Not selected'}</span>
              </div>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="mt-8 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Test Instructions</h3>
            <ul className="text-white/80 space-y-2 text-sm">
              <li>• Click on each dropdown to verify it opens properly</li>
              <li>• Select different options to verify they work correctly</li>
              <li>• Hover over dropdowns to see the enhanced glow effects</li>
              <li>• Verify the glass morphism styling matches the rest of the site</li>
              <li>• Check that dropdown arrows and date icons are visible</li>
              <li>• Test responsive behavior on different screen sizes</li>
            </ul>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="/confluence"
              className="filter-pill hover-glow"
            >
              View Confluence Tab
            </a>
            <a
              href="/log-trade"
              className="filter-pill hover-glow"
            >
              View Trade Form
            </a>
            <a
              href="/trades"
              className="filter-pill hover-glow"
            >
              View Trades Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}