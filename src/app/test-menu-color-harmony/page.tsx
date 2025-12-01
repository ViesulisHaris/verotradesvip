'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Home, PlusCircle, Calendar, BarChart3, TrendingUp, BookOpen, Target, LogOut, Monitor, Smartphone, Tablet } from 'lucide-react';

export default function TestMenuColorHarmony() {
  const [activeTest, setActiveTest] = useState<string>('desktop');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [testResults, setTestResults] = useState<any>({});

  // Simulate the Balatro background colors
  const balatroColors = {
    forestGreen: '#1A3F1A', // RGB: 26, 63, 26
    darkBlue: '#242A50',   // RGB: 36, 42, 80
    lightGreen: '#4ade80',
    darkerGreen: '#166534',
    accentBlue: '#1e40af'
  };

  // Test configurations for different screen sizes
  const testConfigs = [
    {
      id: 'desktop',
      name: 'Desktop',
      icon: Monitor,
      width: '1920px',
      height: '1080px',
      description: 'Standard desktop view (1920x1080)'
    },
    {
      id: 'tablet',
      name: 'Tablet',
      icon: Tablet,
      width: '768px',
      height: '1024px',
      description: 'Tablet view (768x1024)'
    },
    {
      id: 'mobile',
      name: 'Mobile',
      icon: Smartphone,
      width: '375px',
      height: '667px',
      description: 'Mobile view (375x667)'
    }
  ];

  // Menu items to test
  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, active: true },
    { href: '/log-trade', label: 'Log Trade', icon: PlusCircle, active: false },
    { href: '/strategies', label: 'Strategies', icon: BookOpen, active: false },
    { href: '/trades', label: 'Trades', icon: TrendingUp, active: false },
    { href: '/calendar', label: 'Calendar', icon: Calendar, active: false },
    { href: '/confluence', label: 'Confluence', icon: Target, active: false },
  ];

  // Color harmony tests
  const colorTests = [
    {
      name: 'Forest Green Integration',
      description: 'Verify forest green (#1A3F1A) blends with background',
      color: balatroColors.forestGreen,
      test: (element: HTMLElement) => {
        const styles = window.getComputedStyle(element);
        return styles.background?.includes('26, 63, 26') || styles.backgroundColor?.includes('26, 63, 26');
      }
    },
    {
      name: 'Dark Blue Integration',
      description: 'Verify dark blue (#242A50) blends with background',
      color: balatroColors.darkBlue,
      test: (element: HTMLElement) => {
        const styles = window.getComputedStyle(element);
        return styles.background?.includes('36, 42, 80') || styles.backgroundColor?.includes('36, 42, 80');
      }
    },
    {
      name: 'Text Readability',
      description: 'Verify text remains readable against new backgrounds',
      test: (element: HTMLElement) => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        return color === 'rgb(255, 255, 255)' || color === 'rgb(74, 222, 128)' || color === 'rgb(134, 239, 172)';
      }
    },
    {
      name: 'Hover State Consistency',
      description: 'Verify hover states use green tones',
      test: (element: HTMLElement) => {
        return element.classList.contains('group-hover:text-green-300') || 
               element.classList.contains('group-hover:text-green-100');
      }
    },
    {
      name: 'Active State Visibility',
      description: 'Verify active states are clearly visible',
      test: (element: HTMLElement) => {
        const styles = window.getComputedStyle(element);
        return styles.background?.includes('26, 63, 26') || 
               styles.background?.includes('36, 42, 80') ||
               styles.boxShadow?.includes('26, 63, 26');
      }
    }
  ];

  // Run color harmony tests
  const runColorTests = () => {
    const results: any = {};
    
    colorTests.forEach(test => {
      const testElements = document.querySelectorAll('.sidebar-menu-item');
      let passed = false;
      
      testElements.forEach((element: any) => {
        if (test.test(element)) {
          passed = true;
        }
      });
      
      results[test.name] = {
        passed,
        description: test.description,
        color: test.color || undefined
      };
    });
    
    setTestResults(results);
  };

  // Toggle sidebar for testing
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Run tests when component mounts or when active test changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(runColorTests, 100);
    }
  }, [activeTest, sidebarOpen]);

  return (
    <div className="min-h-screen relative" style={{
      background: `linear-gradient(135deg, ${balatroColors.forestGreen} 0%, ${balatroColors.darkBlue} 100%)`
    }}>
      {/* Header */}
      <div className="relative z-10 p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Menu Color Harmony Test</h1>
        <p className="text-white/80 mb-6">Test sidebar menu colors against Balatro background</p>
        
        {/* Viewport Selector */}
        <div className="flex flex-wrap gap-4 mb-8">
          {testConfigs.map(config => {
            const Icon = config.icon;
            return (
              <button
                key={config.id}
                onClick={() => setActiveTest(config.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTest === config.id 
                    ? 'bg-green-600/30 border border-green-500/50 text-white' 
                    : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{config.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Container */}
      <div className="flex justify-center items-center p-8">
        <div 
          className="relative border-2 border-white/20 rounded-lg overflow-hidden shadow-2xl"
          style={{
            width: testConfigs.find(c => c.id === activeTest)?.width,
            height: testConfigs.find(c => c.id === activeTest)?.height,
            background: `linear-gradient(135deg, ${balatroColors.forestGreen} 0%, ${balatroColors.darkBlue} 100%)`
          }}
        >
          {/* Viewport Label */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
            {testConfigs.find(c => c.id === activeTest)?.description}
          </div>

          {/* Mock Sidebar */}
          <div className={`fixed top-0 left-0 h-full w-72 transform transition-transform ease-out z-50 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`} style={{
            transitionDuration: '300ms',
            transitionTimingFunction: 'ease-out',
            backdropFilter: 'blur(8px) saturate(120%)',
            WebkitBackdropFilter: 'blur(8px) saturate(120%)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
            borderRight: '1px solid rgba(26, 63, 26, 0.3)'
          }}>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">VT</span>
                </div>
                <span className="text-white font-semibold text-lg">VeroTrade</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-green-600/20 transition-all"
                style={{ transitionDuration: '300ms' }}
              >
                <X className="w-5 h-5 text-white hover:text-green-300 transition-colors" style={{ transitionDuration: '300ms' }} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map(({ href, label, icon: Icon, active }) => (
                <div
                  key={href}
                  className={`sidebar-menu-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden cursor-pointer ${
                    active ? 'active' : ''
                  }`}
                  style={{
                    transitionDuration: '300ms',
                    background: active 
                      ? 'linear-gradient(135deg, rgba(26, 63, 26, 0.4), rgba(36, 42, 80, 0.3))' 
                      : '',
                    border: active ? '1px solid rgba(26, 63, 26, 0.5)' : '1px solid transparent',
                    boxShadow: active 
                      ? '0 4px 20px rgba(26, 63, 26, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                      : ''
                  }}
                >
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" 
                       style={{ transitionDuration: '300ms' }}></div>
                  
                  <Icon className={`w-5 h-5 transition-all flex-shrink-0 relative z-10 ${
                    active ? 'text-green-300 scale-110' : 'text-white/90 group-hover:text-green-300 group-hover:scale-110'
                  }`} style={{ transitionDuration: '300ms' }} />
                  
                  <span className={`font-medium transition-all relative z-10 ${
                    active ? 'text-green-300' : 'text-white/90 group-hover:text-green-100'
                  }`} style={{ transitionDuration: '300ms' }}>
                    {label}
                  </span>
                </div>
              ))}
              
              {/* Logout Button */}
              <div
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group relative overflow-hidden cursor-pointer"
                style={{
                  transitionDuration: '300ms',
                  color: '#fb923c',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Hover background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" 
                     style={{ transitionDuration: '300ms' }}></div>
                 
                <LogOut className="w-5 h-5 flex-shrink-0 transition-all relative z-10 group-hover:text-orange-300 group-hover:scale-110" 
                        style={{ transitionDuration: '300ms' }} />
                 
                <span className="font-medium transition-all relative z-10 group-hover:text-orange-200" 
                      style={{ transitionDuration: '300ms' }}>
                  Logout
                </span>
              </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-green-500/30">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 w-10 h-10 p-2.5 group"
            style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
              border: '1px solid rgba(26, 63, 26, 0.3)',
              borderRadius: '0.75rem'
            }}
          >
            <Menu className="w-5 h-5 text-white relative z-10 group-hover:text-blue-300 transition-colors" 
                  style={{ transitionDuration: '300ms' }} />
          </button>

          {/* Main Content Area */}
          <div className="p-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Color Harmony Test Results</h2>
              
              {/* Test Results */}
              <div className="space-y-4">
                {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                  <div key={testName} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-white">{testName}</h3>
                      <p className="text-white/70 text-sm">{result.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.color && (
                        <div 
                          className="w-6 h-6 rounded border border-white/30" 
                          style={{ backgroundColor: result.color }}
                        />
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        result.passed 
                          ? 'bg-green-500/30 text-green-300 border border-green-500/50' 
                          : 'bg-red-500/30 text-red-300 border border-red-500/50'
                      }`}>
                        {result.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Manual Test Instructions */}
              <div className="mt-8 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Manual Testing Instructions</h3>
                <ul className="text-white/80 space-y-2 text-sm">
                  <li>• Toggle the sidebar to test open/close animations</li>
                  <li>• Hover over menu items to verify green hover states</li>
                  <li>• Check that active menu items use forest green/dark blue gradients</li>
                  <li>• Verify text remains readable against new backgrounds</li>
                  <li>• Test logout button uses orange for contrast</li>
                  <li>• Switch between desktop/tablet/mobile views</li>
                  <li>• Verify smooth 300ms transitions</li>
                </ul>
              </div>

              {/* Color Reference */}
              <div className="mt-6 p-4 bg-black/30 rounded-lg">
                <h3 className="font-semibold text-white mb-3">Balatro Color Reference</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded border border-white/30" 
                      style={{ backgroundColor: balatroColors.forestGreen }}
                    />
                    <div>
                      <p className="text-white font-medium">Forest Green</p>
                      <p className="text-white/60 text-sm">#1A3F1A</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded border border-white/30" 
                      style={{ backgroundColor: balatroColors.darkBlue }}
                    />
                    <div>
                      <p className="text-white font-medium">Dark Blue</p>
                      <p className="text-white/60 text-sm">#242A50</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}