'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

// Form state interface
interface FormState {
  market: {
    stock: boolean;
    crypto: boolean;
    forex: boolean;
    futures: boolean;
  };
  symbol: string;
  strategy_id: string;
  date: string;
  side: string;
  quantity: string;
  stop_loss: string;
  take_profit: string;
  pnl: string;
  entry_time: string;
  exit_time: string;
  emotional_state: string;
}

// Strategy interface
interface Strategy {
  id: string;
  name: string;
}

// Toast notification interface
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

export default function LogTradePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const spotlightRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [form, setForm] = useState<FormState>({
    market: { stock: false, crypto: false, forex: false, futures: false },
    symbol: '',
    strategy_id: '',
    date: new Date().toISOString().split('T')[0] || '',
    side: 'Buy',
    quantity: '',
    stop_loss: '',
    take_profit: '',
    pnl: '',
    entry_time: '',
    exit_time: '',
    emotional_state: 'Neutral',
  });

  // Dropdown states
  const [strategyDropdownOpen, setStrategyDropdownOpen] = useState(false);
  const [sideDropdownOpen, setSideDropdownOpen] = useState(false);
  const [emotionDropdownOpen, setEmotionDropdownOpen] = useState(false);
  
  // Strategies data
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  // Options for dropdowns
  const sideOptions = ['Buy', 'Sell'];
  const emotionOptions = ['Neutral', 'Greed', 'Fear', 'Confidence', 'Frustration', 'Discipline', 'Impatience', 'Euphoria'];

  // DEBUG: Enhanced dropdown state change handlers with logging
  const handleStrategyDropdownToggle = useCallback(() => {
    console.log('🔍 DEBUG: Strategy dropdown toggle clicked');
    console.log('🔍 DEBUG: Current state:', strategyDropdownOpen);
    const newState = !strategyDropdownOpen;
    setStrategyDropdownOpen(newState);
    console.log('🔍 DEBUG: New state:', newState);
    
    // Log DOM element after state change
    setTimeout(() => {
      const dropdownElement = document.querySelector('[data-testid="strategy-dropdown-menu"]');
      console.log('🔍 DEBUG: Strategy dropdown element in DOM:', !!dropdownElement);
      if (dropdownElement) {
        const computedStyles = window.getComputedStyle(dropdownElement);
        console.log('🔍 DEBUG: Strategy dropdown computed styles:', {
          position: computedStyles.position,
          zIndex: computedStyles.zIndex,
          opacity: computedStyles.opacity,
          visibility: computedStyles.visibility,
          display: computedStyles.display,
          backgroundColor: computedStyles.backgroundColor,
          transform: computedStyles.transform,
          filter: computedStyles.filter
        });
        
        const rect = dropdownElement.getBoundingClientRect();
        console.log('🔍 DEBUG: Strategy dropdown position:', {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      }
    }, 100);
  }, [strategyDropdownOpen]);

  const handleSideDropdownToggle = useCallback(() => {
    console.log('🔍 DEBUG: Side dropdown toggle clicked');
    console.log('🔍 DEBUG: Current state:', sideDropdownOpen);
    const newState = !sideDropdownOpen;
    setSideDropdownOpen(newState);
    console.log('🔍 DEBUG: New state:', newState);
    
    // Log DOM element after state change
    setTimeout(() => {
      const dropdownElement = document.querySelector('[data-testid="side-dropdown-menu"]');
      console.log('🔍 DEBUG: Side dropdown element in DOM:', !!dropdownElement);
      if (dropdownElement) {
        const computedStyles = window.getComputedStyle(dropdownElement);
        console.log('🔍 DEBUG: Side dropdown computed styles:', {
          position: computedStyles.position,
          zIndex: computedStyles.zIndex,
          opacity: computedStyles.opacity,
          visibility: computedStyles.visibility,
          display: computedStyles.display,
          backgroundColor: computedStyles.backgroundColor,
          transform: computedStyles.transform,
          filter: computedStyles.filter
        });
        
        const rect = dropdownElement.getBoundingClientRect();
        console.log('🔍 DEBUG: Side dropdown position:', {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      }
    }, 100);
  }, [sideDropdownOpen]);

  const handleEmotionDropdownToggle = useCallback(() => {
    console.log('🔍 DEBUG: Emotion dropdown toggle clicked');
    console.log('🔍 DEBUG: Current state:', emotionDropdownOpen);
    const newState = !emotionDropdownOpen;
    setEmotionDropdownOpen(newState);
    console.log('🔍 DEBUG: New state:', newState);
    
    // Log DOM element after state change
    setTimeout(() => {
      const dropdownElement = document.querySelector('[data-testid="emotion-dropdown-menu"]');
      console.log('🔍 DEBUG: Emotion dropdown element in DOM:', !!dropdownElement);
      if (dropdownElement) {
        const computedStyles = window.getComputedStyle(dropdownElement);
        console.log('🔍 DEBUG: Emotion dropdown computed styles:', {
          position: computedStyles.position,
          zIndex: computedStyles.zIndex,
          opacity: computedStyles.opacity,
          visibility: computedStyles.visibility,
          display: computedStyles.display,
          backgroundColor: computedStyles.backgroundColor,
          transform: computedStyles.transform,
          filter: computedStyles.filter
        });
        
        const rect = dropdownElement.getBoundingClientRect();
        console.log('🔍 DEBUG: Emotion dropdown position:', {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      }
    }, 100);
  }, [emotionDropdownOpen]);

  // Handle mount for animations
  useEffect(() => {
    setMounted(true);
    console.log('🔍 DEBUG: Component mounted');
  }, []);

  // Load strategies from Supabase
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('strategies')
            .select('id, name')
            .eq('user_id', user.id);
          
          if (!error && data) {
            setStrategies(data);
          }
        }
      } catch (error) {
        console.error('Error loading strategies:', error);
      }
    };
    
    loadStrategies();
  }, []);

  // Add default test strategies if no strategies exist
  useEffect(() => {
    if (strategies.length === 0) {
      // Add test strategies for testing purposes
      const testStrategies: Strategy[] = [
        { id: 'test-strategy-1', name: 'Test Strategy 1 - Momentum' },
        { id: 'test-strategy-2', name: 'Test Strategy 2 - Mean Reversion' },
        { id: 'test-strategy-3', name: 'Test Strategy 3 - Breakout' }
      ];
      setStrategies(testStrategies);
    }
  }, [strategies.length]);

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside all dropdown containers
      const strategyDropdown = target.closest('[data-testid="strategy-dropdown"]');
      const strategyMenu = target.closest('[data-testid="strategy-dropdown-menu"]');
      const sideDropdown = target.closest('[data-testid="side-dropdown"]');
      const sideMenu = target.closest('[data-testid="side-dropdown-menu"]');
      const emotionDropdown = target.closest('[data-testid="emotion-dropdown"]');
      const emotionMenu = target.closest('[data-testid="emotion-dropdown-menu"]');
      
      // If click is not on any dropdown element, close all dropdowns
      if (!strategyDropdown && !strategyMenu && !sideDropdown && !sideMenu && !emotionDropdown && !emotionMenu) {
        console.log('🔍 DEBUG: Click outside detected, closing all dropdowns');
        setStrategyDropdownOpen(false);
        setSideDropdownOpen(false);
        setEmotionDropdownOpen(false);
      }
    };

    // Add event listener when any dropdown is open
    if (strategyDropdownOpen || sideDropdownOpen || emotionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [strategyDropdownOpen, sideDropdownOpen, emotionDropdownOpen]);

  // Mouse tracking for spotlight effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlightRef.current) return;
    
    const rect = spotlightRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  }, []);

  // Toast notification system
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  // Remove toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addToast('Please log in to save trades', 'error');
        return;
      }

      // Validate required fields
      const selectedMarkets = Object.keys(form.market).filter(k => form.market[k as keyof typeof form.market]);
      if (selectedMarkets.length === 0) {
        addToast('Please select at least one market type', 'error');
        return;
      }

      if (!form.symbol.trim()) {
        addToast('Please enter a symbol', 'error');
        return;
      }

      if (!form.quantity) {
        addToast('Please enter a quantity', 'error');
        return;
      }

      // Prepare market string
      const marketString = selectedMarkets.join(', ') || null;

      // Insert trade into database
      const { error } = await supabase.from('trades').insert({
        user_id: user.id,
        market: marketString,
        symbol: form.symbol.trim().toUpperCase(),
        strategy_id: form.strategy_id || null,
        trade_date: form.date,
        side: form.side,
        quantity: parseFloat(form.quantity) || null,
        stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
        take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
        pnl: form.pnl ? parseFloat(form.pnl) : null,
        entry_time: form.entry_time || null,
        exit_time: form.exit_time || null,
        emotional_state: form.emotional_state,
      });

      if (error) {
        console.error('Error saving trade:', error);
        addToast('Failed to save trade: ' + error.message, 'error');
      } else {
        addToast('Trade saved successfully!', 'success');
        
        // Reset form after successful submission
        setTimeout(() => {
          setForm({
            market: { stock: false, crypto: false, forex: false, futures: false },
            symbol: '',
            strategy_id: '',
            date: new Date().toISOString().split('T')[0] || '',
            side: 'Buy',
            quantity: '',
            stop_loss: '',
            take_profit: '',
            pnl: '',
            entry_time: '',
            exit_time: '',
            emotional_state: 'Neutral',
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      addToast('An unexpected error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle market type toggle - ensure only one can be selected
  const toggleMarket = (marketType: keyof FormState['market']) => {
    setForm(prev => {
      const isCurrentlySelected = prev.market[marketType];
      
      // If clicking the already selected market, deselect it
      if (isCurrentlySelected) {
        return {
          ...prev,
          market: {
            stock: false,
            crypto: false,
            forex: false,
            futures: false
          }
        };
      }
      
      // Otherwise, select this market and deselect all others
      return {
        ...prev,
        market: {
          stock: marketType === 'stock',
          crypto: marketType === 'crypto',
          forex: marketType === 'forex',
          futures: marketType === 'futures'
        }
      };
    });
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <UnifiedLayout>
      <div className="min-h-screen p-6 relative">
        {/* Toast Notifications - Highest z-index */}
        <div className="fixed top-4 right-4 z-[100] space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`px-6 py-3 rounded-lg shadow-lg backdrop-blur-md border transition-all duration-300 transform ${
                toast.type === 'success'
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : toast.type === 'error'
                  ? 'bg-red-500/20 border-red-500/50 text-red-300'
                  : 'bg-blue-500/20 border-blue-500/50 text-blue-300'
              }`}
              onClick={() => removeToast(toast.id)}
            >
              <div className="flex items-center justify-between">
                <span>{toast.message}</span>
                <button className="ml-4 text-white/50 hover:text-white">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto relative z-1">
          {/* Page Title with Text Reveal Animation */}
          <div className={`text-center mb-8 ${mounted ? 'text-reveal-animation' : 'opacity-0'}`}>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold-dim)] bg-clip-text text-transparent">
              Log New Trade
            </h1>
            <p className="text-gray-400 text-lg">Record your trading activity with precision</p>
          </div>

          {/* Spotlight Wrapper Card */}
          <div
            ref={spotlightRef}
            className="spotlight-wrapper relative rounded-2xl border border-[rgba(197,160,101,0.2)] bg-[rgba(18,18,18,0.4)] backdrop-blur-md overflow-hidden"
            style={{
              '--mouse-x': `${mousePosition.x}%`,
              '--mouse-y': `${mousePosition.y}%`,
              zIndex: '1',
              isolation: 'isolate',
              transform: 'translateZ(0)',
              position: 'relative'
            } as React.CSSProperties}
          >
            {/* Spotlight Effect */}
            <div
              className="spotlight-effect absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(800px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(197, 160, 101, 0.08) 0%, rgba(197, 160, 101, 0.04) 20%, transparent 50%)`
              }}
            />

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="relative p-8 space-y-8" style={{ zIndex: '1', isolation: 'isolate' }}>
              {/* Market Context Section */}
              <div className={`space-y-6 ${mounted ? 'scroll-item scroll-item-visible' : 'scroll-item'}`} style={{ pointerEvents: 'auto' }}>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-3 text-[var(--gold)]">trending_up</span>
                  Market Context
                </h2>
                
                {/* Market Type Buttons */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Market Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: 'stock' as keyof FormState['market'], label: 'Stock', icon: 'show_chart' },
                      { key: 'crypto' as keyof FormState['market'], label: 'Crypto', icon: 'currency_bitcoin' },
                      { key: 'forex' as keyof FormState['market'], label: 'Forex', icon: 'currency_exchange' },
                      { key: 'futures' as keyof FormState['market'], label: 'Futures', icon: 'timeline' }
                    ].map(({ key, label, icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleMarket(key)}
                        className={`px-4 py-3 rounded-lg border transition-all duration-300 flex items-center justify-center gap-2 ${
                          form.market[key]
                            ? 'bg-[var(--gold)]/20 border-[var(--gold)] text-[var(--gold)] shadow-[0_0_15px_rgba(197,160,101,0.4)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-[var(--gold)]/50 hover:text-[var(--gold)]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symbol Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">search</span>
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={form.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value)}
                      placeholder="e.g., AAPL, BTCUSD"
                      className="input-dark w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white placeholder-gray-500 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/20 transition-all duration-300"
                      required
                    />
                  </div>

                  {/* Strategy Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">strategy</span>
                      Strategy
                    </label>
                    <div className="relative" style={{ isolation: 'isolate' }}>
                      <button
                        type="button"
                        data-testid="strategy-dropdown"
                        onClick={handleStrategyDropdownToggle}
                        className="w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white text-left flex items-center justify-between hover:border-[var(--gold)] transition-all duration-300"
                      >
                        <span>{form.strategy_id ? strategies.find(s => s.id === form.strategy_id)?.name || 'Select Strategy' : 'Select Strategy'}</span>
                        <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: strategyDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          expand_more
                        </span>
                      </button>
                     
                      {strategyDropdownOpen && (
                        <div
                          ref={(el) => {
                            if (el && strategyDropdownOpen) {
                              const button = document.querySelector('[data-testid="strategy-dropdown"]');
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                el.style.width = `${rect.width}px`;
                                el.style.left = `${rect.left}px`;
                                el.style.top = `${rect.bottom + 8}px`;
                                console.log('🔍 DEBUG: Strategy dropdown positioned at:', {
                                  left: rect.left,
                                  top: rect.bottom + 8,
                                  width: rect.width
                                });
                              }
                            }
                          }}
                          data-testid="strategy-dropdown-menu"
                          className="fixed z-[9999] max-h-60 overflow-y-auto rounded-lg shadow-2xl border border-[rgba(197,160,101,0.5)] bg-[#0A0A0A] custom-scrollbar"
                          style={{
                            backgroundColor: '#0A0A0A',
                            background: 'linear-gradient(135deg, #0A0A0A 0%, #121212 100%)'
                          }}
                        >
                          <div
                            className="px-4 py-3 cursor-pointer hover:bg-[rgba(197,160,101,0.1)] text-gray-400"
                            onClick={() => {
                              console.log('🔍 DEBUG: Strategy "No Strategy" clicked');
                              handleInputChange('strategy_id', '');
                              setStrategyDropdownOpen(false);
                            }}
                          >
                            No Strategy
                          </div>
                          {strategies.map(strategy => (
                            <div
                              key={strategy.id}
                              data-testid={`strategy-option-${strategy.id}`}
                              className="px-4 py-3 cursor-pointer hover:bg-[rgba(197,160,101,0.1)] text-white"
                              onClick={() => {
                                console.log('🔍 DEBUG: Strategy selected:', strategy.name);
                                handleInputChange('strategy_id', strategy.id);
                                setStrategyDropdownOpen(false);
                              }}
                            >
                              {strategy.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Details Section */}
              <div className={`space-y-6 ${mounted ? 'scroll-item scroll-item-visible' : 'scroll-item'}`} style={{ animationDelay: '0.1s', pointerEvents: 'auto' }}>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-3 text-[var(--gold)]">swap_horiz</span>
                  Execution Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Side Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">call_made</span>
                      Side
                    </label>
                    <div className="relative" style={{ isolation: 'isolate' }}>
                      <button
                        type="button"
                        data-testid="side-dropdown"
                        onClick={handleSideDropdownToggle}
                        className="w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white text-left flex items-center justify-between hover:border-[var(--gold)] transition-all duration-300"
                      >
                        <span className="flex items-center gap-2">
                          <span className={`material-symbols-outlined ${form.side === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                            {form.side === 'Buy' ? 'trending_up' : 'trending_down'}
                          </span>
                          {form.side}
                        </span>
                        <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: sideDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          expand_more
                        </span>
                      </button>
                     
                      {sideDropdownOpen && (
                        <div
                          ref={(el) => {
                            if (el && sideDropdownOpen) {
                              const button = document.querySelector('[data-testid="side-dropdown"]');
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                el.style.width = `${rect.width}px`;
                                el.style.left = `${rect.left}px`;
                                el.style.top = `${rect.bottom + 8}px`;
                                console.log('🔍 DEBUG: Side dropdown positioned at:', {
                                  left: rect.left,
                                  top: rect.bottom + 8,
                                  width: rect.width
                                });
                              }
                            }
                          }}
                          data-testid="side-dropdown-menu"
                          className="fixed z-[9999] max-h-60 overflow-y-auto rounded-lg shadow-2xl border border-[rgba(197,160,101,0.5)] bg-[#0A0A0A] custom-scrollbar"
                          style={{
                            backgroundColor: '#0A0A0A',
                            background: 'linear-gradient(135deg, #0A0A0A 0%, #121212 100%)'
                          }}
                        >
                          {sideOptions.map(side => (
                            <div
                              key={side}
                              className="px-4 py-3 cursor-pointer hover:bg-[rgba(197,160,101,0.1)] text-white flex items-center gap-2"
                              onClick={() => {
                                console.log('🔍 DEBUG: Side selected:', side);
                                handleInputChange('side', side);
                                setSideDropdownOpen(false);
                              }}
                            >
                              <span className={`material-symbols-outlined ${side === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                                {side === 'Buy' ? 'trending_up' : 'trending_down'}
                              </span>
                              {side}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">inventory_2</span>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="input-dark w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white placeholder-gray-500 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/20 transition-all duration-300"
                      required
                    />
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">calendar_today</span>
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="input-date-time w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white placeholder-gray-500 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/20 transition-all duration-300"
                      required
                    />
                  </div>

                  {/* Entry Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">schedule</span>
                      Entry Time
                    </label>
                    <input
                      type="time"
                      value={form.entry_time}
                      onChange={(e) => handleInputChange('entry_time', e.target.value)}
                      className="input-date-time w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white placeholder-gray-500 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/20 transition-all duration-300"
                    />
                  </div>

                  {/* Exit Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">schedule</span>
                      Exit Time
                    </label>
                    <input
                      type="time"
                      value={form.exit_time}
                      onChange={(e) => handleInputChange('exit_time', e.target.value)}
                      className="input-date-time w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white placeholder-gray-500 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/20 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Risk & Outcome Section */}
              <div className={`space-y-6 ${mounted ? 'scroll-item scroll-item-visible' : 'scroll-item'}`} style={{ animationDelay: '0.2s', pointerEvents: 'auto' }}>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-3 text-[var(--gold)]">analytics</span>
                  Risk & Outcome
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Stop Loss */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">trending_down</span>
                      Stop Loss
                    </label>
                    <input
                      type="number"
                      value={form.stop_loss}
                      onChange={(e) => handleInputChange('stop_loss', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="input-dark w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white placeholder-gray-500 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/20 transition-all duration-300"
                    />
                  </div>

                  {/* Take Profit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">trending_up</span>
                      Take Profit
                    </label>
                    <input
                      type="number"
                      value={form.take_profit}
                      onChange={(e) => handleInputChange('take_profit', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="input-dark w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white placeholder-gray-500 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/20 transition-all duration-300"
                    />
                  </div>

                  {/* PnL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">payments</span>
                      PnL
                    </label>
                    <input
                      type="number"
                      value={form.pnl}
                      onChange={(e) => handleInputChange('pnl', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className={`input-dark w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        form.pnl && parseFloat(form.pnl) > 0
                          ? 'border-green-500/50 bg-green-500/10 text-green-300'
                          : form.pnl && parseFloat(form.pnl) < 0
                          ? 'border-red-500/50 bg-red-500/10 text-red-300'
                          : 'border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white'
                      } placeholder-gray-500 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/20`}
                    />
                  </div>

                  {/* Emotional State Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="material-symbols-outlined text-sm mr-2 align-middle">mood</span>
                      Emotional State
                    </label>
                    <div className="relative" style={{ isolation: 'isolate' }}>
                      <button
                        type="button"
                        data-testid="emotion-dropdown"
                        onClick={handleEmotionDropdownToggle}
                        className="w-full px-4 py-3 rounded-lg border border-[rgba(197,160,101,0.3)] bg-[var(--surface)] text-white text-left flex items-center justify-between hover:border-[var(--gold)] transition-all duration-300"
                      >
                        <span>{form.emotional_state}</span>
                        <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: emotionDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          expand_more
                        </span>
                      </button>
                     
                      {emotionDropdownOpen && (
                        <div
                          ref={(el) => {
                            if (el && emotionDropdownOpen) {
                              const button = document.querySelector('[data-testid="emotion-dropdown"]');
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                el.style.width = `${rect.width}px`;
                                el.style.left = `${rect.left}px`;
                                el.style.top = `${rect.bottom + 8}px`;
                                console.log('🔍 DEBUG: Emotion dropdown positioned at:', {
                                  left: rect.left,
                                  top: rect.bottom + 8,
                                  width: rect.width
                                });
                              }
                            }
                          }}
                          data-testid="emotion-dropdown-menu"
                          className="fixed z-[9999] max-h-60 overflow-y-auto rounded-lg shadow-2xl border border-[rgba(197,160,101,0.5)] bg-[#0A0A0A] custom-scrollbar"
                          style={{
                            backgroundColor: '#0A0A0A',
                            background: 'linear-gradient(135deg, #0A0A0A 0%, #121212 100%)'
                          }}
                        >
                          {emotionOptions.map(emotion => (
                            <div
                              key={emotion}
                              className="px-4 py-3 cursor-pointer hover:bg-[rgba(197,160,101,0.1)] text-white"
                              onClick={() => {
                                console.log('🔍 DEBUG: Emotion selected:', emotion);
                                handleInputChange('emotional_state', emotion);
                                setEmotionDropdownOpen(false);
                              }}
                            >
                              {emotion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button with Border Beam Effect */}
              <div className={`pt-6 ${mounted ? 'scroll-item scroll-item-visible' : 'scroll-item'}`} style={{ animationDelay: '0.3s', pointerEvents: 'auto' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-beam w-full py-4 px-8 rounded-lg bg-[var(--surface)] border border-[rgba(197,160,101,0.3)] text-white font-semibold text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group z-10"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        <span>Saving Trade...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        <span>Save Trade</span>
                      </>
                    )}
                  </span>
                   
                  {/* Border beam effect */}
                  <div className="absolute inset-0 rounded-lg">
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" 
                         style={{ 
                           animation: 'border-beam-spin 3s linear infinite',
                           background: 'conic-gradient(from 0deg, transparent 0deg, var(--gold) 45deg, transparent 90deg, transparent 270deg, var(--gold) 315deg, transparent 360deg)'
                         }} />
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* No overlay needed - using click-outside handler instead */}
      </div>
    </UnifiedLayout>
  );
}