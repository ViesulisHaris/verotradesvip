'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSidebarSync } from '@/hooks/useSidebarSync';
import { debounce } from '@/lib/performance';

interface ConfluenceData {
  id: string;
  date: string;
  symbol: string;
  strategy: string;
  timeframe: string;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  status: 'open' | 'closed';
  confidence: number;
  emotions: string[];
  notes?: string;
}

interface ConfluenceTableProps {
  data: ConfluenceData[];
  isLoading?: boolean;
}

const ConfluenceTable: React.FC<ConfluenceTableProps> = ({ data, isLoading = false }) => {
  const { isCollapsed, isTransitioning } = useSidebarSync();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ConfluenceData;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filter, setFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'closed'>('all');

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(trade => trade.status === selectedStatus);
    }

    // Apply text filter
    if (filter) {
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(filter.toLowerCase()) ||
        trade.strategy.toLowerCase().includes(filter.toLowerCase()) ||
        trade.timeframe.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || bValue === undefined) return 0;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    return filtered;
  }, [data, filter, selectedStatus, sortConfig]);

  const handleSort = (key: keyof ConfluenceData) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-[#B89B5E] bg-[#B89B5E]/10';
      case 'closed':
        return 'text-[#4F5B4A] bg-[#4F5B4A]/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getPnlColor = (pnl?: number) => {
    if (!pnl) return '';
    return pnl >= 0 ? 'text-[#B89B5E]' : 'text-[#A7352D]';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-[#B89B5E]';
    if (confidence >= 60) return 'text-[#D6C7B2]';
    return 'text-[#4F5B4A]';
  };

  if (isLoading) {
    return (
      <div className="card-unified p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-unified p-6">
      <div className="mb-6 space-y-4">
        <h2 className="text-xl font-semibold text-primary">Confluence Analysis</h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Filter by symbol, strategy, or timeframe..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-4 py-2 bg-background border border-secondary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'open' | 'closed')}
            className="px-4 py-2 bg-background border border-secondary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary">
              <th
                className="text-left py-3 px-4 text-tertiary font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('date')}
              >
                Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-3 px-4 text-tertiary font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('symbol')}
              >
                Symbol {sortConfig?.key === 'symbol' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-3 px-4 text-tertiary font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('strategy')}
              >
                Strategy {sortConfig?.key === 'strategy' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-3 px-4 text-tertiary font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('timeframe')}
              >
                Timeframe {sortConfig?.key === 'timeframe' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-3 px-4 text-tertiary font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('entryPrice')}
              >
                Entry {sortConfig?.key === 'entryPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-3 px-4 text-tertiary font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('exitPrice')}
              >
                Exit {sortConfig?.key === 'exitPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-3 px-4 text-tertiary font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('pnl')}
              >
                P&L {sortConfig?.key === 'pnl' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-3 px-4 text-tertiary font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('status')}
              >
                Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left py-3 px-4 text-tertiary font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('confidence')}
              >
                Confidence {sortConfig?.key === 'confidence' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-tertiary">
                  No confluence data available
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((trade) => (
                <tr key={trade.id} className="border-b border-secondary hover:bg-background/50 transition-colors">
                  <td className="py-3 px-4 text-primary">{trade.date}</td>
                  <td className="py-3 px-4 text-primary font-medium">{trade.symbol}</td>
                  <td className="py-3 px-4 text-primary">{trade.strategy}</td>
                  <td className="py-3 px-4 text-primary">{trade.timeframe}</td>
                  <td className="py-3 px-4 text-primary">${trade.entryPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-primary">
                    {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}
                  </td>
                  <td className={`py-3 px-4 font-medium ${getPnlColor(trade.pnl)}`}>
                    {trade.pnl !== undefined ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className={`py-3 px-4 font-medium ${getConfidenceColor(trade.confidence)}`}>
                    {trade.confidence}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      {filteredAndSortedData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-secondary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{filteredAndSortedData.length}</div>
              <div className="text-sm text-tertiary">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#B89B5E]">
                {filteredAndSortedData.filter(t => t.status === 'open').length}
              </div>
              <div className="text-sm text-tertiary">Open Positions</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getPnlColor(
                filteredAndSortedData.reduce((sum, t) => sum + (t.pnl || 0), 0)
              )}`}>
                ${filteredAndSortedData.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-tertiary">Total P&L</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#D6C7B2]">
                {filteredAndSortedData.length > 0
                  ? (filteredAndSortedData.reduce((sum, t) => sum + t.confidence, 0) / filteredAndSortedData.length).toFixed(1)
                  : 0}%
              </div>
              <div className="text-sm text-tertiary">Avg Confidence</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfluenceTable;