'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DataPoint {
  date: string;
  pnl: number;
  cumulative: number;
}

interface PnLChartProps {
  data: DataPoint[];
  height?: number;
}

export default function PnLChart({ data, height = 300 }: PnLChartProps) {
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="dashboard-card p-3 border" style={{ 
          backgroundColor: 'var(--deep-charcoal, #121212)',
          borderColor: 'rgba(184, 155, 94, 0.3)'
        }}>
          <p className="body-text text-sm font-medium mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="body-text text-sm" style={{ 
              color: entry.color 
            }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="dashboard-card p-8 text-center" style={{ height }}>
        <div className="secondary-text">No P&L data available</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="date" 
          tick={{ fill: 'white', fontSize: 12 }}
          tickFormatter={formatDate}
        />
        <YAxis 
          tick={{ fill: 'white', fontSize: 12 }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ color: 'white' }}
          iconType="line"
        />
        <Line 
          type="monotone" 
          dataKey="pnl" 
          stroke="#B89B5E" 
          strokeWidth={2}
          dot={{ fill: '#B89B5E', r: 4 }}
          activeDot={{ r: 6 }}
          name="P&L"
        />
        <Line 
          type="monotone" 
          dataKey="cumulative" 
          stroke="#4F5B4A" 
          strokeWidth={2}
          dot={false}
          name="Cumulative"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}