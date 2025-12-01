'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, Tooltip } from 'recharts';

interface Data {
  subject: string;
  value: number;
  fullMark: number;
  percent: string;
}

interface Props {
  data: Data[];
}

export default function EmotionRadar({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'white' }} />
        <Radar name="Emotion" dataKey="value" stroke="#9f7aea" fill="#9f7aea" fillOpacity={0.6} />
        <Tooltip
          formatter={(value: number, subject: string) => {
            const item = data.find(d => d.subject === subject);
            return [item?.percent || `${value}%`, 'Trades'];
          }}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
