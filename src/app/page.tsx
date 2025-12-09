'use client';

import React, { useState, useEffect, useRef } from 'react';
import TextReveal from '@/components/TextReveal';
import TorchCard from '@/components/TorchCard';
import { PnlChart, RadarEmotionChart } from '@/components/Charts';
import './dashboard/psychological-metrics.css';

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

  // Sample emotional data for demonstration
  const sampleEmotionalData = [
    { subject: 'DISCIPLINE', value: 75, fullMark: 100, leaning: 'positive', side: 'discipline' },
    { subject: 'CONFIDENCE', value: 80, fullMark: 100, leaning: 'positive', side: 'confidence' },
    { subject: 'PATIENCE', value: 70, fullMark: 100, leaning: 'positive', side: 'patience' },
    { subject: 'TILT', value: 30, fullMark: 100, leaning: 'negative', side: 'tilt' },
    { subject: 'REVENGE', value: 20, fullMark: 100, leaning: 'negative', side: 'revenge' },
    { subject: 'IMPATIENCE', value: 25, fullMark: 100, leaning: 'negative', side: 'impatience' },
    { subject: 'NEUTRAL', value: 50, fullMark: 100, leaning: 'neutral', side: 'neutral' },
    { subject: 'ANALYTICAL', value: 65, fullMark: 100, leaning: 'neutral', side: 'analytical' }
  ];

  // Calculate psychological metrics using complementary calculation
  const calculatePsychologicalMetrics = (emotionalData: any[]): { disciplineLevel: number; tiltControl: number; psychologicalStabilityIndex: number } => {
    // Handle edge cases: empty or invalid data
    if (!emotionalData || emotionalData.length === 0) {
      return { disciplineLevel: 50, tiltControl: 50, psychologicalStabilityIndex: 50 };
    }

    try {
      // Define emotion categories with their weights
      const positiveEmotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE'];
      const negativeEmotions = ['TILT', 'REVENGE', 'IMPATIENCE'];
      const neutralEmotions = ['NEUTRAL', 'ANALYTICAL'];
      
      // Calculate weighted scores for each emotion category
      let positiveScore = 0;
      let negativeScore = 0;
      let neutralScore = 0;
      
      emotionalData.forEach(emotion => {
        const emotionName = emotion.subject?.toUpperCase();
        const emotionValue = emotion.value || 0;
        
        if (positiveEmotions.includes(emotionName)) {
          positiveScore += emotionValue;
        } else if (negativeEmotions.includes(emotionName)) {
          negativeScore += emotionValue;
        } else if (neutralEmotions.includes(emotionName)) {
          neutralScore += emotionValue;
        }
      });
      
      // Normalize scores to 0-100 range
      const maxPossibleScore = emotionalData.length * 100;
      positiveScore = (positiveScore / maxPossibleScore) * 100;
      negativeScore = (negativeScore / maxPossibleScore) * 100;
      neutralScore = (neutralScore / maxPossibleScore) * 100;
      
      // Calculate Emotional State Score (ESS) with weighted formula
      const ess = (positiveScore * 2.0) + (neutralScore * 1.0) - (negativeScore * 1.5);
      
      // Calculate Psychological Stability Index (PSI) - normalized to 0-100 scale
      const psi = Math.max(0, Math.min(100, (ess + 100) / 2));
      
      // Calculate Discipline Level based on emotion scoring
      // Higher positive emotions and lower negative emotions result in higher discipline
      let disciplineLevel = psi;
      
      // Ensure discipline level is within 0-100 range
      disciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
      
      // Calculate Tilt Control as the exact complement of Discipline Level
      // This ensures they always sum to exactly 100%
      const tiltControl = 100 - disciplineLevel;
      
      return {
        disciplineLevel: Math.round(disciplineLevel * 100) / 100, // Round to 2 decimal places
        tiltControl: Math.round(tiltControl * 100) / 100,
        psychologicalStabilityIndex: Math.round(psi * 100) / 100 // Include PSI in return
      };
      
    } catch (error) {
      console.error('Error calculating psychological metrics:', error);
      // Return default values on error
      return { disciplineLevel: 50, tiltControl: 50, psychologicalStabilityIndex: 50 };
    }
  };

  // Calculate the metrics
  const { disciplineLevel, tiltControl, psychologicalStabilityIndex } = calculatePsychologicalMetrics(sampleEmotionalData);

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

  // Removed scroll reveal animations - elements now appear immediately

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
        <div className="text-center space-y-4">
          <TextReveal
            text="Trading Dashboard"
            className="text-5xl font-bold text-[#E6D5B8] font-serif"
            delay={0.2}
          />
          <p className="text-xl text-[#9ca3af]">
            Track your performance and analyze your trading patterns
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total PnL */}
          <TorchCard className="p-6 rounded-lg">
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
          <TorchCard className="p-6 rounded-lg">
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
          <TorchCard className="p-6 rounded-lg">
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
          <TorchCard className="p-6 rounded-lg">
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
          <TorchCard className="lg:col-span-8 p-6 rounded-lg">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#E6D5B8]">PnL Performance</h3>
              <div className="h-80">
                {(() => {
                  console.log('🔍 [MainPage] Rendering PnlChart WITHOUT trades data (static page)');
                  return null;
                })()}
                <PnlChart />
              </div>
            </div>
          </TorchCard>

          {/* Emotional Analysis Radar Chart */}
          <TorchCard className="lg:col-span-4 p-6 rounded-lg relative">
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

          {/* Psychological Metrics - Coupled Display */}
          <TorchCard className={`lg:col-span-4 p-6 rounded-lg psychological-metrics-card`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-[#E6D5B8]">Psychological Metrics</h3>
                  <div className="relative group">
                    <span className="material-symbols-outlined text-[#C5A065] text-sm cursor-help">info</span>
                    <div className="absolute left-0 top-6 w-64 p-3 bg-[#1F1F1F] border border-[#2F2F2F] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                      <p className="text-xs text-[#9ca3af]">
                        Discipline Level and Tilt Control are complementary metrics calculated from emotional analysis. These metrics provide insights into trading psychology and behavior patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Metrics Visual Display */}
              <div className="space-y-6">
                  {/* Discipline Level */}
                  <div className="metric-container group" data-metric="discipline">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-[#2EBD85] text-sm">psychology</span>
                        <span className="text-sm font-medium text-[#9ca3af]">Discipline Level</span>
                      </div>
                      <span className="text-sm font-bold text-[#2EBD85]">{disciplineLevel.toFixed(1)}%</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-[#1F1F1F] rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#2EBD85] to-[#2EBD85]/80 relative overflow-hidden"
                          style={{ width: `${disciplineLevel}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-[#2EBD85]/20 border border-[#2EBD85]/40 rounded text-xs text-[#2EBD85] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Reflects emotional consistency and trading adherence
                      </div>
                    </div>
                  </div>
                  
                  {/* Tilt Control */}
                  <div className="metric-container group" data-metric="tilt-control">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-[#F6465D] text-sm">balance</span>
                        <span className="text-sm font-medium text-[#9ca3af]">Tilt Control</span>
                      </div>
                      <span className="text-sm font-bold text-[#F6465D]">{tiltControl.toFixed(1)}%</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-[#1F1F1F] rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#F6465D] to-[#F6465D]/80 relative overflow-hidden"
                          style={{ width: `${tiltControl}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-[#F6465D]/20 border border-[#F6465D]/40 rounded text-xs text-[#F6465D] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Measures emotional regulation and impulse control
                      </div>
                    </div>
                  </div>
              </div>
              
              {/* Psychological Stability Score */}
              <div className="mt-4 p-3 bg-[#1F1F1F]/50 rounded-lg border border-[#2F2F2F]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Psychological Stability Index</span>
                  <span className="text-sm font-bold text-[#C5A065]">{psychologicalStabilityIndex.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#1F1F1F] rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#2EBD85] via-[#C5A065] to-[#F6465D] transition-all duration-500 ease-out"
                    style={{ width: `${psychologicalStabilityIndex}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </TorchCard>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avg Time Held */}
          <TorchCard className="p-6 rounded-lg">
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
          <TorchCard className="p-6 rounded-lg">
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
          <TorchCard className="p-6 rounded-lg">
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
        <TorchCard className="p-6 rounded-lg">
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