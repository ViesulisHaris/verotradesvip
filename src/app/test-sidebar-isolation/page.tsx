'use client';

import React from 'react';
import UnifiedSidebar from '@/components/navigation/UnifiedSidebar';

export default function TestSidebarIsolation() {
  console.log('🔍 [TestSidebarIsolation] Component rendering');
  
  return (
    <div className="min-h-screen bg-[#121212]">
      <h1 className="text-white text-2xl p-4">Sidebar Isolation Test</h1>
      
      {/* Test 1: Direct sidebar rendering */}
      <div className="border border-red-500 p-4 m-4">
        <h2 className="text-white mb-4">Direct Sidebar Test:</h2>
        <UnifiedSidebar />
      </div>
      
      {/* Test 2: Check if component imports work */}
      <div className="border border-blue-500 p-4 m-4">
        <h2 className="text-white mb-4">Import Test:</h2>
        <p className="text-green-400">UnifiedSidebar imported successfully: {typeof UnifiedSidebar}</p>
      </div>
      
      {/* Test 3: Manual sidebar structure */}
      <div className="border border-green-500 p-4 m-4">
        <h2 className="text-white mb-4">Manual Sidebar Structure:</h2>
        <aside className="fixed top-0 left-0 h-screen z-50 bg-[#121212] border-r border-[#B89B5E]/20 w-64">
          <div className="p-4">
            <h3 className="text-white">Manual Sidebar</h3>
            <nav className="mt-4">
              <a href="/dashboard" className="block text-[#9CA3AF] hover:text-white p-2">Dashboard</a>
              <a href="/trades" className="block text-[#9CA3AF] hover:text-white p-2">Trades</a>
              <a href="/settings" className="block text-[#9CA3AF] hover:text-white p-2">Settings</a>
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}