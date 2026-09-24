import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { skillsApi } from '../../api';
import { MarketPulseChart } from '../../components/charts/Charts';
import { TrendingUp, TrendingDown, Minus, BarChart2, Zap } from 'lucide-react';

const INDUSTRIES = ['All', 'Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Logistics', 'Construction', 'Hospitality', 'Marketing'];

const RARITY_SKILLS = [
  { skillName: 'Kubernetes', score: 92, trend: 'rising' },
  { skillName: 'Cybersecurity', score: 88, trend: 'rising' },
  { skillName: 'Machine Learning', score: 85, trend: 'rising' },
  { skillName: 'GraphQL', score: 83, trend: 'rising' },
  { skillName: 'Docker', score: 78, trend: 'stable' },
  { skillName: 'Cloud Computing', score: 72, trend: 'rising' },
];

const INDEMAND_SKILLS = [
  { skillName: 'Communication Skills', count: 300, trend: 'stable' },
  { skillName: 'Python', count: 200, trend: 'rising' },
  { skillName: 'Customer Service', count: 250, trend: 'stable' },
  { skillName: 'JavaScript', count: 180, trend: 'stable' },
  { skillName: 'Data Analysis', count: 130, trend: 'rising' },
  { skillName: 'Leadership', count: 200, trend: 'stable' },
  { skillName: 'Digital Marketing', count: 95, trend: 'rising' },
  { skillName: 'SQL', count: 140, trend: 'stable' },
];

function TrendIcon({ trend }) {
  if (trend === 'rising') return <TrendingUp size={13} color="var(--green)" />;
  if (trend === 'falling') return <TrendingDown size={13} color="var(--red)" />;
  return <Minus size={13} color="var(--text-3)" />;
}

export default function MarketPulsePage() {
  const [selectedSkills, setSelectedSkills] = useState(['Python', 'JavaScript', 'Data Analysis']);

  const { data: demandData, isLoading } = useQuery({
    queryKey: ['skill-demand-pulse', selectedSkills],
    queryFn: () => skillsApi.getDemand({ days: 30, skills: selectedSkills.join(',') }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: taxonomyData } = useQuery({
    queryKey: ['skill-taxonomy'],
    queryFn: () => skillsApi.getTaxonomy().then(r => r.data),
  });

  const allSkills = taxonomyData?.skills?.map(s => s.name) || [];

  const rawDemandData = demandData?.data || [];

  const toggleSkill = (name) => {
    setSelectedSkills(prev =>
      prev.includes(name)
        ? prev.filter(s => s !== name)
        : [...prev.slice(-4), name]
    );
  };

  return (
    <div className="animate-in" style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Market Intelligence</div>
        <h1 className="display-lg">Market <span className="accent-mark">Pulse</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>30-day demand trends, hottest skills, and what employers are seeking right now.</p>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div className="section-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <div className="display-sm" style={{ fontSize: '0.9rem' }}>Demand Trend — 30 Days</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Job postings mentioning these skills (select up to 5)</div>
            </div>
            <BarChart2 size={16} color="var(--text-3)" />
          </div>

          {isLoading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius)' }} />
          ) : rawDemandData.length > 0 ? (
            <MarketPulseChart data={rawDemandData} selectedSkills={selectedSkills} />
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
              Select skills below to see their demand trend
            </div>
          )}

          {/* Skill selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.25rem' }}>
            {(allSkills.length > 0 ? allSkills.slice(0, 20) : INDEMAND_SKILLS.map(s => s.skillName)).map(name => (
              <button key={name}
                className={`btn btn-sm ${selectedSkills.includes(name) ? 'btn-outline' : 'btn-ghost'}`}
                onClick={() => toggleSkill(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* In-demand skills */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <Zap size={16} color="var(--accent)" />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Most In-Demand</div>
            </div>
            {INDEMAND_SKILLS.map((skill, i) => (
              <div key={skill.skillName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: i < INDEMAND_SKILLS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '4px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600 }}>{i + 1}</span>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{skill.skillName}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <TrendIcon trend={skill.trend} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>{skill.count.toLocaleString()}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rare / High-value skills */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <TrendingUp size={16} color="var(--green)" />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Rare & High-Value</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginLeft: 'auto' }}>Scarcity score</span>
            </div>
            {RARITY_SKILLS.map((skill, i) => (
              <div key={skill.skillName} style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{skill.skillName}</span>
                    <TrendIcon trend={skill.trend} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: skill.score > 85 ? 'var(--red)' : skill.score > 75 ? 'var(--amber)' : 'var(--green)' }}>{skill.score}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${skill.score}%`, background: skill.score > 85 ? 'var(--red)' : skill.score > 75 ? 'var(--amber)' : 'var(--green)', borderRadius: 2, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: '0.75rem', color: 'var(--text-3)' }}>
              📌 High scarcity = fewer people have it. Learning these skills gives you a competitive edge.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
