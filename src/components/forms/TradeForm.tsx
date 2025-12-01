'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import { validateTradeNumericFields } from '@/lib/validation';
import { validateUUID, sanitizeUUID } from '@/lib/uuid-validation';
import {
  StrategyWithRules
} from '@/lib/strategy-rules-engine';
import EmotionalStateInput from '@/components/ui/EmotionalStateInput';
import CustomDropdown from '@/components/ui/CustomDropdown';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Target,
  BarChart3,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Timer
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { logAuth, logStrategy, logError } from '@/lib/debug-logger';

interface FormState {
  market: 'stock' | 'crypto' | 'forex' | 'futures';
  symbol: string;
  strategy_id: string;
  date: string;
  side: string;
  quantity: string;
  entry_price: string;
  exit_price: string;
  pnl: string;
  entry_time: string;
  exit_time: string;
  emotional_state: string[];
  notes: string;
}

interface Props {
  onSuccess?: () => void;
}

export default function TradeForm({ onSuccess }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [strategies, setStrategies] = useState<StrategyWithRules[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyWithRules | null>(null);
  const [showStrategyRules, setShowStrategyRules] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Memoize initial form state to prevent recreation
  const initialFormState = useMemo(() => ({
    market: 'stock' as const,
    symbol: '',
    strategy_id: '',
    date: new Date().toISOString().split('T')[0],
    side: 'Buy',
    quantity: '',
    entry_price: '',
    exit_price: '',
    pnl: '',
    entry_time: '',
    exit_time: '',
    emotional_state: [],
    notes: '',
  }), []);

  const [form, setForm] = useState<FormState>(initialFormState);

  // Memoize market options to prevent recreation
  const marketOptions = useMemo(() =>
    ['stock', 'crypto', 'forex', 'futures'] as const,
    []
  );

  // Calculate trade duration
  const tradeDuration = useMemo(() => {
    if (!form.entry_time || !form.exit_time) {
      return null;
    }

    try {
      // Parse times
      const [entryHours, entryMinutes] = form.entry_time.split(':').map(Number);
      const [exitHours, exitMinutes] = form.exit_time.split(':').map(Number);
      
      // Create date objects for the same day
      const entryDate = new Date();
      entryDate.setHours(entryHours, entryMinutes, 0, 0);
      
      const exitDate = new Date();
      exitDate.setHours(exitHours, exitMinutes, 0, 0);
      
      // Calculate duration in milliseconds
      let durationMs = exitDate.getTime() - entryDate.getTime();
      
      // Handle overnight trades (if exit time is earlier than entry time)
      if (durationMs < 0) {
        // Add 24 hours to handle overnight trades
        durationMs += 24 * 60 * 60 * 1000;
      }
      
      // Convert to hours, minutes, seconds
      const totalSeconds = Math.floor(durationMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      // Format duration string
      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    } catch (error) {
      console.error('Error calculating trade duration:', error);
      return null;
    }
  }, [form.entry_time, form.exit_time]);

  // Calculate P&L for form validation
  const calculatedPnL = useMemo(() => {
    const entryPrice = parseFloat(form.entry_price) || 0;
    const exitPrice = parseFloat(form.exit_price) || 0;
    const quantity = parseFloat(form.quantity) || 0;
    
    if (entryPrice && exitPrice && quantity) {
      if (form.side === 'Buy') {
        return (exitPrice - entryPrice) * quantity;
      } else {
        return (entryPrice - exitPrice) * quantity;
      }
    }
    return parseFloat(form.pnl) || 0;
  }, [form.entry_price, form.exit_price, form.quantity, form.side, form.pnl]);

  // Optimize strategies loading
  useEffect(() => {
    let mounted = true;
    
    const loadStrategies = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && mounted) {
          logAuth('Loading strategies for trade form', { userId: user.id });
          
          try {
            // Validate user ID before querying strategies
            const validatedUserId = validateUUID(user.id, 'user_id');
            
            const { data, error } = await supabase
              .from('strategies')
              .select('*')
              .eq('user_id', validatedUserId)
              .eq('is_active', true)
              .limit(100); // Add limit to prevent large datasets
            
            if (error) {
              logError('Error loading strategies in TradeForm', {
                error: error.message,
                userId: user.id,
                details: error
              });
              
              // Check if this is a schema cache issue (generic detection)
              if (error.message.includes('relation does not exist') ||
                  error.message.includes('does not exist') ||
                  error.message.includes('invalid input syntax for type uuid') ||
                  error.message.includes('undefined')) {
                logError('SCHEMA CACHE ISSUE DETECTED: Database schema reference issue in TradeForm strategies query', {
                  error: error.message,
                  query: 'strategies table select with user_id and is_active filter'
                });
              }
            }
            
            if (mounted) {
              console.log('🔍 [DEBUG] Strategies loaded successfully:', {
                count: data?.length || 0,
                strategies: data?.map(s => ({ id: s.id, name: s.name, is_active: s.is_active }))
              });
              setStrategies(data ?? []);
              logStrategy('TradeForm strategies loaded', { count: data?.length || 0 });
            }
          } catch (validationError) {
            console.error('❌ [DEBUG] UUID validation error:', validationError);
            logError('UUID validation error in TradeForm', {
              error: validationError instanceof Error ? validationError.message : 'Unknown validation error',
              userId: user.id
            });
            if (mounted) {
              setStrategies([]);
            }
          }
        }
      } catch (error) {
        console.error('❌ [DEBUG] Exception in TradeForm loadStrategies:', error);
        logError('Exception in TradeForm loadStrategies', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        if (mounted) {
          setStrategies([]);
        }
      }
    };

    loadStrategies();

    return () => {
      mounted = false;
    };
  }, []);

  // Optimize form field updates
  const updateFormField = useCallback(<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateMarketField = useCallback((market: FormState['market']) => {
    setForm(prev => ({
      ...prev,
      market
    }));
  }, []);

  const updateEmotionalState = useCallback((emotions: string[] | { [key: string]: boolean }) => {
    // Convert to string array if it's an object
    const emotionArray = Array.isArray(emotions) ? emotions :
      Object.entries(emotions).filter(([_, isSelected]) => isSelected).map(([emotion]) => emotion);
    
    setForm(prev => ({
      ...prev,
      emotional_state: emotionArray
    }));
  }, []);

  const handleStrategyChange = useCallback((strategyId: string) => {
    console.log('🔄 [DEBUG] Strategy change triggered:', { strategyId, strategiesCount: strategies.length });
    
    // Validate strategy ID before processing
    const sanitizedStrategyId = sanitizeUUID(strategyId);
    if (!sanitizedStrategyId && strategyId !== '') {
      console.error('❌ [DEBUG] Invalid strategy ID selected:', strategyId);
      setSelectedStrategy(null);
      setShowStrategyRules(false);
      return;
    }
    
    // Handle "None" selection (empty string)
    if (strategyId === '' || !sanitizedStrategyId) {
      console.log('📝 [DEBUG] "None" strategy selected');
      setSelectedStrategy(null);
      setShowStrategyRules(false);
      return;
    }
    
    const strategy = strategies.find(s => s.id === sanitizedStrategyId);
    console.log('🔍 [DEBUG] Found strategy:', {
      found: !!strategy,
      strategyId: sanitizedStrategyId,
      strategyName: strategy?.name
    });
    
    setSelectedStrategy(strategy || null);
    setShowStrategyRules(false);
    
    // Reset when strategy changes
    if (strategy && strategy.rules) {
      console.log('📋 [DEBUG] Strategy rules available:', strategy.rules.length);
      // Strategy rules are displayed for reference
    }
  }, [strategies]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Validate numeric fields
      const validation = validateTradeNumericFields({
        quantity: form.quantity,
        entry_price: form.entry_price,
        exit_price: form.exit_price,
        pnl: form.pnl
      });

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        alert('Validation errors:\n' + validation.errors.join('\n'));
        return;
      }

      // Ensure a market is selected - default to 'stock' if somehow none is selected
      let market: string = form.market || 'stock';
      const emotions = form.emotional_state;

      // Validate UUIDs before database operation
      const validatedUserId = validateUUID(user.id, 'user_id');
      const sanitizedStrategyId = sanitizeUUID(form.strategy_id);
      
      // Insert trade first
      const { data: tradeData, error: tradeError } = await supabase.from('trades').insert({
        user_id: validatedUserId,
        market,
        symbol: form.symbol,
        strategy_id: sanitizedStrategyId,
        trade_date: form.date,
        side: form.side,
        quantity: validation.data.quantity,
        entry_price: validation.data.entry_price,
        exit_price: validation.data.exit_price,
        pnl: validation.data.pnl,
        entry_time: form.entry_time || null,
        exit_time: form.exit_time || null,
        emotional_state: emotions.length > 0 ? emotions : null,
        notes: form.notes || null,
      }).select('id').single();

      if (tradeError) {
        alert(tradeError.message);
        return;
      }

      // Trigger data refresh after successful trade submission
      const updateTimestamp = new Date().toISOString();
      const updateId = `trade_${tradeData.id}_${Date.now()}`;
      
      // 1. Dispatch custom event for components listening for trade updates
      const tradeUpdateEvent = new CustomEvent('tradeDataUpdated', {
        detail: {
          tradeId: tradeData.id,
          timestamp: updateTimestamp,
          action: 'trade_created',
          updateId: updateId,
          source: 'TradeForm'
        }
      });
      window.dispatchEvent(tradeUpdateEvent);

      // 2. Update localStorage with detailed information for components monitoring storage changes
      const updateData = {
        tradeId: tradeData.id,
        timestamp: updateTimestamp,
        action: 'trade_created',
        updateId: updateId,
        source: 'TradeForm'
      };
      localStorage.setItem('tradeDataLastUpdated', JSON.stringify(updateData));
      
      // 3. Also set a simple timestamp for backward compatibility
      localStorage.setItem('tradeDataLastUpdatedSimple', updateTimestamp);

      if (onSuccess) {
        onSuccess();
      } else {
        // Use router for better performance than window.location
        router.push('/dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSuccess, router, selectedStrategy]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <div className="bg-rust-red/10 border border-rust-red/30 rounded-lg p-4">
          <h4 className="text-rust-red font-semibold mb-2">Validation Errors:</h4>
          <ul className="text-rust-red/80 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Top Row - Market Selection and Trade Details */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Top Left - Market Selection */}
        <div className="glass p-4 lg:p-6 rounded-xl">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-warm-off-white">Market Selection</h3>
          <div className="space-y-3 lg:space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-warm-off-white">
                Market Type <span className="text-rust-red">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 lg:gap-3">
                {(['stock', 'crypto', 'forex', 'futures'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateMarketField(m)}
                    className={`flex items-center justify-center gap-2 p-3 lg:p-4 rounded-lg border transition-all whitespace-nowrap ${
                      form.market === m
                        ? 'bg-dusty-gold/10 border-dusty-gold/20 hover:bg-dusty-gold/20 text-dusty-gold shadow-lg shadow-dusty-gold/10'
                        : 'bg-soft-graphite border-white/10 hover:bg-warm-sand/10 text-warm-sand/70 hover:text-warm-sand'
                    }`}
                  >
                    <span className="text-sm lg:text-base font-medium capitalize">{m}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-warm-off-white">Symbol</label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                placeholder="e.g., AAPL, BTCUSD"
                className="w-full text-sm lg:text-base px-4 py-3 bg-soft-graphite border border-dusty-gold/30 rounded-lg text-warm-off-white placeholder-warm-sand/50 focus:outline-none focus:ring-2 focus:ring-dusty-gold/50 focus:border-dusty-gold/60 transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Top Right - Trade Details */}
        <div className="glass p-4 lg:p-6 rounded-xl">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-warm-off-white">Trade Details</h3>
          <div className="space-y-3 lg:space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-warm-off-white">Side</label>
              <div className="grid grid-cols-2 gap-2 lg:gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, side: 'Buy' })}
                  className={`flex items-center justify-center gap-2 p-3 lg:p-4 rounded-lg border transition-all whitespace-nowrap ${
                    form.side === 'Buy'
                      ? 'bg-muted-olive/10 border-muted-olive/20 hover:bg-muted-olive/20 text-muted-olive shadow-lg shadow-muted-olive/10'
                      : 'bg-soft-graphite border-white/10 hover:bg-warm-sand/10 text-warm-sand/70 hover:text-warm-sand'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="text-sm lg:text-base font-medium">Buy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, side: 'Sell' })}
                  className={`flex items-center justify-center gap-2 p-3 lg:p-4 rounded-lg border transition-all whitespace-nowrap ${
                    form.side === 'Sell'
                      ? 'bg-rust-red/10 border-rust-red/20 hover:bg-rust-red/20 text-rust-red shadow-lg shadow-rust-red/10'
                      : 'bg-soft-graphite border-white/10 hover:bg-warm-sand/10 text-warm-sand/70 hover:text-warm-sand'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="text-sm lg:text-base font-medium">Sell</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-warm-off-white">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0.00"
                className="w-full text-sm lg:text-base px-4 py-3 bg-soft-graphite border border-dusty-gold/30 rounded-lg text-warm-off-white placeholder-warm-sand/50 focus:outline-none focus:ring-2 focus:ring-dusty-gold/50 focus:border-dusty-gold/60 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Price Information Section */}
      <div className="glass p-4 lg:p-6 rounded-xl">
        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-warm-off-white">Price Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-warm-off-white">Entry Price</label>
            <input
              type="number"
              value={form.entry_price}
              onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
              placeholder="0.00"
              className="w-full text-sm lg:text-base px-4 py-3 bg-soft-graphite border border-dusty-gold/30 rounded-lg text-warm-off-white placeholder-warm-sand/50 focus:outline-none focus:ring-2 focus:ring-dusty-gold/50 focus:border-dusty-gold/60 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-warm-off-white">Exit Price</label>
            <input
              type="number"
              value={form.exit_price}
              onChange={(e) => setForm({ ...form, exit_price: e.target.value })}
              placeholder="0.00"
              className="w-full text-sm lg:text-base px-4 py-3 bg-soft-graphite border border-dusty-gold/30 rounded-lg text-warm-off-white placeholder-warm-sand/50 focus:outline-none focus:ring-2 focus:ring-dusty-gold/50 focus:border-dusty-gold/60 transition-all"
              required
            />
          </div>
        </div>
      </div>

      {/* Bottom Row - Time and Emotions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Bottom Left - Time and Emotions */}
        <div className="glass p-4 lg:p-6 rounded-xl">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-warm-off-white">Time & Emotions</h3>
          <div className="space-y-3 lg:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-warm-off-white">Entry Time</label>
                <input
                  type="time"
                  value={form.entry_time}
                  onChange={(e) => setForm({ ...form, entry_time: e.target.value })}
                  className="w-full text-sm lg:text-base px-4 py-3 bg-soft-graphite border border-dusty-gold/30 rounded-lg text-warm-off-white placeholder-warm-sand/50 focus:outline-none focus:ring-2 focus:ring-dusty-gold/50 focus:border-dusty-gold/60 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-warm-off-white">Exit Time</label>
                <input
                  type="time"
                  value={form.exit_time}
                  onChange={(e) => setForm({ ...form, exit_time: e.target.value })}
                  className="w-full text-sm lg:text-base px-4 py-3 bg-soft-graphite border border-dusty-gold/30 rounded-lg text-warm-off-white placeholder-warm-sand/50 focus:outline-none focus:ring-2 focus:ring-dusty-gold/50 focus:border-dusty-gold/60 transition-all"
                />
              </div>
            </div>
           
            {/* Trade Duration Display */}
            {tradeDuration && (
              <div className="bg-dusty-gold/10 border border-dusty-gold/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="w-4 h-4 text-dusty-gold" />
                  <span className="text-sm font-medium text-warm-off-white">Trade Duration</span>
                </div>
                <div className="text-lg font-bold text-dusty-gold">
                  {tradeDuration}
                </div>
              </div>
            )}
           
            <div>
              <label className="block text-sm font-medium mb-2 text-warm-off-white">Emotions Felt</label>
              <EmotionalStateInput
                value={form.emotional_state}
                onChange={updateEmotionalState}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Bottom Right - Additional Info */}
        <div className="glass p-4 lg:p-6 rounded-xl">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-warm-off-white">Additional Information</h3>
          <div className="space-y-3 lg:space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-warm-off-white">Strategy</label>
              <CustomDropdown
                value={form.strategy_id}
                onChange={(value) => {
                  console.log('🔄 [DEBUG] Strategy dropdown change:', {
                    oldValue: form.strategy_id,
                    newValue: value,
                    strategiesAvailable: strategies.length
                  });
                  setForm({ ...form, strategy_id: value });
                  handleStrategyChange(value);
                }}
                options={[
                  { value: '', label: 'None' },
                  ...strategies.map(strategy => ({
                    value: strategy.id,
                    label: strategy.name
                  }))
                ]}
                placeholder="Select a strategy"
                className="w-full text-sm lg:text-base"
                disabled={strategies.length === 0}
              />
              
              {/* Strategy Rules Display */}
              {selectedStrategy && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowStrategyRules(!showStrategyRules)}
                    className="flex items-center gap-2 text-sm text-dusty-gold hover:text-dusty-gold/80 transition-colors"
                  >
                    {showStrategyRules ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showStrategyRules ? 'Hide' : 'Show'} Strategy Rules
                  </button>
                   
                  {showStrategyRules && (
                    <div className="mt-3 p-3 bg-soft-graphite rounded-lg border border-dusty-gold/20">
                      <h4 className="text-sm font-semibold text-warm-off-white mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-dusty-gold" />
                        {selectedStrategy.name} Rules
                      </h4>
                       
                      {/* Custom Rules */}
                      {selectedStrategy.rules && selectedStrategy.rules.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-warm-sand/80">Strategy Rules:</h5>
                          <div className="space-y-2">
                            {selectedStrategy.rules.map((rule, index) => (
                              <div key={index} className="flex items-start space-x-3">
                                <div className="w-1.5 h-1.5 bg-dusty-gold rounded-full mt-1.5 flex-shrink-0"></div>
                                <label className="text-xs text-warm-sand leading-relaxed cursor-pointer hover:text-warm-off-white transition-colors flex-1">
                                  {rule}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                       
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-warm-off-white">P&L</label>
              <input
                type="number"
                value={form.pnl}
                onChange={(e) => setForm({ ...form, pnl: e.target.value })}
                placeholder="0.00"
                className="w-full text-sm lg:text-base px-4 py-3 bg-soft-graphite border border-dusty-gold/30 rounded-lg text-warm-off-white placeholder-warm-sand/50 focus:outline-none focus:ring-2 focus:ring-dusty-gold/50 focus:border-dusty-gold/60 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-warm-off-white">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full text-sm lg:text-base px-4 py-3 bg-soft-graphite border border-dusty-gold/30 rounded-lg text-warm-off-white focus:outline-none focus:ring-2 focus:ring-dusty-gold/50 focus:border-dusty-gold/60 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="glass p-4 lg:p-6 rounded-xl">
        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-warm-off-white">Notes</h3>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Add any additional notes about this trade..."
          className="w-full h-20 lg:h-24 resize-none text-sm lg:text-base px-4 py-3 bg-soft-graphite border border-dusty-gold/30 rounded-lg text-warm-off-white placeholder-warm-sand/50 focus:outline-none focus:ring-2 focus:ring-dusty-gold/50 focus:border-dusty-gold/60 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 lg:py-4 bg-gradient-to-r from-dusty-gold to-dusty-gold/80 text-soft-graphite rounded-xl hover:from-dusty-gold/90 hover:to-dusty-gold/70 font-semibold text-base lg:text-lg transition-all shadow-lg hover:shadow-dusty-gold/25 hover:backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Saving Trade...
          </>
        ) : (
          'Save Trade'
        )}
      </button>
    </form>
  );
}
