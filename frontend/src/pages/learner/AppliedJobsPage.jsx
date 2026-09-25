import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi, pathsApi } from '../../api';
import { ClipboardList, MapPin, Clock, DollarSign, X, ChevronRight, Briefcase, ExternalLink, Zap, CheckCircle, ArrowRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const RUPEE = (n) => n ? `₹${(n / 100000).toFixed(1)}L` : null;

const STATUS_CONFIG = {
  submitted: { label: 'Application Submitted', badge: 'badge-green' },
  pending_test: { label: 'Skill Test Pending', badge: 'badge-amber' },
  reviewed: { label: 'Under Review', badge: 'badge-blue' },
  rejected: { label: 'Not Moved Forward', badge: 'badge-red' },
  shortlisted: { label: 'Shortlisted', badge: 'badge-accent' },
};

function JobDetailModal({ app, onClose, onOpenTest }) {
  const job = app.job;
  const requirements = job?.requirements || job?.extractedSkills || [];
  const sal = job?.salaryMin && job?.salaryMax
    ? `${RUPEE(job.salaryMin)} – ${RUPEE(job.salaryMax)}`
    : (job?.salary?.min ? `${RUPEE(job.salary.min)} – ${RUPEE(job.salary.max)}` : null);

  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box animate-scale" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{job?.title || app.jobTitle}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 500 }}>{job?.companyName || job?.company || app.companyName}</div>
          </div>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Status + date */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', flexWrap: 'wrap' }}>
            <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
            {app.matchScore !== undefined && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>Match score: <strong style={{ color: 'var(--accent)' }}>{app.matchScore}%</strong></span>
            )}
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginLeft: 'auto' }}>
              Applied {app.submittedAt ? format(new Date(app.submittedAt), 'MMM d, yyyy') : format(new Date(app.createdAt || Date.now()), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-3)', marginBottom: '1.25rem' }}>
            {job?.location && <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><MapPin size={13} />{job.location}</span>}
            {sal && <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><DollarSign size={13} />{sal}</span>}
            {job?.jobType && <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><Clock size={13} />{job.jobType}</span>}
            {job?.remote && <span className="badge badge-green">Remote</span>}
          </div>

          {/* Description */}
          {job?.description && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-2)' }}>About the Role</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{job.description}</div>
            </div>
          )}

          {/* Skills */}
          {requirements.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-2)' }}>Skill Requirements</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {requirements.map((r, i) => (
                  <span key={i} className="skill-pill" style={{ borderColor: r.required ? 'var(--accent)' : 'var(--border)' }}>
                    {r.skillName}
                    {r.required && <span style={{ fontSize: '0.6rem', color: 'var(--accent)', marginLeft: '0.2rem' }}>★</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pending test notice */}
          {app.status === 'pending_test' && app.triggeredTest?.skillName && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.3)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: '0.3rem', fontSize: '0.875rem' }}>⚡ Skill Assessment Required</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '0.75rem' }}>
                Verify your <strong>{app.triggeredTest.skillName}</strong> skills to finalize your application to {app.companyName}.
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => { onClose(); onOpenTest(app); }}>
                <Zap size={13} /> Complete {app.triggeredTest.skillName} Assessment
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {job?.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ExternalLink size={13} /> View Original
            </a>
          )}
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AppliedJobsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => jobsApi.getMyApplications().then(r => r.data),
  });

  const applications = data?.applications || [];

  const filteredApps = applications.filter(a => {
    if (tab === 'submitted') return a.status === 'submitted' || a.status === 'shortlisted' || a.status === 'reviewed';
    if (tab === 'pending') return a.status === 'pending_test';
    return true;
  });

  const handleOpenTest = async (app) => {
    if (app.pathId) {
      navigate(`/paths/${app.pathId}`);
    } else if (app.triggeredTest?.skillName) {
      try {
        const { data: res } = await pathsApi.generate({
          skillName: app.triggeredTest.skillName,
          targetProficiency: 'intermediate',
          jobId: app.jobId,
          jobTitle: app.jobTitle,
          companyName: app.companyName,
        });
        qc.invalidateQueries(['my-paths']);
        qc.invalidateQueries(['my-applications']);
        navigate(`/paths/${res.path._id}`);
      } catch (err) {
        toast.error('Could not load test path');
      }
    } else {
      navigate('/paths');
    }
  };

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      {selected && <JobDetailModal app={selected} onClose={() => setSelected(null)} onOpenTest={handleOpenTest} />}

      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Career Tracker</div>
        <h1 className="display-lg">Applied <span className="accent-mark">Jobs</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>Track your submitted applications and complete pending skill assessments.</p>
      </div>

      {/* Summary */}
      {applications.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Applied', value: applications.length, color: 'var(--accent)' },
            { label: 'Submitted & Active', value: applications.filter(a => a.status !== 'pending_test').length, color: 'var(--green)' },
            { label: 'Pending Assessment', value: applications.filter(a => a.status === 'pending_test').length, color: 'var(--amber)' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All Applications ({applications.length})
        </button>
        <button className={`tab-btn ${tab === 'submitted' ? 'active' : ''}`} onClick={() => setTab('submitted')}>
          Submitted ({applications.filter(a => a.status !== 'pending_test').length})
        </button>
        <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Pending Test ({applications.filter(a => a.status === 'pending_test').length})
        </button>
      </div>

      {isLoading ? (
        [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : filteredApps.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ClipboardList size={32} style={{ opacity: 0.3 }} />
            <div style={{ color: 'var(--text-2)', fontWeight: 600 }}>No applications found</div>
            <div style={{ fontSize: '0.875rem' }}>
              {tab === 'pending' ? 'Great job! You have no pending skill tests.' : 'Browse the Job Board and apply to get started.'}
            </div>
          </div>
        </div>
      ) : (
        filteredApps.map((app, i) => {
          const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted;
          const isPending = app.status === 'pending_test';

          return (
            <div key={app._id} className="card card-hover animate-in"
              style={{ marginBottom: '0.75rem', animationDelay: `${i * 30}ms`, cursor: 'pointer', border: isPending ? '1px solid rgba(255,200,0,0.4)' : undefined }}
              onClick={() => setSelected(app)}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{app.job?.title || app.jobTitle}</span>
                      <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      {app.matchScore !== undefined && (
                        <span className="badge badge-muted">Match: <strong style={{ color: 'var(--accent)' }}>{app.matchScore}%</strong></span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 500, marginBottom: '0.35rem' }}>
                      {app.job?.companyName || app.job?.company || app.companyName}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-3)', flexWrap: 'wrap' }}>
                      {app.job?.location && <span style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}><MapPin size={11} />{app.job.location}</span>}
                      <span>Applied {app.submittedAt ? format(new Date(app.submittedAt), 'MMM d, yyyy') : format(new Date(app.createdAt || Date.now()), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-3)" />
                </div>

                {isPending && (
                  <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.3)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--amber)' }}>
                      ⚡ Required: <strong>{app.triggeredTest?.skillName || 'Skill'} Assessment</strong>
                    </div>
                    <button className="btn btn-primary btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleOpenTest(app); }}>
                      <Zap size={13} /> Complete Assessment <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
