import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#d4ff47', '#4a9ef0', '#3ecf6e', '#f0a040', '#f04a4a'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-body" style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius)' }}>
      <div style={{ color: 'var(--text-3)', marginBottom: '0.25rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
          <span style={{ color: 'var(--text-2)' }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
};

// Market Pulse Chart — multi-skill demand over time
export function MarketPulseChart({ data, selectedSkills }) {
  if (!data?.length) return (
    <div className="empty-state" style={{ height: 200 }}>
      <span style={{ fontSize: '0.875rem' }}>No demand data available yet</span>
    </div>
  );

  // Pivot: [{date, skillA: count, skillB: count}]
  const byDate = {};
  for (const record of data) {
    const dateKey = format(new Date(record.date), 'MMM d');
    if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey };
    byDate[dateKey][record.skillName] = record.count;
  }
  const chartData = Object.values(byDate);

  const skills = selectedSkills?.length
    ? selectedSkills
    : [...new Set(data.map(d => d.skillName))].slice(0, 5);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {skills.map((skill, i) => (
          <Line key={skill} type="monotone" dataKey={skill} stroke={COLORS[i % COLORS.length]}
            strokeWidth={2} dot={false} activeDot={{ r: 4, fill: COLORS[i % COLORS.length] }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Heatmap bar chart — skill scarcity
export function HeatmapChart({ data }) {
  if (!data?.length) return <div className="empty-state" style={{ height: 200 }}>No heatmap data</div>;

  const chartData = data.slice(0, 10).map(d => ({
    name: d.skillName,
    scarcity: d.scarcity,
    supply: d.supplyRate,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 12 }} axisLine={false} tickLine={false} width={130} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="scarcity" name="Scarcity" fill="var(--accent)" radius={[0, 3, 3, 0]} maxBarSize={14} />
        <Bar dataKey="supply" name="Supply rate" fill="var(--surface-3)" radius={[0, 3, 3, 0]} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Small sparkline for a single skill's 7-day trend
export function SkillSparkline({ data, skillName, color = '#d4ff47' }) {
  if (!data?.length) return null;
  const chartData = data
    .filter(d => d.skillName === skillName)
    .slice(-7)
    .map(d => ({ count: d.count }));

  return (
    <ResponsiveContainer width={80} height={30}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="count" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
