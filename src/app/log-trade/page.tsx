'use client';

import TradeForm from '@/components/TradeForm';
import { useRouter } from 'next/navigation';

export default function LogTradePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-white">Log New Trade</h2>
      <TradeForm onSuccess={() => router.push('/dashboard')} />
    </div>
  );
}
