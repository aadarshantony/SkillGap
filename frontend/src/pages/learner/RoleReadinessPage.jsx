import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi, pathsApi, jobsApi } from '../../api';
import { Target, CheckCircle, AlertTriangle, ArrowRight, Zap, Award, Briefcase, TrendingUp, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function RoleReadinessPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: gapData, isLoading: gapLoading } = useQuery({
    queryKey: ['skill-gap'],
    queryFn: () => skillsApi.getGap().then(r => r.data),
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs-employer', true],
    queryFn: () => jobsApi.getEmployerJobs({ showAll: true }).then(r => r.data),
  });

  const { data: pathsData } = useQuery({
    queryKey: ['my-paths'],
    queryFn: () => pathsApi.getAll().then(r => r.data),
  });

  const generatePath = useMutation({
    mutationFn: (skillName) => pathsApi.generate({
      skillName,
      targetProficiency: 'intermediate',
    }).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['my-paths']);
      toast.success(`Learning path created for ${data.path?.skillName}!`);
      navigate(`/paths/${data.path._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate path'),
  });

  const jobs = jobsData?.jobs || [];
  const gaps = gapData?.gaps || [];
  const paths = pathsData?.paths || [];

  // Group roles by readiness match score
  const roleAnalysis = jobs.map(job => {
    const reqs = job.requirements || [];
    const missing = reqs.filter(r => gaps.some(g => g.skillName.toLowerCase() === r.skillName.toLowerCase()));
    const verifiedCount = reqs.length - missing.length;
    const matchPct = reqs.length ? Math.round((verifiedCount / reqs.length) * 100) : 100;
    return {
      ...job,
      missingSkills: missing,
      verifiedCount,
      matchPct,
    };
  }).sort((a, b) => b.matchPct - a.matchPct);

  return (
    <div className="animate-in" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Career Diagnostics</div>
        <h1 className="display-lg">Role <span className="accent-mark">Readiness</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
          Evaluate your readiness across top career roles and close critical skill gaps.
        </p>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)' }}>
              {roleAnalysis.filter(r => r.matchPct >= 80).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Ready Roles (80%+ Match)</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--amber)' }}>
              {roleAnalysis.filter(r => r.matchPct >= 50 && r.matchPct < 80).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Stretch Roles (50-79%)</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--red)' }}>
              {gaps.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Critical Gaps to Close</div>
          </div>
        </div>
      </div>

      {/* Role Breakdown List */}
      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>Target Role Diagnostics</div>
      {jobsLoading ? (
        [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : (
        roleAnalysis.map((role, idx) => {
          const isReady = role.matchPct >= 80;
          return (
            <div key={role._id} className="card card-hover animate-in" style={{ marginBottom: '0.85rem', animationDelay: `${idx * 30}ms` }}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.25rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{role.title}</span>
                      <span className="badge badge-muted">{role.companyName}</span>
                      <span className={`badge ${isReady ? 'badge-green' : 'badge-amber'}`}>
                        {isReady ? 'Ready to Apply' : 'Skill Gaps Present'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginBottom: '0.6rem' }}>
                      {role.location} · {role.industry} · {role.requirements?.length} required skills
                    </div>

                    {/* Skill Breakdown Pill Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {role.requirements?.map((req, i) => {
                        const isMissing = role.missingSkills.some(m => m.skillName.toLowerCase() === req.skillName.toLowerCase());
                        return (
                          <span key={i} className={`skill-pill ${!isMissing ? 'verified' : ''}`} style={{ borderColor: isMissing ? 'var(--red)' : undefined }}>
                            {req.skillName}
                            {!isMissing ? <CheckCircle size={10} color="var(--green)" /> : <span style={{ color: 'var(--red)', fontSize: '0.65rem' }}>missing</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Readiness Score Gauge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: `conic-gradient(${isReady ? 'var(--green)' : 'var(--amber)'} ${role.matchPct * 3.6}deg, var(--surface-3) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: isReady ? 'var(--green)' : 'var(--amber)', fontFamily: 'var(--font-display)' }}>
                        {role.matchPct}%
                      </div>
                    </div>

                    {role.missingSkills?.length > 0 ? (
                      <button className="btn btn-primary btn-xs"
                        onClick={() => generatePath.mutate(role.missingSkills[0].skillName)}
                        disabled={generatePath.isPending}>
                        <Zap size={11} /> Bridge Gap
                      </button>
                    ) : (
                      <Link to="/jobs" className="btn btn-outline btn-xs">
                        Apply Now
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
