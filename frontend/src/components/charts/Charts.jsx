import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#d4ff47', '#4a9ef0', '#3ecf6e', '#f0a040', '#9d4edd', '#f04a4a', '#00f5d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-body" style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <div style={{ color: 'var(--text-3)', marginBottom: '0.25rem', fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.value?.toLocaleString()}</span>
          <span style={{ color: 'var(--text-2)' }}>{p.name} job listings</span>
        </div>
      ))}
    </div>
  );
};

// Market Pulse Chart — Clean Bar Chart visualization of skill demand
export function MarketPulseChart({ data, selectedSkills }) {
  const [viewMode, setViewMode] = useState('bar'); // 'bar' | 'line'

  if (!data?.length) return (
    <div className="empty-state" style={{ height: 220 }}>
      <span style={{ fontSize: '0.875rem' }}>No market demand data available yet</span>
    </div>
  );

  // Filter skills
  const availableSkills = [...new Set(data.map(d => d.skillName))];
  const targetSkills = selectedSkills?.length
    ? selectedSkills
    : availableSkills.slice(0, 6);

  // Aggregate totals for clean Bar Chart
  const skillTotals = targetSkills.map((skillName, idx) => {
    const records = data.filter(d => d.skillName === skillName);
    const totalCount = records.reduce((sum, r) => sum + (r.count || 0), 0);
    const avgCount = records.length ? Math.round(totalCount / records.length) : 0;
    return {
      skillName,
      totalCount,
      avgCount,
      color: COLORS[idx % COLORS.length],
    };
  }).sort((a, b) => b.totalCount - a.totalCount);

  // Line chart pivot dataset
  const byDate = {};
  for (const record of data) {
    if (!targetSkills.includes(record.skillName)) continue;
    const dateKey = format(new Date(record.date), 'MMM d');
    if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey };
    byDate[dateKey][record.skillName] = record.count;
  }
  const lineChartData = Object.values(byDate);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem', gap: '0.4rem' }}>
        <button
          className={`btn btn-xs ${viewMode === 'bar' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setViewMode('bar')}>
          Bar Graph
        </button>
        <button
          className={`btn btn-xs ${viewMode === 'line' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setViewMode('line')}>
          Trend Line
        </button>
      </div>

      {viewMode === 'bar' ? (
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={skillTotals} margin={{ top: 10, right: 10, bottom: 25, left: -15 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="skillName" tick={{ fill: 'var(--text-2)', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalCount" name="Total Demand" radius={[6, 6, 0, 0]} maxBarSize={38}>
              {skillTotals.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={lineChartData} margin={{ top: 10, right: 10, bottom: 5, left: -15 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {targetSkills.map((skill, i) => (
              <Line key={skill} type="monotone" dataKey={skill} stroke={COLORS[i % COLORS.length]}
                strokeWidth={2} dot={false} activeDot={{ r: 4, fill: COLORS[i % COLORS.length] }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
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
