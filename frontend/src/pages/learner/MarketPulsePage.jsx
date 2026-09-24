import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { skillsApi } from '../../api';
import { MarketPulseChart } from '../../components/charts/Charts';
import { TrendingUp, TrendingDown, Minus, BarChart2, Zap, Award, Briefcase, Filter } from 'lucide-react';

const INDUSTRIES = ['All', 'Human Resources', 'Sales', 'Legal', 'Education', 'Marketing', 'Accounting', 'Operations', 'Healthcare', 'Technology'];

const MARKET_TREND_DATA = {
  'Human Resources': [
    { skillName: 'HR Compliance', count: 420, trend: 'rising', growth: '+28%', rarityScore: 84 },
    { skillName: 'Talent Acquisition', count: 380, trend: 'rising', growth: '+18%', rarityScore: 72 },
    { skillName: 'Employee Relations', count: 290, trend: 'stable', growth: '+5%', rarityScore: 65 },
  ],
  Sales: [
    { skillName: 'B2B Sales', count: 510, trend: 'rising', growth: '+32%', rarityScore: 88 },
    { skillName: 'Sales Negotiation', count: 340, trend: 'rising', growth: '+22%', rarityScore: 79 },
    { skillName: 'CRM Systems', count: 460, trend: 'stable', growth: '+12%', rarityScore: 60 },
  ],
  Legal: [
    { skillName: 'Legal Writing & Contract Law', count: 280, trend: 'rising', growth: '+35%', rarityScore: 94 },
    { skillName: 'Corporate Compliance', count: 310, trend: 'rising', growth: '+25%', rarityScore: 86 },
  ],
  Education: [
    { skillName: 'Lesson Planning', count: 240, trend: 'stable', growth: '+8%', rarityScore: 55 },
    { skillName: 'Classroom Management', count: 290, trend: 'rising', growth: '+15%', rarityScore: 62 },
  ],
  Marketing: [
    { skillName: 'Digital Marketing', count: 490, trend: 'rising', growth: '+24%', rarityScore: 70 },
    { skillName: 'Brand Strategy', count: 310, trend: 'rising', growth: '+16%', rarityScore: 78 },
  ],
  Accounting: [
    { skillName: 'Financial Accounting', count: 450, trend: 'rising', growth: '+20%', rarityScore: 75 },
    { skillName: 'Tax Compliance', count: 380, trend: 'rising', growth: '+30%', rarityScore: 88 },
  ],
  Operations: [
    { skillName: 'Supply Chain Optimization', count: 360, trend: 'rising', growth: '+26%', rarityScore: 85 },
    { skillName: 'Inventory Management', count: 320, trend: 'stable', growth: '+10%', rarityScore: 64 },
  ],
  Healthcare: [
    { skillName: 'Clinical Pharmacology', count: 290, trend: 'rising', growth: '+38%', rarityScore: 92 },
    { skillName: 'Patient Safety & Care', count: 410, trend: 'rising', growth: '+21%', rarityScore: 70 },
  ],
  Technology: [
    { skillName: 'React', count: 580, trend: 'rising', growth: '+34%', rarityScore: 76 },
    { skillName: 'JavaScript', count: 620, trend: 'rising', growth: '+19%', rarityScore: 68 },
    { skillName: 'Python', count: 540, trend: 'rising', growth: '+29%', rarityScore: 81 },
  ],
};

function TrendIcon({ trend }) {
  if (trend === 'rising') return <TrendingUp size={13} color="var(--green)" />;
  if (trend === 'falling') return <TrendingDown size={13} color="var(--red)" />;
  return <Minus size={13} color="var(--text-3)" />;
}

export default function MarketPulsePage() {
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedSkills, setSelectedSkills] = useState(['HR Compliance', 'B2B Sales', 'React']);

  const { data: demandData, isLoading } = useQuery({
    queryKey: ['skill-demand-pulse', selectedSkills],
    queryFn: () => skillsApi.getDemand({ days: 30, skills: selectedSkills.join(',') }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: taxonomyData } = useQuery({
    queryKey: ['skill-taxonomy'],
    queryFn: () => skillsApi.getTaxonomy().then(r => r.data),
  });

  const rawDemandData = demandData?.data || [];

  const toggleSkill = (name) => {
    setSelectedSkills(prev =>
      prev.includes(name)
        ? prev.filter(s => s !== name)
        : [...prev.slice(-3), name]
    );
  };

  // Compile list of skills for current selected industry filter
  const displayedSkills = (() => {
    if (selectedIndustry === 'All') {
      return Object.values(MARKET_TREND_DATA).flat();
    }
    return MARKET_TREND_DATA[selectedIndustry] || [];
  })();

  return (
    <div className="animate-in" style={{ maxWidth: 1040 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Real-time Market Analytics</div>
        <h1 className="display-lg">
          Market <span className="accent-mark">Pulse</span> & Trends
        </h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
          30-day employer demand volumes, fastest growing skills, and high-scarcity talent benchmarks.
        </p>
      </div>

      {/* Industry Filter Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginRight: '0.4rem' }}>
          <Filter size={13} /> Filter Industry:
        </span>
        {INDUSTRIES.map(ind => (
          <button key={ind}
            className={`btn btn-sm ${selectedIndustry === ind ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedIndustry(ind)}>
            {ind}
          </button>
        ))}
      </div>

      {/* Bar Chart Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div className="section-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <div className="display-sm" style={{ fontSize: '0.9rem' }}>Overall 30-Day Demand Bar Chart</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Total employer job listings asking for specific skills</div>
            </div>
            <BarChart2 size={16} color="var(--accent)" />
          </div>

          {isLoading ? (
            <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius)' }} />
          ) : (
            <MarketPulseChart data={rawDemandData} selectedSkills={selectedSkills} />
          )}

          {/* Quick Skill Toggle Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.25rem' }}>
            {displayedSkills.map(s => (
              <button key={s.skillName}
                className={`btn btn-sm ${selectedSkills.includes(s.skillName) ? 'btn-outline' : 'btn-ghost'}`}
                onClick={() => toggleSkill(s.skillName)}>
                {selectedSkills.includes(s.skillName) ? '✓ ' : ''}{s.skillName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Trends Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Fastest Growing In-Demand Skills */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <Zap size={16} color="var(--accent)" />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Hottest In-Demand Skills</div>
            </div>
            {displayedSkills.map((skill, i) => (
              <div key={skill.skillName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: i < displayedSkills.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '4px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                    {i + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{skill.skillName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{skill.count} active job postings</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <TrendingUp size={10} /> {skill.growth}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Scarcity & Value Skills */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <Award size={16} color="var(--green)" />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Scarcity & Talent Value</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginLeft: 'auto' }}>Scarcity Score</span>
            </div>
            {displayedSkills.map((skill, i) => (
              <div key={skill.skillName} style={{ marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{skill.skillName}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: skill.rarityScore > 85 ? 'var(--red)' : skill.rarityScore > 75 ? 'var(--amber)' : 'var(--green)' }}>
                    {skill.rarityScore}%
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${skill.rarityScore}%`, background: skill.rarityScore > 85 ? 'var(--red)' : skill.rarityScore > 75 ? 'var(--amber)' : 'var(--green)', borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: '0.75rem', color: 'var(--text-3)', borderLeft: '3px solid var(--green)' }}>
              📌 High scarcity indicates high hiring demand with low candidate supply. Earning verified credentials in these skills yields a significant salary premium.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
