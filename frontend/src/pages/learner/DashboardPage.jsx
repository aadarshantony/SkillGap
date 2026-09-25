import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { skillsApi, pathsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  TrendingUp, Zap, BookOpen, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle, ArrowUpRight, Target, Award
} from 'lucide-react';

const GAP_TYPE_CONFIG = {
  missing:      { color: 'var(--red)',    label: 'Missing', badge: 'badge-red' },
  insufficient: { color: 'var(--amber)',  label: 'Needs upgrade', badge: 'badge-amber' },
  unverified:   { color: 'var(--blue)',   label: 'Unverified', badge: 'badge-blue' },
};

export default function LearnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showAllGaps, setShowAllGaps] = useState(false);

  const { data: gapData, isLoading: gapLoading } = useQuery({
    queryKey: ['skill-gap'],
    queryFn: () => skillsApi.getGap().then(r => r.data),
  });

  const { data: pathsData, isLoading: pathsLoading } = useQuery({
    queryKey: ['my-paths'],
    queryFn: () => pathsApi.getAll().then(r => r.data),
  });

  const generatePath = useMutation({
    mutationFn: (gap) => pathsApi.generate({
      skillName: gap.skillName,
      currentProficiency: gap.currentProficiency,
      targetProficiency: gap.requiredProficiency,
      jobTitle: gap.sampleJobs?.[0]?.title,
      companyName: gap.sampleJobs?.[0]?.company,
    }).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['my-paths']);
      const pathId = data.path?._id;
      if (pathId) {
        if (data.existing) {
          toast('Opening active path...', { icon: '📚' });
        } else {
          toast.success(`Learning path for ${data.path?.skillName} created!`);
        }
        navigate(`/paths/${pathId}`);
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate path'),
  });

  const gaps = gapData?.gaps || [];
  const totalGaps = gapData?.totalGaps ?? gaps.length;
  const paths = pathsData?.paths || [];
  const activePaths = paths.filter(p => p.status === 'active');
  const displayedGaps = showAllGaps ? gaps : gaps.slice(0, 5);

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="label" style={{ marginBottom: '0.3rem' }}>Learner Dashboard</div>
        <h1 className="display-lg">
          Your <span className="accent-mark">Skill</span> Picture
        </h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.35rem' }}>
          Real-time gap analysis against target requirements and active job roles.
        </p>
      </div>

      {/* Stats Row */}
      <div className="responsive-grid-3" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Skill Gaps', value: totalGaps, icon: Target, color: 'var(--red)', sub: 'Open opportunities' },
          { label: 'Active Paths', value: activePaths.length, icon: BookOpen, color: 'var(--blue)', sub: 'In progress' },
          { label: 'Credentials Earned', value: paths.filter(p => p.status === 'completed').length, icon: Award, color: 'var(--accent)', sub: 'Verified skills' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="card-body" style={{ padding: '1.1rem 1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: `${s.color === 'var(--accent)' ? 'rgba(212,255,71,0.12)' : s.color === 'var(--red)' ? 'rgba(240,74,74,0.12)' : 'rgba(74,158,240,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div>
                <div className="stat-num" style={{ color: s.color, fontSize: '1.85rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.05rem' }}>{s.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="responsive-main-split">
        {/* Left: Gap List */}
        <div>
          {/* Skill Gaps Header */}
          <div className="section-header" style={{ marginBottom: '0.85rem' }}>
            <div className="display-sm" style={{ fontSize: '0.85rem' }}>
              Your Skill Gaps <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 400 }}>({totalGaps} found)</span>
            </div>
            <Link to="/jobs" style={{ fontSize: '0.8125rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Browse jobs <ArrowUpRight size={13} />
            </Link>
          </div>

          {gapLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, marginBottom: '0.6rem', borderRadius: 'var(--radius-lg)' }} />)
          ) : gaps.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <CheckCircle size={32} color="var(--green)" style={{ opacity: 1 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>No gaps detected!</div>
                <div style={{ fontSize: '0.8125rem' }}>You match all current job requirements. Keep your skills verified.</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={showAllGaps ? { maxHeight: '560px', overflowY: 'auto', paddingRight: '0.25rem' } : {}}>
                {displayedGaps.map((gap, i) => {
                  const cfg = GAP_TYPE_CONFIG[gap.gapType] || GAP_TYPE_CONFIG.missing;
                  const existingPath = paths.find(p => p.skillName.toLowerCase() === gap.skillName.toLowerCase() && p.status === 'active');
                  const isPending = generatePath.isPending && generatePath.variables?.skillName === gap.skillName;

                  return (
                    <div key={gap.skillName} className="card card-hover animate-in" style={{ marginBottom: '0.6rem', animationDelay: `${i * 20}ms` }}>
                      <div className="card-body" style={{ padding: '0.85rem 1.15rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{gap.skillName}</span>
                            <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                            {gap.marketDemand7d > 100 && (
                              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <TrendingUp size={10} /> Hot skill
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '0.2rem' }}>
                            {gap.currentProficiency
                              ? `You're at ${gap.currentProficiency} → need ${gap.requiredProficiency}`
                              : `Required: ${gap.requiredProficiency}`}
                            <span style={{ color: 'var(--text-3)', marginLeft: '0.6rem' }}>{gap.jobCount} open job{gap.jobCount > 1 ? 's' : ''}</span>
                          </div>
                          {gap.sampleJobs?.[0] && (
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-3)' }}>
                              e.g. {gap.sampleJobs[0].title} @ {gap.sampleJobs[0].company}
                            </div>
                          )}
                        </div>
                        <div>
                          {existingPath ? (
                            <Link to={`/paths/${existingPath._id}`} className="btn btn-outline btn-sm" style={{ whiteSpace: 'nowrap', padding: '0.35rem 0.75rem' }}>
                              <BookOpen size={13} /> Continue Path
                            </Link>
                          ) : (
                            <button className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap', padding: '0.35rem 0.75rem' }}
                              onClick={() => generatePath.mutate(gap)}
                              disabled={isPending}>
                              {isPending ? <><span className="spinner" />Generating…</> : <><Zap size={13} />Start Path</>}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {gaps.length > 5 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', color: 'var(--accent)', border: '1px dashed var(--border)' }}
                  onClick={() => setShowAllGaps(v => !v)}>
                  {showAllGaps ? (
                    <>Show Top 5 Skill Gaps <ChevronUp size={14} /></>
                  ) : (
                    <>View All {gaps.length} Skill Gaps ({gaps.length - 5} more) <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Active Paths */}
        <div>
          <div className="section-header" style={{ marginBottom: '0.85rem' }}>
            <div className="display-sm" style={{ fontSize: '0.85rem' }}>Active Paths</div>
            <Link to="/paths" style={{ fontSize: '0.8125rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              All <ChevronRight size={13} />
            </Link>
          </div>

          {pathsLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, marginBottom: '0.6rem', borderRadius: 'var(--radius-lg)' }} />)
          ) : activePaths.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '1.75rem 1.25rem' }}>
                <BookOpen size={24} color="var(--text-3)" style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>No active paths yet. Start one from the gaps above!</div>
              </div>
            </div>
          ) : (
            activePaths.slice(0, 5).map(path => {
              const total = path.steps?.length || 0;
              const done = path.steps?.filter(s => s.completed).length || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link key={path._id} to={`/paths/${path._id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '0.6rem' }}>
                  <div className="card card-hover">
                    <div className="card-body" style={{ padding: '0.85rem 1.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{path.skillName}</div>
                        <span className="badge badge-blue">{path.targetProficiency}</span>
                      </div>
                      <div className="progress-track" style={{ marginBottom: '0.4rem' }}>
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{done}/{total} steps · {pct}% complete</div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}

          {/* Quick links */}
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Link to="/credentials" className="btn btn-ghost btn-sm" style={{ justifyContent: 'space-between', padding: '0.6rem 0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={15} /> My Credentials</span>
              <ChevronRight size={14} />
            </Link>
            <Link to="/applied" className="btn btn-ghost btn-sm" style={{ justifyContent: 'space-between', padding: '0.6rem 0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={15} /> Applied Jobs</span>
              <ChevronRight size={14} />
            </Link>
            <Link to="/market-pulse" className="btn btn-ghost btn-sm" style={{ justifyContent: 'space-between', padding: '0.6rem 0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={15} /> Market Pulse</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
