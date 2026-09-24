import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { employerApi } from '../../api';
import { Users, AlertTriangle, CheckCircle, TrendingDown, Target, HelpCircle, ArrowRight } from 'lucide-react';

export default function RejectionInsightsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['rejection-insights'],
    queryFn: () => employerApi.getRejectionInsights().then(r => r.data),
  });

  const totalApps = data?.totalApplications || 0;
  const funnel = data?.rejectionFunnel || [];
  const topMissing = data?.topMissingSkills || [];
  const advice = data?.insightsAdvice || [];

  return (
    <div className="animate-in" style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Employer Pipeline Intelligence</div>
        <h1 className="display-lg">
          Applicant <span className="accent-mark">Rejection</span> Insights
        </h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
          Analyze where candidates drop off during hiring, pinpoint common skill gaps, and optimize pass thresholds.
        </p>
      </div>

      {isLoading ? (
        [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 130, marginBottom: '1rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : (
        <>
          {/* Top Funnel Bar */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <div className="display-sm" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Candidate Hiring & Rejection Funnel ({totalApps} Applications Analyzed)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {funnel.map((item, idx) => (
                  <div key={item.stage} style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                      Stage {idx + 1}
                    </div>
                    <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: idx === 3 ? 'var(--green)' : idx === 2 ? 'var(--red)' : 'var(--accent)' }}>
                      {item.count}
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.2rem' }}>
                      {item.stage}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.1rem' }}>
                      {item.percentage}% of total applicants
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Top Missing Skills among Rejected Candidates */}
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <AlertTriangle size={16} color="var(--red)" />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Top Skill Gaps in Rejected Candidates</div>
                </div>

                {topMissing.length === 0 ? (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>No missing skill drop-offs detected.</div>
                ) : (
                  topMissing.map((sk, i) => (
                    <div key={sk.skillName} style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{sk.skillName}</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--red)', fontWeight: 700 }}>
                          Missing in {sk.percentage}% ({sk.count} candidates)
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${sk.percentage}%`, background: 'var(--red)', borderRadius: 3 }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Employer Hiring Recommendations */}
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <CheckCircle size={16} color="var(--green)" />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Actionable Pipeline Advice</div>
                </div>

                {advice.map((adv, i) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'var(--surface-2)', borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius)', marginBottom: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
                    💡 {adv}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
