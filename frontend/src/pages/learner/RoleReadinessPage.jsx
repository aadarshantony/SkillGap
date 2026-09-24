import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, pathsApi } from '../../api';
import { Target, CheckCircle, ArrowRight, Zap, Award, TrendingUp, Sparkles, RefreshCw, Briefcase, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function RoleReadinessPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: recData, isLoading, refetch } = useQuery({
    queryKey: ['role-recommendations'],
    queryFn: () => profileApi.getRecommendations().then(r => r.data),
    staleTime: 60 * 1000,
  });

  const generatePath = useMutation({
    mutationFn: (skillName) => pathsApi.generate({
      skillName,
      targetProficiency: 'intermediate',
    }).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['my-paths']);
      toast.success(`Learning path generated for ${data.path?.skillName}!`);
      navigate(`/paths/${data.path._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate learning path'),
  });

  const recommendations = recData?.recommendations || [];
  const lastUpdated = recData?.lastUpdated || new Date().toISOString().slice(0, 10);
  const totalVerified = recData?.totalVerifiedSkills || 0;

  const handleManualRefresh = async () => {
    toast.promise(refetch(), {
      loading: 'Recalculating daily role matches against market demand...',
      success: 'Role recommendations updated for today!',
      error: 'Failed to update recommendations',
    });
  };

  return (
    <div className="animate-in" style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="label" style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={13} color="var(--accent)" /> Dynamic Daily Recommendation Engine
          </div>
          <h1 className="display-lg">
            Role <span className="accent-mark">Recommendations</span> & Diagnostics
          </h1>
          <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
            Recalculated daily based on your verified credentials, target proficiency, and active market demand.
          </p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={handleManualRefresh} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={13} /> Refresh Today's Matches
        </button>
      </div>

      {/* Daily Banner */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(212,255,71,0.06) 0%, rgba(74,158,240,0.06) 100%)', borderColor: 'rgba(212,255,71,0.25)' }}>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={22} color="#000" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Updated for {lastUpdated} · {totalVerified} Verified Skill Credentials
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: '0.2rem' }}>
                Your skill profile matches {recommendations.filter(r => r.matchScore >= 80).length} roles at 80%+ match rate today.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/jobs" className="btn btn-primary btn-sm">
              <Briefcase size={13} /> View Matching Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Role Recommendations List */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Top Recommended Roles for You</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>Ranked by overall match & market demand</div>
      </div>

      {isLoading ? (
        [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 130, marginBottom: '1rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : recommendations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Target size={32} style={{ opacity: 0.3 }} />
            <div style={{ fontWeight: 600 }}>No role recommendations available</div>
            <div style={{ fontSize: '0.8125rem' }}>Update your profile skills to generate personalized role recommendations.</div>
          </div>
        </div>
      ) : (
        recommendations.map((role, idx) => {
          const isReady = role.matchScore >= 80;
          return (
            <div key={role.roleId} className="card card-hover animate-in" style={{ marginBottom: '1rem', animationDelay: `${idx * 40}ms` }}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center' }}>
                  <div>
                    {/* Header line */}
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{role.title}</span>
                      <span className="badge badge-accent">{role.industry}</span>
                      <span className="badge badge-muted">{role.averageSalary}</span>
                      <span className={`badge ${isReady ? 'badge-green' : 'badge-amber'}`}>
                        {isReady ? '★ High Match' : 'Gap Present'}
                      </span>
                      {role.dailyGrowthPct > 10 && (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <TrendingUp size={11} /> +{role.dailyGrowthPct}% demand this week
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                      {role.description}
                    </p>

                    {/* Daily Action Tip */}
                    <div style={{ padding: '0.6rem 0.8rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)', marginBottom: '0.85rem', fontSize: '0.8125rem', color: 'var(--text)' }}>
                      {role.dailyActionTip}
                    </div>

                    {/* Skill Breakdown */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginRight: '0.2rem' }}>Required Skills:</span>
                      {role.satisfiedSkills.map(s => (
                        <span key={s.skillName} className="skill-pill verified" title={`Verified score: ${s.score}%`}>
                          {s.skillName} <CheckCircle size={10} color="var(--green)" />
                        </span>
                      ))}
                      {role.missingSkills.map(m => (
                        <span key={m.skillName} className="skill-pill" style={{ borderColor: 'var(--red)', color: 'var(--text-2)' }}>
                          {m.skillName} <span style={{ color: 'var(--red)', fontSize: '0.65rem', marginLeft: '0.2rem' }}>missing</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Match Gauge + Action */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', minWidth: 110 }}>
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: `conic-gradient(${isReady ? 'var(--green)' : 'var(--accent)'} ${role.matchScore * 3.6}deg, var(--surface-3) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: isReady ? 'var(--green)' : 'var(--accent)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                          {role.matchScore}%
                        </span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>match</span>
                      </div>
                    </div>

                    {role.missingSkills.length > 0 ? (
                      <button className="btn btn-primary btn-xs" style={{ whiteSpace: 'nowrap', width: '100%', justifyContent: 'center' }}
                        onClick={() => generatePath.mutate(role.missingSkills[0].skillName)}
                        disabled={generatePath.isPending}>
                        {generatePath.isPending ? <span className="spinner" /> : <><Zap size={12} /> Bridge Gap</>}
                      </button>
                    ) : (
                      <Link to="/jobs" className="btn btn-outline btn-xs" style={{ whiteSpace: 'nowrap', width: '100%', justifyContent: 'center' }}>
                        Apply <ChevronRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
