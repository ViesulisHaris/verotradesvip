import StrategyCard from '@/components/StrategyCard';
import Link from 'next/link';
import { supabase } from '../../../supabase/client';

export default async function StrategiesPage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: strategies } = await supabase
    .from('strategies')
    .select('*')
    .eq('user_id', user.id);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Strategies</h2>
        <Link href="/strategies/create" className="glass px-6 py-3 text-white hover:bg-white/10 rounded-xl">
          + Create
        </Link>
      </div>
      {strategies?.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {strategies.map((s) => (
            <StrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      ) : (
        <div className="glass p-8 text-center text-white/80">No strategies yet.</div>
      )}
    </div>
  );
}
