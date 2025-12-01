'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StrategyStats, StrategyWithRules } from '@/lib/strategy-rules-engine';
import EnhancedStrategyCard from '@/components/ui/EnhancedStrategyCard';
import { validateUUID } from '@/lib/uuid-validation';

export default function TestStrategyPerformanceNavigation() {
  const [strategies, setStrategies] = useState<(StrategyWithRules & { stats: StrategyStats | null })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Get strategies
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (strategiesError || !strategiesData) {
        console.error('Error loading strategies:', strategiesError);
        return;
      }

      // Get stats for each strategy
      const strategiesWithStats = await Promise.all(
        strategiesData.map(async (strategy) => {
          const { data: statsData } = await supabase
            .from('strategy_stats')
            .select('*')
            .eq('strategy_id', strategy.id)
            .single();

          return {
            ...strategy,
            stats: statsData
          };
        })
      );

      setStrategies(strategiesWithStats);
    } catch (error) {
      console.error('Error loading strategies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    loadStrategies(); // Reload strategies after deletion
  };

  const handleEdit = (strategyId: string) => {
    try {
      const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
      window.location.href = `/strategies/edit/${validatedStrategyId}`;
    } catch (error) {
      console.error('Invalid strategy ID for navigation:', error);
      alert('Invalid strategy ID. Cannot navigate to edit page.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Strategy Performance Navigation Test</h1>
          <p className="text-white/70">Test the new strategy performance page navigation</p>
        </div>

        <div className="mb-6">
          <Link href="/strategies" className="text-blue-400 hover:text-blue-300 underline">
            ← Back to Strategies
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : strategies.length === 0 ? (
          <div className="glass p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">No Strategies Found</h2>
            <p className="text-white/60 mb-4">Create your first strategy to test the performance navigation.</p>
            <Link href="/strategies" className="text-blue-400 hover:text-blue-300 underline">
              Go to Strategies Page
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => (
              <EnhancedStrategyCard
                key={strategy.id}
                strategy={strategy}
                onDelete={handleDelete}
                onEdit={() => handleEdit(strategy.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-12 glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <div className="space-y-3 text-white/80">
            <p>1. Click on any strategy card to navigate to its performance page</p>
            <p>2. Click the "View Performance Details" button to navigate</p>
            <p>3. Verify the performance page has the same layout as the edit strategy page</p>
            <p>4. Test all tabs: Overview, Performance, Rules, and Compliance</p>
            <p>5. Use the browser back button to return to this page</p>
            <p>6. Test the "Back to Strategies" link on the performance page</p>
          </div>
        </div>
      </div>
    </div>
  );
}