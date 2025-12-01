'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { validateUUID, sanitizeUUID } from '@/lib/uuid-validation';
import { StrategyStats, StrategyWithRules } from '@/lib/strategy-rules-engine';
import {
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import StrategyPerformanceModal from './StrategyPerformanceModal';
import StrategyDeletionDialog, { deleteStrategyOnly, deleteStrategyAndTrades } from './StrategyDeletionDialog';

interface Props {
  strategy: StrategyWithRules & { stats: StrategyStats | null };
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function EnhancedStrategyCard({ strategy, onDelete, onEdit }: Props) {
  // Validate strategy prop on component mount
  const [isValidStrategy, setIsValidStrategy] = useState(false);
  const [stats, setStats] = useState<StrategyStats | null>(null);
  const [hasRules, setHasRules] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  const [showModal, setShowModal] = useState(false);
  const [showDeletionDialog, setShowDeletionDialog] = useState(false);
  const [isDialogDeleting, setIsDialogDeleting] = useState(false);

  useEffect(() => {
    // Validate strategy object and ID
    if (!strategy || !strategy.id) {
      console.error('Invalid strategy object passed to EnhancedStrategyCard:', strategy);
      setIsValidStrategy(false);
      return;
    }

    try {
      const validatedStrategyId = validateUUID(strategy.id, 'strategy_id');
      setIsValidStrategy(true);
      setStats(strategy.stats);
      setHasRules(strategy.rules && strategy.rules.length > 0);
    } catch (error) {
      console.error('Invalid strategy ID in EnhancedStrategyCard:', error);
      setIsValidStrategy(false);
    }
  }, [strategy.id, strategy.stats, strategy.rules]);

  const handleNavigateToPerformance = () => {
    console.log('🔍 DEBUG: Navigating to performance page for strategy', strategy.name);
  };

  const handleDeleteClick = () => {
    if (!isValidStrategy) {
      alert('Cannot delete strategy: Invalid strategy data.');
      return;
    }
    setShowDeletionDialog(true);
  };

  const handleDialogConfirm = async (deleteTrades: boolean) => {
    if (!isValidStrategy) return;
    
    setIsDialogDeleting(true);
    
    try {
      let success = false;
      
      if (deleteTrades) {
        success = await deleteStrategyAndTrades(strategy.id);
      } else {
        success = await deleteStrategyOnly(strategy.id);
      }
      
      if (success) {
        setDeleteStatus('success');
        console.log('✅ [UI] Strategy deletion successful, updating UI...');
        
        // Call parent callback to trigger UI update
        onDelete?.();
        
        // Add a small delay to show success state before component unmounts
        setTimeout(() => {
          console.log('✅ [UI] Deletion animation complete');
        }, 500);
      } else {
        setDeleteStatus('error');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Exception in handleDialogConfirm:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        strategyId: strategy.id,
        timestamp: new Date().toISOString()
      });
      
      setDeleteStatus('error');
      setIsDeleting(false);
    } finally {
      setIsDialogDeleting(false);
      setShowDeletionDialog(false);
    }
  };

  const handleDialogClose = () => {
    if (!isDialogDeleting) {
      setShowDeletionDialog(false);
    }
  };

  // Keep the original handleDelete for backward compatibility
  const handleDelete = async () => {
    if (!isValidStrategy) {
      alert('Cannot delete strategy: Invalid strategy data.');
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${strategy.name}"? This action cannot be undone.`)) {
      const deleteStrategyWithRetry = async (currentRetryCount = 0): Promise<boolean> => {
        try {
          console.log(`🔍 [DEBUG] Starting strategy deletion process (attempt ${currentRetryCount + 1})...`);
          
          // Get current session to ensure permission check
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          console.log('🔍 [DEBUG] Session check result:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            sessionError: sessionError?.message || 'No session error',
            timestamp: new Date().toISOString()
          });
          
          if (sessionError) {
            console.error('❌ [DEBUG] Session error:', sessionError);
            alert('Authentication error. Please try logging in again.');
            return false;
          }
          
          if (!session || !session.user) {
            console.error('❌ [DEBUG] No session or user found');
            alert('You must be logged in to delete strategies.');
            return false;
          }
          
          const user = session.user;

          console.log('🔍 [DEBUG] Preparing to delete strategy:', {
            strategyId: strategy.id,
            strategyName: strategy.name,
            userId: user.id,
            timestamp: new Date().toISOString()
          });

          // Validate UUIDs before database operation
          const validatedStrategyId = validateUUID(strategy.id, 'strategy_id');
          const validatedUserId = validateUUID(user.id, 'user_id');
          
          console.log('🔍 [DEBUG] UUIDs validated, executing delete operation...', {
            validatedStrategyId,
            validatedUserId
          });
          
          console.log('🔍 [DEBUG] Executing delete operation with enhanced retry logic...');
          
          // Add retry logic with exponential backoff
          let retryCount = currentRetryCount;
          let lastError: any = null;
          
          while (retryCount < 3) {
            try {
              const { error } = await supabase
                .from('strategies')
                .delete()
                .eq('id', validatedStrategyId)
                .eq('user_id', validatedUserId);
              
              if (error) {
                lastError = error;
                console.log(`🔍 [DEBUG] Delete attempt ${retryCount + 1} failed:`, {
                  hasError: !!error,
                  errorMessage: error?.message || 'No error',
                  errorCode: error?.code || 'No code',
                  timestamp: new Date().toISOString()
                });
                
                // Check if we should retry
                if (error.message?.includes('Failed to fetch') ||
                    error.message?.includes('fetch') ||
                    error.message?.includes('network') ||
                    !error.message) {
                  retryCount++;
                  if (retryCount < 3) {
                    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                    console.log(`🔄 [DEBUG] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                  }
                }
                break; // Don't retry for non-network errors
              } else {
                console.log('✅ [DEBUG] Delete operation completed successfully:', {
                  strategyId: validatedStrategyId,
                  timestamp: new Date().toISOString()
                });
                lastError = null;
                break;
              }
            } catch (catchError) {
              lastError = catchError;
              console.log(`🔍 [DEBUG] Delete attempt ${retryCount + 1} exception:`, catchError);
              retryCount++;
              if (retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`🔄 [DEBUG] Retrying after exception in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }
          
          const error = lastError;

          if (error) {
            // Enhanced error logging and specific error messages
            console.error('❌ [DEBUG] Strategy deletion error:', {
              error: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              strategyId: strategy.id,
              userId: user.id,
              timestamp: new Date().toISOString()
            });

            // Check for specific error types
            if (error.code === 'PGRST116') {
              console.log('🔍 [DEBUG] Strategy not found error (PGRST116)');
              alert('Strategy not found. It may have already been deleted.');
              return false;
            } else if (error.code === '42501') {
              console.log('🔍 [DEBUG] Permission denied error (42501)');
              alert('You do not have permission to delete this strategy.');
              return false;
            } else if (error.message.includes('relation does not exist') ||
                       error.message.includes('does not exist') ||
                       error.message.includes('invalid input syntax for type uuid') ||
                       error.message.includes('undefined') ||
                       error.message.includes('information_schema.columns')) {
              console.error('🚨 [DEBUG] SCHEMA CACHE ISSUE DETECTED: Database schema reference issue in strategy delete', {
                error: error.message,
                operation: 'strategy delete',
                errorCode: error.code,
                details: error.details,
                hint: error.hint,
                timestamp: new Date().toISOString()
              });
              alert('Database schema issue detected. Please try refreshing the page or contact support.');
              return false;
            } else if (error.message.includes('Failed to fetch') ||
                       error.message.includes('fetch') ||
                       error.message.includes('network') ||
                       !error.message) {
              console.error('🚨 [DEBUG] NETWORK ISSUE DETECTED: Possible race condition or network error', {
                error: error.message || 'No error message - likely network issue',
                code: error.code || 'No error code',
                details: error.details || 'No error details',
                operation: 'strategy delete',
                retryCount
              });
              
              // Retry logic for network errors
              if (retryCount < 2) {
                console.log(`🔄 [DEBUG] Retrying strategy deletion in 1 second... (attempt ${retryCount + 2})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return await deleteStrategyWithRetry(retryCount + 1);
              } else {
                alert('Network error occurred while deleting strategy after multiple attempts. Please refresh the page and try again.');
                return false;
              }
            } else {
              console.log('🔍 [DEBUG] Generic database error:', error.message);
              alert(`Error deleting strategy: ${error.message}. Please try again or contact support if the issue persists.`);
              return false;
            }
          } else {
            console.log('✅ [DEBUG] Strategy deleted successfully:', {
              strategyId: strategy.id,
              strategyName: strategy.name,
              timestamp: new Date().toISOString()
            });
            return true;
          }
        } catch (error) {
          console.error('❌ [DEBUG] Exception in deleteStrategyWithRetry:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            strategyId: strategy.id,
            timestamp: new Date().toISOString()
          });
          
          // Retry for unexpected exceptions as well
          if (currentRetryCount < 2) {
            console.log(`🔄 [DEBUG] Retrying strategy deletion after exception... (attempt ${currentRetryCount + 2})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await deleteStrategyWithRetry(currentRetryCount + 1);
          } else {
            alert('An unexpected error occurred while deleting the strategy after multiple attempts. Please try again.');
            return false;
          }
        }
      };

      // Execute the deletion with retry logic
      setDeleteStatus('deleting');
      setIsDeleting(true);
      
      const success = await deleteStrategyWithRetry();
      if (success) {
        setDeleteStatus('success');
        console.log('✅ [UI] Strategy deletion successful, updating UI...');
        
        // Call parent callback to trigger UI update
        onDelete?.();
        
        // Add a small delay to show success state before component unmounts
        setTimeout(() => {
          console.log('✅ [UI] Deletion animation complete');
        }, 500);
      } else {
        setDeleteStatus('error');
        setIsDeleting(false);
      }
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatRatio = (value: number) => value.toFixed(2);

  // Sanitize strategy ID for navigation link
  const sanitizedStrategyId = isValidStrategy ? sanitizeUUID(strategy.id) : null;
  const performanceHref = sanitizedStrategyId ? `/strategies/performance/${sanitizedStrategyId}` : '#';

  if (!isValidStrategy) {
    return (
      <div className="p-4 sm:p-6 relative h-[350px] sm:h-[400px] lg:h-[450px] flex flex-col overflow-hidden" style={{
        borderRadius: '12px',
        background: 'var(--soft-graphite)',
        border: '0.8px solid rgba(184, 155, 94, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center" style={{ color: 'var(--rust-red)' }}>
            <h3 className="text-lg font-bold mb-2" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--warm-off-white)' }}>Invalid Strategy</h3>
            <p className="text-sm" style={{ fontSize: '14px', color: 'var(--warm-off-white)' }}>This strategy card contains invalid data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-6 relative transition-all duration-300 ${
        isDeleting
          ? 'opacity-50 scale-95 cursor-not-allowed'
          : 'hover:scale-[1.02] hover:shadow-2xl cursor-pointer'
      } h-[350px] sm:h-[400px] lg:h-[450px] flex flex-col overflow-hidden`}
      style={{
        borderRadius: '12px',
        background: 'var(--soft-graphite)',
        border: '0.8px solid rgba(184, 155, 94, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
      onClick={!isDeleting ? handleNavigateToPerformance : undefined}
    >
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            console.log('🔍 [DIAGNOSTIC] Edit button clicked, stopping propagation');
            e.stopPropagation();
            e.preventDefault();
            console.log('🔍 [DIAGNOSTIC] Event propagation stopped, calling onEdit');
            onEdit?.();
          }}
          className="p-2 rounded-full transition-colors duration-200 hover:bg-[rgba(79,91,74,0.2)]"
          style={{ color: 'var(--warm-off-white)' }}
          title="Edit Strategy"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isDeleting && !isDialogDeleting) {
              handleDeleteClick();
            }
          }}
          disabled={isDeleting || isDialogDeleting}
          className={`p-2 rounded-full transition-colors duration-200 ${
            isDeleting || isDialogDeleting
              ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed animate-pulse'
              : 'hover:bg-[rgba(167,53,45,0.2)]'
          }`}
          style={{ color: isDeleting || isDialogDeleting ? '#9CA3AF' : 'var(--rust-red)' }}
          title={isDeleting || isDialogDeleting ? 'Deleting...' : 'Delete Strategy'}
        >
          {isDeleting || isDialogDeleting ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Strategy Header - Fixed height */}
      <div className="flex-shrink-0 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg sm:text-xl font-bold truncate max-w-[70%]" style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
            fontWeight: '700',
            color: 'var(--warm-off-white)'
          }}>{strategy.name}</h3>
          {strategy.is_active ? (
            <div className="px-2 py-1 text-xs rounded-full border flex-shrink-0" style={{
              background: 'rgba(79, 91, 74, 0.2)',
              color: 'var(--muted-olive)',
              borderColor: 'rgba(79, 91, 74, 0.3)'
            }}>
              Active
            </div>
          ) : (
            <div className="px-2 py-1 text-xs rounded-full border flex-shrink-0" style={{
              background: 'rgba(154, 154, 154, 0.2)',
              color: 'var(--muted-gray)',
              borderColor: 'rgba(154, 154, 154, 0.3)'
            }}>
              Inactive
            </div>
          )}
        </div>
        {strategy.description && (
          <p className="text-xs sm:text-sm line-clamp-2 leading-relaxed" style={{
            fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
            color: 'var(--warm-off-white)'
          }}>{strategy.description}</p>
        )}
      </div>

      {/* Key Statistics - Flexible height with scroll */}
      <div className="flex-1 overflow-hidden mb-3 sm:mb-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 h-full">
          <div className="text-center p-2 sm:p-3 rounded-lg border flex flex-col justify-center min-h-[60px]" style={{
            background: 'rgba(167, 53, 45, 0.1)',
            borderColor: 'rgba(167, 53, 45, 0.2)'
          }}>
            <div className="flex flex-col items-center gap-1">
              <Target className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--warm-off-white)' }} />
              <span className="text-xs font-medium truncate w-full" style={{ color: 'var(--warm-sand)' }}>Winrate:</span>
              <span className={`text-sm font-bold truncate w-full`} style={{
                color: stats && stats.winrate >= 50 ? 'var(--muted-olive)' : 'var(--rust-red)'
              }}>
                {stats ? formatPercentage(stats.winrate) : 'No Data'}
              </span>
            </div>
          </div>
          
          <div className="text-center p-2 sm:p-3 rounded-lg border flex flex-col justify-center min-h-[60px]" style={{
            background: 'rgba(184, 155, 94, 0.1)',
            borderColor: 'rgba(184, 155, 94, 0.2)'
          }}>
            <div className="flex flex-col items-center gap-1">
              <Target className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--warm-off-white)' }} />
              <span className="text-xs font-medium truncate w-full" style={{ color: 'var(--muted-olive)' }}>Profit Factor:</span>
              <span className={`text-sm font-bold truncate w-full`} style={{
                color: stats && stats.profit_factor >= 1.5 ? 'var(--muted-olive)' : 'var(--rust-red)'
              }}>
                {stats ? formatRatio(stats.profit_factor) : 'No Data'}
              </span>
            </div>
          </div>
          
          <div className="text-center p-2 sm:p-3 rounded-lg border flex flex-col justify-center min-h-[60px]" style={{
            background: 'rgba(79, 91, 74, 0.1)',
            borderColor: 'rgba(79, 91, 74, 0.2)'
          }}>
            <div className="flex flex-col items-center gap-1">
              {stats && stats.total_pnl >= 0 ? (
                <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--warm-off-white)' }} />
              ) : (
                <TrendingDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--rust-red)' }} />
              )}
              <span className="text-xs font-medium truncate w-full" style={{ color: 'var(--muted-olive)' }}>Net PnL:</span>
              <span className={`text-sm font-bold truncate w-full`} style={{
                color: stats && stats.total_pnl >= 0 ? 'var(--muted-olive)' : 'var(--rust-red)'
              }}>
                {stats ? formatCurrency(stats.total_pnl) : 'No Data'}
              </span>
            </div>
          </div>
          
          <div className="text-center p-2 sm:p-3 rounded-lg border flex flex-col justify-center min-h-[60px]" style={{
            background: 'rgba(214, 199, 178, 0.1)',
            borderColor: 'rgba(214, 199, 178, 0.2)'
          }}>
            <div className="flex flex-col items-center gap-1">
              <Target className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--dusty-gold)' }} />
              <span className="text-xs font-medium truncate w-full" style={{ color: 'var(--dusty-gold)' }}>Trades:</span>
              <span className="text-sm font-bold truncate w-full" style={{ color: 'var(--dusty-gold)' }}>
                {stats ? stats.total_trades : 'No Data'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Rules Display - Scrollable if needed */}
      {strategy.rules && strategy.rules.length > 0 && (
        <div className="flex-shrink-0 mb-3 sm:mb-4 max-h-[80px] overflow-hidden scrollbar-glass">
          <p className="text-xs font-medium mb-2" style={{ fontSize: '12px', fontWeight: '500', color: 'var(--warm-off-white)' }}>Custom Rules:</p>
          <div className="space-y-1">
            {strategy.rules.slice(0, 2).map((rule, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ fontSize: '12px', color: 'var(--warm-off-white)' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--dusty-gold)' }}></div>
                <span className="line-clamp-1">{rule}</span>
              </div>
            ))}
            {strategy.rules.length > 2 && (
              <div className="text-xs" style={{ fontSize: '12px', color: 'var(--dusty-gold)' }}>
                +{strategy.rules.length - 2} more rules
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Details Button - Fixed at bottom */}
      <div className="flex-shrink-0 mt-auto">
        <button
          onClick={() => {
            console.log('🔍 [DIAGNOSTIC] Performance modal button clicked');
            setShowModal(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm rounded-lg transition-colors duration-200 hover:bg-[rgba(184,155,94,0.1)]"
          style={{ color: 'var(--dusty-gold)' }}
        >
          <BarChart3 className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
          <span className="truncate">View Performance Details</span>
        </button>
      </div>

      {/* Strategy Performance Modal */}
      {showModal && (
        <StrategyPerformanceModal
          strategy={strategy}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Strategy Deletion Dialog */}
      {showDeletionDialog && (
        <StrategyDeletionDialog
          strategy={strategy}
          isOpen={showDeletionDialog}
          onClose={handleDialogClose}
          onConfirm={handleDialogConfirm}
          isLoading={isDialogDeleting}
        />
      )}
    </div>
  );
}