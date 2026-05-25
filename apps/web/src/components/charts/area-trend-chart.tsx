'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AreaTrendChartProps {
  data: { label: string; value: number }[];
  color?: string;
}

export function AreaTrendChart({ data, color = '#2563eb' }: AreaTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke={color} fill="url(#fill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
