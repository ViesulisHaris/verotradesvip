'use client';

import React, { useState, useEffect, useRef } from 'react';
import TextReveal from '@/components/TextReveal';
import TorchCard from '@/components/TorchCard';
import { PnlChart, RadarEmotionChart } from '@/components/Charts';

interface Trade {
  id: number;
  date: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry: number;
  exit: number;
  return: number;
}

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Sample trade data
  const recentTrades: Trade[] = [
    {
      id: 1,
      date: '2024-11-15',
      symbol: 'AAPL',
      side: 'LONG',
      entry: 175.20,
      exit: 182.45,
      return: 4.14
    },
    {
      id: 2,
      date: '2024-11-14',
      symbol: 'TSLA',
      side: 'SHORT',
      entry: 245.80,
      exit: 238.90,
      return: 2.81
    },
    {
      id: 3,
      date: '2024-11-13',
      symbol: 'NVDA',
      side: 'LONG',
      entry: 485.20,
      exit: 512.75,
      return: 5.68
    }
  ];

  // Handle mouse move for flashlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Update CSS variables for all flashlight cards
      const flashlightCards = document.querySelectorAll('.flashlight-card');
      flashlightCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Clamp values to prevent overflow
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));
        
        (card as HTMLElement).style.setProperty('--mouse-x', `${clampedX}%`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${clampedY}%`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle scroll reveal animations with IntersectionObserver
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Trigger slightly before element comes into view
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add 'in-view' class to trigger animation
          entry.target.classList.add('in-view');
          
          // Find TextReveal components within this element and trigger their animations
          const textRevealElements = entry.target.querySelectorAll('.text-reveal-letter');
          textRevealElements.forEach((el, index) => {
            setTimeout(() => {
              (el as HTMLElement).style.animationPlayState = 'running';
            }, index * 50); // Stagger the text reveals
          });
        }
      });
    }, observerOptions);

    // Observe all elements with scroll-item class
    const scrollItems = document.querySelectorAll('.scroll-item');
    scrollItems.forEach((item) => {
      observerRef.current?.observe(item);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    // In a real app, this would handle actual logout logic
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-['Inter']">
      {/* Navigation Section */}
      <nav className="border-b border-[#1F1F1F] bg-[#0B0B0B] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* VeroTrade Branding */}
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-serif font-bold text-[#E6D5B8]">
                VeroTrade
              </h1>
              <div className="hidden md:flex items-center space-x-6">
                <button className="p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors">
                  <span className="material-symbols-outlined text-[#C5A065]">dashboard</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors">
                  <span className="material-symbols-outlined text-[#C5A065]">analytics</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors">
                  <span className="material-symbols-outlined text-[#C5A065]">history</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors">
                  <span className="material-symbols-outlined text-[#C5A065]">settings</span>
                </button>
              </div>
            </div>

            {/* Beam Button Logout */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLogout}
                className="beam-button px-4 py-2 rounded-lg border border-[#1F1F1F] hover:border-[#C5A065] transition-all duration-300"
              >
                <span className="beam-button-content flex items-center space-x-2">
                  <span className="material-symbols-outlined text-[#C5A065]">logout</span>
                  <span className="text-[#C5A065]">Logout</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-4 scroll-item">
          <TextReveal
            text="Trading Dashboard"
            className="text-5xl font-bold text-[#E6D5B8] font-serif"
            delay={0.2}
          />
          <p className="text-xl text-[#9ca3af] fade-in">
            Track your performance and analyze your trading patterns
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total PnL */}
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-1">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Total PnL</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text="$156,670"
                  className="text-3xl font-bold text-[#2EBD85]"
                  delay={0.3}
                />
                <span className="text-sm text-[#2EBD85]">+2.4% today</span>
              </div>
            </div>
          </TorchCard>

          {/* Profit Factor */}
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Profit Factor</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text="3.25"
                  className="text-3xl font-bold text-[#E6D5B8]"
                  delay={0.4}
                />
                <span className="text-xs text-[#9ca3af]">Optimal range</span>
              </div>
            </div>
          </TorchCard>

          {/* Win Rate */}
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Win Rate</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text="68.0%"
                  className="text-3xl font-bold text-[#C5A065]"
                  delay={0.5}
                />
              </div>
              <div className="w-full bg-[#1F1F1F] rounded-full h-2">
                <div className="bg-[#C5A065] h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
          </TorchCard>

          {/* Total Trades */}
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Total Trades</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text="1,000"
                  className="text-3xl font-bold text-[#E6D5B8]"
                  delay={0.6}
                />
                <span className="text-xs text-[#9ca3af]">Active session</span>
              </div>
            </div>
          </TorchCard>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
          {/* PnL Performance Chart */}
          <TorchCard className="lg:col-span-8 p-6 rounded-lg scroll-item scroll-animate stagger-delay-5">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#E6D5B8]">PnL Performance</h3>
              <div className="h-80">
                <PnlChart />
              </div>
            </div>
          </TorchCard>

          {/* Emotional Analysis Radar Chart */}
          <TorchCard className="lg:col-span-4 p-6 rounded-lg scroll-item scroll-animate stagger-delay-6 relative">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-[#E6D5B8]">Emotional Analysis</h3>
                <span className="material-symbols-outlined text-[#5E2121]">psychology</span>
              </div>
              <div className="h-64">
                <RadarEmotionChart />
              </div>
            </div>
          </TorchCard>

          {/* Discipline/Tilt Progress Bar */}
          <TorchCard className="lg:col-span-4 p-6 rounded-lg scroll-item scroll-animate stagger-delay-7">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#E6D5B8]">Discipline Level</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9ca3af]">Discipline</span>
                  <span className="text-[#2EBD85]">85%</span>
                </div>
                <div className="w-full bg-[#1F1F1F] rounded-full h-3">
                  <div className="bg-[#2EBD85] h-3 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9ca3af]">Tilt Control</span>
                  <span className="text-[#F6465D]">72%</span>
                </div>
                <div className="w-full bg-[#1F1F1F] rounded-full h-3">
                  <div className="bg-[#F6465D] h-3 rounded-full" style={{ width: '72%' }}></div>
                </div>
              </div>
            </div>
          </TorchCard>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avg Time Held */}
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-8">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Avg Time Held</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text="12h 8m"
                  className="text-2xl font-bold text-[#E6D5B8]"
                  delay={0.7}
                />
              </div>
              <div className="flex space-x-1">
                <div className="flex-1 bg-[#2EBD85] h-2 rounded-l"></div>
                <div className="flex-1 bg-[#C5A065] h-2"></div>
                <div className="flex-1 bg-[#F6465D] h-2 rounded-r"></div>
              </div>
              <div className="flex justify-between text-xs text-[#9ca3af]">
                <span>Short</span>
                <span>Medium</span>
                <span>Long</span>
              </div>
            </div>
          </TorchCard>

          {/* Sharpe Ratio */}
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-9">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Sharpe Ratio</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text="0.51"
                  className="text-2xl font-bold text-[#C5A065]"
                  delay={0.8}
                />
                <span className="text-xs text-[#F6465D]">Moderate Risk</span>
              </div>
              <div className="w-full bg-[#1F1F1F] rounded-full h-2">
                <div className="bg-[#C5A065] h-2 rounded-full" style={{ width: '51%' }}></div>
              </div>
            </div>
          </TorchCard>

          {/* Trading Days */}
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-10">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-[#9ca3af]">Trading Days</h3>
                <span className="material-symbols-outlined text-[#C5A065] text-sm">calendar_today</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text="266"
                  className="text-2xl font-bold text-[#E6D5B8]"
                  delay={0.9}
                />
                <span className="text-xs text-[#9ca3af]">Consistent</span>
              </div>
            </div>
          </TorchCard>
        </div>

        {/* Recent Trades Table */}
        <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-11">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#E6D5B8]">Recent Trades</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F1F]">
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Symbol</th>
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Side</th>
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Entry</th>
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Exit</th>
                    <th className="text-right py-3 px-4 font-medium text-[#9ca3af]">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade) => (
                    <tr 
                      key={trade.id} 
                      className="border-b border-[#1F1F1F] hover:bg-[#1F1F1F] transition-colors"
                    >
                      <td className="py-3 px-4 text-[#EAEAEA]">{trade.date}</td>
                      <td className="py-3 px-4 text-[#EAEAEA] font-medium">{trade.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          trade.side === 'LONG' 
                            ? 'bg-[#2EBD85]/20 text-[#2EBD85]' 
                            : 'bg-[#F6465D]/20 text-[#F6465D]'
                        }`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#EAEAEA]">${trade.entry.toFixed(2)}</td>
                      <td className="py-3 px-4 text-[#EAEAEA]">${trade.exit.toFixed(2)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        trade.return > 0 ? 'text-[#2EBD85]' : 'text-[#F6465D]'
                      }`}>
                        {trade.return > 0 ? '+' : ''}{trade.return.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TorchCard>
      </div>
    </div>
  );
}