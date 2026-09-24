import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { skillsApi, pathsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { MarketPulseChart } from '../../components/charts/Charts';
import toast from 'react-hot-toast';
import {
  TrendingUp, TrendingDown, Zap, BookOpen, ChevronRight,
  AlertTriangle, CheckCircle, ArrowUpRight, Target, BarChart2, Award
} from 'lucide-react';

const GAP_TYPE_CONFIG = {
  missing:      { color: 'var(--red)',    label: 'Missing', badge: 'badge-red' },
  insufficient: { color: 'var(--amber)',  label: 'Needs upgrade', badge: 'badge-amber' },
  unverified:   { color: 'var(--blue)',   label: 'Unverified', badge: 'badge-blue' },
};

const PROF_ORDER = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

export default function LearnerDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [demandSkills, setDemandSkills] = useState([]);

  const { data: gapData, isLoading: gapLoading } = useQuery({
    queryKey: ['skill-gap'],
    queryFn: () => skillsApi.getGap().then(r => r.data),
  });

  const { data: demandData } = useQuery({
    queryKey: ['skill-demand', demandSkills],
    queryFn: () => skillsApi.getDemand({ days: 30, skills: demandSkills.join(',') }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
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
      if (data.existing) {
        toast('Path already exists! View it in My Paths.', { icon: '📚' });
      } else {
        toast.success(`Learning path for ${data.path?.skillName} created!`);
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate path'),
  });

  const gaps = gapData?.gaps || [];
  const paths = pathsData?.paths || [];
  const activePaths = paths.filter(p => p.status === 'active');

  // Build chart data from demand API
  const chartData = (() => {
    if (!demandData?.data?.length) return [];
    const byDate = {};
    for (const d of demandData.data) {
      const day = d.date?.slice(0, 10);
      if (!byDate[day]) byDate[day] = { date: day };
      byDate[day][d.skillName] = d.count;
    }
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Auto-select top 3 gap skills for chart
  React.useEffect(() => {
    if (gaps.length && demandSkills.length === 0) {
      setDemandSkills(gaps.slice(0, 3).map(g => g.skillName));
    }
  }, [gaps]);

  return (
    <div className="animate-in" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Learner Dashboard</div>
        <h1 className="display-lg">
          Your <span className="accent-mark">Skill</span> Picture
        </h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
          Real-time gap analysis against {gaps.length} active job requirements.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Skill Gaps', value: gaps.length, icon: Target, color: 'var(--red)', sub: 'Open opportunities' },
          { label: 'Active Paths', value: activePaths.length, icon: BookOpen, color: 'var(--blue)', sub: 'In progress' },
          { label: 'Credentials Earned', value: paths.filter(p => p.status === 'completed').length, icon: Award, color: 'var(--accent)', sub: 'Verified skills' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: `${s.color === 'var(--accent)' ? 'rgba(212,255,71,0.12)' : s.color === 'var(--red)' ? 'rgba(240,74,74,0.12)' : 'rgba(74,158,240,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <div className="stat-num" style={{ color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.1rem' }}>{s.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Left: Gap List + Chart */}
        <div>
          {/* Market Pulse Chart */}
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-body">
                <div className="section-header">
                  <div>
                    <div className="display-sm" style={{ fontSize: '0.85rem' }}>Market Pulse</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>30-day demand trend for your gap skills</div>
                  </div>
                  <BarChart2 size={16} color="var(--text-3)" />
                </div>
                <MarketPulseChart data={chartData} skills={demandSkills} />
                {/* Skill selector */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
                  {gaps.slice(0, 8).map(g => (
                    <button key={g.skillName} className={`btn btn-sm ${demandSkills.includes(g.skillName) ? 'btn-outline' : 'btn-ghost'}`}
                      onClick={() => setDemandSkills(prev =>
                        prev.includes(g.skillName)
                          ? prev.filter(s => s !== g.skillName)
                          : [...prev.slice(-2), g.skillName]
                      )}>
                      {g.skillName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Skill Gaps */}
          <div className="section-header">
            <div className="display-sm" style={{ fontSize: '0.85rem' }}>Your Skill Gaps <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 400 }}>({gaps.length} found)</span></div>
            <Link to="/jobs" style={{ fontSize: '0.8125rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Browse jobs <ArrowUpRight size={13} />
            </Link>
          </div>

          {gapLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
          ) : gaps.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <CheckCircle size={32} color="var(--green)" style={{ opacity: 1 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>No gaps detected!</div>
                <div style={{ fontSize: '0.8125rem' }}>You match all current job requirements. Keep your skills verified.</div>
              </div>
            </div>
          ) : (
            gaps.map((gap, i) => {
              const cfg = GAP_TYPE_CONFIG[gap.gapType] || GAP_TYPE_CONFIG.missing;
              const existingPath = paths.find(p => p.skillName.toLowerCase() === gap.skillName.toLowerCase() && p.status === 'active');
              const isPending = generatePath.isPending && generatePath.variables?.skillName === gap.skillName;

              return (
                <div key={gap.skillName} className="card card-hover animate-in" style={{ marginBottom: '0.75rem', animationDelay: `${i * 30}ms` }}>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600 }}>{gap.skillName}</span>
                        <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                        {gap.marketDemand7d > 100 && (
                          <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <TrendingUp size={10} /> Hot skill
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '0.35rem' }}>
                        {gap.currentProficiency
                          ? `You're at ${gap.currentProficiency} → need ${gap.requiredProficiency}`
                          : `Required: ${gap.requiredProficiency}`}
                        <span style={{ color: 'var(--text-3)', marginLeft: '0.75rem' }}>{gap.jobCount} open job{gap.jobCount > 1 ? 's' : ''}</span>
                      </div>
                      {gap.sampleJobs?.[0] && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                          e.g. {gap.sampleJobs[0].title} @ {gap.sampleJobs[0].company}
                        </div>
                      )}
                    </div>
                    <div>
                      {existingPath ? (
                        <Link to={`/paths/${existingPath._id}`} className="btn btn-outline btn-sm" style={{ whiteSpace: 'nowrap' }}>
                          <BookOpen size={13} /> Continue Path
                        </Link>
                      ) : (
                        <button className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}
                          onClick={() => generatePath.mutate(gap)}
                          disabled={isPending}>
                          {isPending ? <><span className="spinner" />Generating…</> : <><Zap size={13} />Start Path</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Active Paths */}
        <div>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <div className="display-sm" style={{ fontSize: '0.85rem' }}>Active Paths</div>
            <Link to="/paths" style={{ fontSize: '0.8125rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              All <ChevronRight size={13} />
            </Link>
          </div>

          {pathsLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
          ) : activePaths.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <BookOpen size={24} color="var(--text-3)" style={{ opacity: 0.4, margin: '0 auto 0.75rem' }} />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>No active paths yet. Start one from the gaps above!</div>
              </div>
            </div>
          ) : (
            activePaths.slice(0, 5).map(path => {
              const total = path.steps?.length || 0;
              const done = path.steps?.filter(s => s.completed).length || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link key={path._id} to={`/paths/${path._id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '0.75rem' }}>
                  <div className="card card-hover">
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{path.skillName}</div>
                        <span className="badge badge-blue">{path.targetProficiency}</span>
                      </div>
                      <div className="progress-track" style={{ marginBottom: '0.5rem' }}>
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
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/credentials" className="btn btn-ghost" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={15} /> My Credentials</span>
              <ChevronRight size={14} />
            </Link>
            <Link to="/jobs" className="btn btn-ghost" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={15} /> Browse Jobs</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
