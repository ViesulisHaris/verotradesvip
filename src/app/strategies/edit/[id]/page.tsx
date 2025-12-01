'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import { validateUUID } from '@/lib/uuid-validation';
import Link from 'next/link';
import {
  Target,
  AlertCircle,
  Plus,
  X,
  Save,
  ArrowLeft
} from 'lucide-react';
import { logAuth, logStrategy, logError } from '@/lib/debug-logger';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  rules: string[] | null;
  winrate_min: number | null;
  winrate_max: number | null;
  profit_factor_min: number | null;
  net_pnl_min: number | null;
  net_pnl_max: number | null;
  max_drawdown_max: number | null;
  sharpe_ratio_min: number | null;
  avg_hold_period_min: number | null;
  avg_hold_period_max: number | null;
  is_active: boolean;
}

export default function EditStrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [customRules, setCustomRules] = useState<string[]>(['']);
  
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const strategyId = resolvedParams.id;

  useEffect(() => {
    loadStrategy();
  }, [strategyId]);

  const loadStrategy = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logAuth('No user authenticated for strategy edit', { strategyId: strategyId });
        router.push('/login');
        return;
      }

      logAuth('User attempting to edit strategy', { userId: user.id, strategyId: strategyId });

      // Validate UUIDs before database operation
      const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
      const validatedUserId = validateUUID(user.id, 'user_id');
      
      const { data: strategyData, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('id', validatedStrategyId)
        .eq('user_id', validatedUserId)
        .single();

      if (error) {
        // Enhanced error logging to distinguish between permission and database errors
        console.log('🔍 [DIAGNOSTIC] Raw error object received in edit:', error);
        console.log('🔍 [DIAGNOSTIC] Error type in edit:', typeof error);
        console.log('🔍 [DIAGNOSTIC] Error keys in edit:', error ? Object.keys(error) : 'error is null/undefined');
        
        const errorDetails = {
          error: error?.message || 'No error message available',
          code: error?.code || 'No error code available',
          details: error?.details || 'No error details available',
          hint: error?.hint || 'No error hint available',
          strategyId: strategyId,
          userId: user.id,
          timestamp: new Date().toISOString()
        };
        
        console.log('🔍 [DIAGNOSTIC] Processed errorDetails in edit:', errorDetails);
        
        // Only log if we have actual error content to prevent empty objects
        if (errorDetails.error !== 'No error message available' ||
            errorDetails.code !== 'No error code available' ||
            errorDetails.details !== 'No error details available') {
          logError('Strategy query error in edit', errorDetails);
        } else {
          console.warn('🔍 [DIAGNOSTIC] Suppressed empty error object logging in edit to prevent "{}" output');
        }
        
        // Additional logging to prevent empty error objects
        console.log('🔍 [DEBUG] Strategy query error in edit details:', {
          hasError: !!error,
          errorMessage: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorHint: error?.hint,
          errorObject: JSON.stringify(error, null, 2)
        });

        // Check for specific error types
        if (error.code === 'PGRST116') {
          // No rows returned - strategy doesn't exist
          logError('Strategy not found', { strategyId: strategyId, userId: user.id });
          alert('Strategy not found. It may have been deleted or the ID is incorrect.');
        } else if (error.code === '42501') {
          // Permission denied
          logError('Permission denied for strategy', { strategyId: strategyId, userId: user.id });
          alert('You do not have permission to edit this strategy.');
        } else if (error.message.includes('relation does not exist') ||
                   error.message.includes('does not exist') ||
                   error.message.includes('invalid input syntax for type uuid') ||
                   error.message.includes('undefined')) {
          // Schema cache issue
          logError('SCHEMA CACHE ISSUE DETECTED: Database schema reference issue in edit strategy query', {
            error: error.message,
            query: 'strategies table select with id and user_id filter'
          });
          alert('Database schema issue detected. Please try refreshing the page or contact support.');
        } else {
          // Generic database error
          logError('Database error in strategy edit', {
            error: error.message,
            strategyId: strategyId,
            userId: user.id
          });
          alert(`Database error: ${error.message}. Please try again or contact support if the issue persists.`);
        }
        router.push('/strategies');
        return;
      }

      if (!strategyData) {
        logError('No strategy data returned', {
          strategyId: strategyId,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        alert('Strategy not found. It may have been deleted.');
        router.push('/strategies');
        return;
      }
      
      logStrategy('Successfully loaded strategy for editing', { strategyId: strategyId, strategyName: strategyData.name });

      setStrategy(strategyData);
      
      // Populate form with existing data
      setName(strategyData.name);
      setDescription(strategyData.description || '');
      setIsActive(strategyData.is_active);
      setCustomRules(strategyData.rules && strategyData.rules.length > 0 ? strategyData.rules : ['']);
      
      
    } catch (error) {
      logError('Exception in loadStrategy', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        strategyId: strategyId,
        timestamp: new Date().toISOString()
      });
      alert('An unexpected error occurred while loading the strategy. Please try again.');
      router.push('/strategies');
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomRule = () => setCustomRules([...customRules, '']);
  const updateCustomRule = (i: number, v: string) => setCustomRules(customRules.map((r, j) => j === i ? v : r));
  const removeCustomRule = (i: number) => setCustomRules(customRules.filter((_, j) => j !== i));

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!name.trim()) {
      errors.push('Strategy name is required');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const cleanCustomRules = customRules.filter(r => r.trim());

      const strategyData: any = {
        name: name.trim(),
        description: description.trim() || null,
        rules: cleanCustomRules.length > 0 ? cleanCustomRules : null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };


      // Validate UUIDs before database operation
      const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
      const validatedUserId = validateUUID(user.id, 'user_id');
      
      const { error } = await supabase
        .from('strategies')
        .update(strategyData)
        .eq('id', validatedStrategyId)
        .eq('user_id', validatedUserId);

      if (error) {
        // Enhanced error logging for strategy updates
        logError('Strategy update error', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          strategyId: strategyId,
          timestamp: new Date().toISOString()
        });

        // Check for specific error types
        if (error.code === '42501') {
          alert('You do not have permission to update this strategy.');
        } else if (error.message.includes('relation does not exist') ||
                   error.message.includes('does not exist') ||
                   error.message.includes('invalid input syntax for type uuid') ||
                   error.message.includes('undefined')) {
          logError('SCHEMA CACHE ISSUE DETECTED: Database schema reference issue in strategy update', {
            error: error.message,
            operation: 'strategy update'
          });
          alert('Database schema issue detected. Please try refreshing the page or contact support.');
        } else {
          alert(`Error updating strategy: ${error.message}. Please try again or contact support if the issue persists.`);
        }
      } else {
        logStrategy('Successfully updated strategy', { strategyId: strategyId });
        router.push('/strategies');
      }
    } catch (error) {
      console.error('Error updating strategy:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Strategy Not Found</h2>
          <p className="text-white/60 mb-4">The strategy you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          <Link href="/strategies" className="text-blue-400 hover:text-blue-300">
            Back to Strategies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/strategies" className="text-white mb-4 inline-flex items-center gap-2 hover:text-blue-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Strategies
      </Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Edit Trading Strategy</h1>
        <p className="text-white/60">Update your trading strategy with performance rules and custom guidelines</p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="glass p-4 mb-6 border border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-red-400 font-semibold">Validation Errors</h3>
          </div>
          <ul className="text-red-300 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Strategy Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="metallic-input w-full"
                placeholder="e.g., London Breakout Strategy"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Status</label>
              <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg border border-blue-500/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span className="text-white">Active Strategy</span>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 text-white">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="metallic-input w-full h-20 resize-none"
              placeholder="Describe your trading strategy..."
            />
          </div>
        </div>


        {/* Custom Rules */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Custom Trading Rules
          </h2>
          <p className="text-white/60 text-sm mb-4">Define specific trading rules and guidelines</p>
          
          <div className="space-y-3">
            {customRules.map((rule, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => updateCustomRule(i, e.target.value)}
                  placeholder="e.g. Only trade during London session, Risk 1% per trade"
                  className="flex-1 metallic-input"
                />
                {customRules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCustomRule(i)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCustomRule}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom Rule
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/strategies"
            className="px-6 py-3 glass text-white rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Updating Strategy...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Update Strategy
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}