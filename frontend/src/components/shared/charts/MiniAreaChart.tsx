import React from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface MiniAreaChartProps {
  data: DataPoint[];
  color?: string; // Hex color for the chart, e.g. "#3b82f6" (blue)
  height?: number | string;
  valuePrefix?: string;
  valueFormatter?: (value: number) => string;
}

const CustomTooltip = ({ active, payload, label, valuePrefix, valueFormatter }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formattedValue = valueFormatter ? valueFormatter(value) : `${valuePrefix || ''}${value}`;
    
    return (
      <div className="bg-card border border-border/50 shadow-xl rounded-xl p-3 z-50">
        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground">{formattedValue}</p>
      </div>
    );
  }
  return null;
};

export function MiniAreaChart({ 
  data, 
  color = "#3b82f6", 
  height = 120,
  valuePrefix,
  valueFormatter
}: MiniAreaChartProps) {
  // Generate a unique ID for the gradient based on color
  const gradientId = `colorValue-${color.replace('#', '')}`;

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" hide />
          <YAxis hide domain={['dataMin - (dataMax - dataMin) * 0.2', 'auto']} />
          <Tooltip 
            content={<CustomTooltip valuePrefix={valuePrefix} valueFormatter={valueFormatter} />} 
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} 
            position={{ y: 0 }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3} 
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
