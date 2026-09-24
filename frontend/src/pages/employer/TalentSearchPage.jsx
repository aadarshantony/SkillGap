import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employerApi } from '../../api';
import { Users, Search, MapPin, Award, CheckCircle, ExternalLink, Briefcase } from 'lucide-react';

export default function TalentSearchPage() {
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['talent-pool', query, industry],
    queryFn: () => employerApi.getTalentPool({ query, industry }).then(r => r.data),
  });

  const talent = data?.talent || [];

  return (
    <div className="animate-in" style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Talent Discovery</div>
        <h1 className="display-lg">Verified <span className="accent-mark">Talent Pool</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
          Discover candidates with verified skills across HR, Sales, Legal, Education, Operations, Healthcare, and Tech.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <input className="input" placeholder="Search candidate name, headline, or skill (e.g. HR Compliance, B2B Sales, React)…"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={industry} onChange={e => setIndustry(e.target.value)}>
          <option value="">All Industries</option>
          {['Human Resources', 'Sales', 'Legal', 'Education', 'Marketing', 'Accounting', 'Operations', 'Healthcare', 'Technology'].map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {isLoading ? (
        [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : talent.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={32} style={{ opacity: 0.3 }} />
            <div style={{ color: 'var(--text-2)', fontWeight: 600 }}>No candidates match your search</div>
            <div style={{ fontSize: '0.875rem' }}>Try clearing filters or searching for different skill keywords.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {talent.map((cand, idx) => (
            <div key={cand.userId} className="card card-hover animate-in" style={{ animationDelay: `${idx * 25}ms` }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cand.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: '0.1rem' }}>{cand.headline}</div>
                  </div>
                  {cand.verifiedSkillsCount > 0 && (
                    <span className="badge badge-accent">
                      <Award size={11} /> {cand.verifiedSkillsCount} Verified
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {cand.location && <span style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}><MapPin size={11} />{cand.location}</span>}
                  {cand.industry && <span style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}><Briefcase size={11} />{cand.industry}</span>}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {cand.skills?.map(s => (
                    <span key={s.skillName} className={`skill-pill ${s.verified ? 'verified' : ''}`}>
                      {s.skillName}
                      {s.verified && <CheckCircle size={10} color="var(--green)" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
