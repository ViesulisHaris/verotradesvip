'use client';

import { useState, useEffect } from 'react';
import StrategyCard from '@/components/StrategyCard';
import Link from 'next/link';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/contexts/AuthContext-simple';
import AuthGuard from '@/components/AuthGuard';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

function StrategiesPage() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        let query = supabase.from('strategies').select('*');
        
        // Only filter by user_id if user is logged in
        if (user) {
          query = query.eq('user_id', user.id);
        }
        
        const { data } = await query;
        
        setStrategies(data || []);
      } catch (error) {
        console.error('Error fetching strategies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, [user]);

  if (loading) {
    return (
      <div className="verotrade-flex verotrade-items-center verotrade-justify-center verotrade-min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-dusty-gold border-t-transparent"></div>
      </div>
    );
  }


  return (
    <UnifiedLayout>
      <div className="verotrade-content-wrapper">
      {/* Header Section with exact spacing */}
      <div className="mb-section">
        <div className="flex justify-between items-center">
          <h1 className="h1-dashboard mb-element">Strategies</h1>
          <Link
            href="/strategies/create"
            className="button-primary"
          >
            + Create Strategy
          </Link>
        </div>
        <p className="secondary-text mb-element">Manage and analyze your trading strategies</p>
      </div>

      {/* Strategies Grid with exact spacing */}
      {strategies?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-card mb-section">
          {strategies.map((s) => (
            <StrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      ) : (
        <div className="dashboard-card text-center p-card">
          <div className="metric-value mb-component">No Strategies Yet</div>
          <p className="secondary-text mb-component">Create your first trading strategy to get started</p>
          <Link href="/strategies/create" className="button-primary">
            + Create Strategy
          </Link>
        </div>
      )}
      </div>
    </UnifiedLayout>
  );
}

// Wrapper component with authentication guard
function StrategiesPageWithAuth() {
  return (
    <AuthGuard>
      <StrategiesPage />
    </AuthGuard>
  );
}

export default StrategiesPageWithAuth;
