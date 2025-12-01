'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/supabase/client';
import { validateUUID } from '@/lib/uuid-validation';
import { StrategyWithRules, StrategyStats } from '@/lib/strategy-rules-engine';
import {
  X,
  AlertTriangle,
  Trash2,
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react';

interface StrategyDeletionDialogProps {
  strategy: StrategyWithRules & { stats: StrategyStats | null };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteTrades: boolean) => Promise<void>;
  isLoading?: boolean;
}

// Database helper functions
async function fetchAssociatedTradesCount(strategyId: string): Promise<number> {
  try {
    const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
    
    const { data, error } = await supabase
      .from('trades')
      .select('id')
      .eq('strategy_id', validatedStrategyId);
    
    if (error) {
      console.error('Error fetching associated trades count:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('Exception fetching associated trades count:', error);
    return 0;
  }
}

async function deleteStrategyOnly(strategyId: string): Promise<boolean> {
  try {
    const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
    
    // Get current session to ensure permission check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      console.error('Authentication error: No valid session found');
      return false;
    }
    
    const validatedUserId = validateUUID(session.user.id, 'user_id');
    
    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', validatedStrategyId)
      .eq('user_id', validatedUserId);
    
    if (error) {
      console.error('Error deleting strategy:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting strategy:', error);
    return false;
  }
}

async function deleteStrategyAndTrades(strategyId: string): Promise<boolean> {
  try {
    const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
    
    // Get current session to ensure permission check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      console.error('Authentication error: No valid session found');
      return false;
    }
    
    const validatedUserId = validateUUID(session.user.id, 'user_id');
    
    // First delete associated trades
    const { error: tradesError } = await supabase
      .from('trades')
      .delete()
      .eq('strategy_id', validatedStrategyId)
      .eq('user_id', validatedUserId);
    
    if (tradesError) {
      console.error('Error deleting associated trades:', tradesError);
      return false;
    }
    
    // Then delete the strategy
    const { error: strategyError } = await supabase
      .from('strategies')
      .delete()
      .eq('id', validatedStrategyId)
      .eq('user_id', validatedUserId);
    
    if (strategyError) {
      console.error('Error deleting strategy:', strategyError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting strategy and trades:', error);
    return false;
  }
}

export default function StrategyDeletionDialog({
  strategy,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: StrategyDeletionDialogProps) {
  const [associatedTradesCount, setAssociatedTradesCount] = useState<number>(0);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(false);
  const [deleteTrades, setDeleteTrades] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch associated trades count when dialog opens
  useEffect(() => {
    if (isOpen && strategy?.id) {
      setIsLoadingTrades(true);
      setError(null);
      
      fetchAssociatedTradesCount(strategy.id)
        .then(count => {
          setAssociatedTradesCount(count);
          setIsLoadingTrades(false);
        })
        .catch(err => {
          console.error('Failed to fetch trades count:', err);
          setError('Failed to fetch associated trades. Please try again.');
          setIsLoadingTrades(false);
        });
    }
  }, [isOpen, strategy?.id]);

  // Handle ESC key to close dialog
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      // Restore body scroll when modal closes
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, isDeleting]);

  // Handle confirmation
  const handleConfirm = useCallback(async () => {
    if (!strategy?.id || isDeleting) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm(deleteTrades);
      onClose();
    } catch (err) {
      console.error('Deletion failed:', err);
      setError('Deletion failed. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [strategy?.id, deleteTrades, isDeleting, onConfirm, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the dialog for accessibility
      const timer = setTimeout(() => {
        const dialogElement = document.getElementById('strategy-deletion-dialog');
        if (dialogElement) {
          dialogElement.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-[var(--deep-charcoal)]/70 backdrop-blur-sm flex items-center justify-center z-[999999] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="strategy-deletion-dialog"
        className="glass w-full max-w-md overflow-hidden rounded-xl shadow-2xl animate-scale-up"
        style={{
          borderRadius: '12px',
          background: 'var(--soft-graphite)',
          border: '0.8px solid rgba(184, 155, 94, 0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deletion-title"
        aria-describedby="deletion-description"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
              background: 'rgba(167, 53, 45, 0.2)',
              border: '0.8px solid rgba(167, 53, 45, 0.3)'
            }}>
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--rust-red)' }} />
              </div>
              <h2 id="deletion-title" className="text-xl font-bold" style={{ color: 'var(--warm-off-white)' }}>
              Delete Strategy
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Strategy Info */}
            <div className="p-4 rounded-lg border" style={{
              background: 'var(--soft-graphite)',
              border: '0.8px solid rgba(184, 155, 94, 0.3)',
              padding: '20px'
            }}>
              <h3 className="font-semibold mb-2 truncate" style={{ fontSize: '18px', fontWeight: '600', color: 'var(--warm-off-white)' }}>{strategy.name}</h3>
              {strategy.description && (
                <p className="text-sm line-clamp-2" style={{ fontSize: '14px', color: 'var(--warm-off-white)', opacity: 0.7 }}>{strategy.description}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm">
                {strategy.is_active ? (
                  <div className="px-2 py-1 text-xs rounded-full border" style={{
                    background: 'rgba(79, 91, 74, 0.2)',
                    color: 'var(--muted-olive)',
                    borderColor: 'rgba(79, 91, 74, 0.3)'
                  }}>
                    Active
                  </div>
                ) : (
                  <div className="px-2 py-1 text-xs rounded-full border" style={{
                    background: 'rgba(154, 154, 154, 0.2)',
                    color: 'var(--muted-gray)',
                    borderColor: 'rgba(154, 154, 154, 0.3)'
                  }}>
                    Inactive
                  </div>
                )}
                {strategy.stats && (
                  <div className="flex items-center gap-2 text-white/60">
                    <BarChart3 className="w-4 h-4" />
                    <span>{strategy.stats.total_trades} trades</span>
                  </div>
                )}
              </div>
            </div>

            {/* Associated Trades Info */}
            <div id="deletion-description" className="space-y-2">
              {isLoadingTrades ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-white/70">Checking associated trades...</span>
                </div>
              ) : (
                <>
                  {associatedTradesCount > 0 ? (
                    <div className="p-4 rounded-lg border" style={{
                      background: 'rgba(214, 199, 178, 0.1)',
                      border: '0.8px solid rgba(214, 199, 178, 0.3)',
                      padding: '20px'
                    }}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--warm-sand)' }} />
                        <div>
                          <p className="font-medium mb-1" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--warm-off-white)' }}>
                            This strategy is associated with <span className="text-yellow-400 font-bold">{associatedTradesCount}</span> trade{associatedTradesCount !== 1 ? 's' : ''}.
                          </p>
                          <p className="text-sm" style={{ fontSize: '14px', color: 'var(--warm-off-white)', opacity: 0.7 }}>
                            Choose whether you want to delete the trades along with the strategy or keep them.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border" style={{
                      background: 'rgba(214, 199, 178, 0.1)',
                      border: '0.8px solid rgba(214, 199, 178, 0.3)',
                      padding: '20px'
                    }}>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warm-sand)' }} />
                        <div>
                          <p className="font-medium mb-1" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--warm-off-white)' }}>
                            This strategy has no associated trades.
                          </p>
                          <p className="text-sm" style={{ fontSize: '14px', color: 'var(--warm-off-white)', opacity: 0.7 }}>
                            Only the strategy will be deleted.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg border" style={{
                background: 'rgba(167, 53, 45, 0.1)',
                border: '0.8px solid rgba(167, 53, 45, 0.3)',
                padding: '20px'
              }}>
                <p className="text-sm" style={{ fontSize: '14px', color: 'var(--rust-red)' }}>{error}</p>
              </div>
            )}

            {/* Deletion Options */}
            {associatedTradesCount > 0 && (
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer" style={{
                  background: 'var(--soft-graphite)',
                  border: '0.8px solid rgba(184, 155, 94, 0.3)',
                  padding: '20px'
                }}>
                  <input
                    type="radio"
                    name="deletion-option"
                    checked={deleteTrades}
                    onChange={() => setDeleteTrades(true)}
                    disabled={isDeleting}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Trash2 className="w-4 h-4" style={{ color: 'var(--rust-red)' }} />
                      <span className="font-medium text-white">Yes, delete trades</span>
                    </div>
                    <p className="text-sm" style={{ fontSize: '14px', color: 'var(--warm-off-white)', opacity: 0.6 }}>
                      Permanently delete the strategy and all {associatedTradesCount} associated trade{associatedTradesCount !== 1 ? 's' : ''}. This action cannot be undone.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer" style={{
                  background: 'var(--soft-graphite)',
                  border: '0.8px solid rgba(184, 155, 94, 0.3)',
                  padding: '20px'
                }}>
                  <input
                    type="radio"
                    name="deletion-option"
                    checked={!deleteTrades}
                    onChange={() => setDeleteTrades(false)}
                    disabled={isDeleting}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4" style={{ color: 'var(--muted-olive)' }} />
                      <span className="font-medium text-white">No, keep trades</span>
                    </div>
                    <p className="text-sm" style={{ fontSize: '14px', color: 'var(--warm-off-white)', opacity: 0.6 }}>
                      Delete only the strategy. The {associatedTradesCount} associated trade{associatedTradesCount !== 1 ? 's' : ''} will be kept but unlinked from this strategy.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium" style={{
              background: 'var(--soft-graphite)',
              border: '0.8px solid rgba(184, 155, 94, 0.3)',
              color: 'var(--warm-off-white)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || isLoadingTrades}
            className="flex-1 px-4 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2" style={{
              background: 'var(--rust-red)',
              border: '0.8px solid rgba(167, 53, 45, 0.3)',
              color: 'var(--warm-off-white)'
            }}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--warm-off-white)' }}></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" style={{ color: 'var(--warm-off-white)' }} />
                <span>Delete Strategy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Export the helper functions for use in other components
export { fetchAssociatedTradesCount, deleteStrategyOnly, deleteStrategyAndTrades };