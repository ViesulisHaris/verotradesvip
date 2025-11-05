'use client';

import { formatCurrency } from '@/lib/utils';
import { X } from 'lucide-react';

interface Props {
  trade: any;
  onClose: () => void;
}

export default function TradeModal({ trade, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass max-w-lg w-full p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-white/10">
          <X className="w-5 h-5 text-white" />
        </button>
        <h3 className="text-xl font-bold mb-4 text-white">Trade Details</h3>
        <div className="space-y-2 text-white">
          <p><span className="font-medium">Symbol:</span> {trade.symbol}</p>
          <p><span className="font-medium">Side:</span> {trade.side}</p>
          <p><span className="font-medium">Quantity:</span> {trade.quantity}</p>
          <p><span className="font-medium">PnL:</span> {formatCurrency(trade.pnl || 0)}</p>
          <p><span className="font-medium">Market:</span> {trade.market}</p>
          <p><span className="font-medium">Emotion:</span> {trade.emotional_state}</p>
        </div>
      </div>
    </div>
  );
}
