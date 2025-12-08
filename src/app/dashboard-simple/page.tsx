'use client';

import React from 'react';

export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-['Inter'] p-8">
      <h1 className="text-4xl font-bold text-[#E6D5B8] mb-8">
        Simple Dashboard Test
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A]">
          <h3 className="text-lg font-semibold text-[#E6D5B8] mb-2">Total PnL</h3>
          <p className="text-3xl font-bold text-[#2EBD85]">$156,670</p>
          <p className="text-sm text-[#9ca3af]">+2.4% today</p>
        </div>
        
        <div className="p-6 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A]">
          <h3 className="text-lg font-semibold text-[#E6D5B8] mb-2">Profit Factor</h3>
          <p className="text-3xl font-bold text-[#E6D5B8]">3.25</p>
          <p className="text-sm text-[#9ca3af]">Optimal range</p>
        </div>
        
        <div className="p-6 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A]">
          <h3 className="text-lg font-semibold text-[#C5A065] mb-2">Win Rate</h3>
          <p className="text-3xl font-bold text-[#C5A065]">68.0%</p>
          <div className="w-full bg-[#1F1F1F] rounded-full h-2 mt-2">
            <div className="bg-[#C5A065] h-2 rounded-full" style={{ width: '68%' }}></div>
          </div>
        </div>
        
        <div className="p-6 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A]">
          <h3 className="text-lg font-semibold text-[#E6D5B8] mb-2">Total Trades</h3>
          <p className="text-3xl font-bold text-[#E6D5B8]">1,000</p>
          <p className="text-sm text-[#9ca3af]">Active session</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A]">
          <h3 className="text-lg font-semibold text-[#E6D5B8] mb-4">Recent Trades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Symbol</th>
                  <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Side</th>
                  <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Return</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#2A2A2A] hover:bg-[#1F1F1F] transition-colors">
                  <td className="py-3 px-4 text-[#EAEAEA]">2024-11-15</td>
                  <td className="py-3 px-4 text-[#EAEAEA] font-medium">AAPL</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-[#2EBD85]/20 text-[#2EBD85]">
                      LONG
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#2EBD85]">+4.14%</td>
                </tr>
                <tr className="border-b border-[#2A2A2A] hover:bg-[#1F1F1F] transition-colors">
                  <td className="py-3 px-4 text-[#EAEAEA]">2024-11-14</td>
                  <td className="py-3 px-4 text-[#EAEAEA] font-medium">TSLA</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-[#F6465D]/20 text-[#F6465D]">
                      SHORT
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#2EBD85]">+2.81%</td>
                </tr>
                <tr className="border-b border-[#2A2A2A] hover:bg-[#1F1F1F] transition-colors">
                  <td className="py-3 px-4 text-[#EAEAEA]">2024-11-13</td>
                  <td className="py-3 px-4 text-[#EAEAEA] font-medium">NVDA</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-[#2EBD85]/20 text-[#2EBD85]">
                      LONG
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#2EBD85]">+5.68%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-6 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A]">
          <h3 className="text-lg font-semibold text-[#E6D5B8] mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af]">Authentication</span>
              <span className="text-[#2EBD85]">✅ Working</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af]">Database</span>
              <span className="text-[#2EBD85]">✅ Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af]">Module Resolution</span>
              <span className="text-[#2EBD85]">✅ Fixed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af]">Build Status</span>
              <span className="text-[#2EBD85]">✅ Success</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}