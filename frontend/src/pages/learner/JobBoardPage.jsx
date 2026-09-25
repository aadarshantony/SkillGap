import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi, pathsApi } from '../../api';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Clock, DollarSign, Zap, ExternalLink, Filter, X, ChevronRight, Award, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const RUPEE = (n) => n ? `₹${(n / 100000).toFixed(1)}L` : null;
const PROFICIENCY_COLOR = { beginner: 'var(--blue)', intermediate: 'var(--amber)', advanced: 'var(--green)', expert: 'var(--accent)' };

// ─── Job Detail Modal ─────────────────────────────────────────────────────────
function JobModal({ job, type, onClose, onApply, applying }) {
  const requirements = type === 'employer' ? (job.requirements || []) : (job.extractedSkills || []);
  const sal = type === 'employer'
    ? (RUPEE(job.salaryMin) && RUPEE(job.salaryMax) ? `${RUPEE(job.salaryMin)} – ${RUPEE(job.salaryMax)}` : null)
    : (job.salary?.min ? `${RUPEE(job.salary.min)} – ${RUPEE(job.salary.max)}` : null);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box animate-scale" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{job.title}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 500 }}>{job.companyName || job.company}</div>
          </div>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Meta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-3)', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
            {job.location && <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><MapPin size={13} />{job.location}</span>}
            {sal && <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><DollarSign size={13} />{sal}</span>}
            {job.jobType && <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><Clock size={13} />{job.jobType}</span>}
            {job.remote && <span className="badge badge-green">Remote</span>}
            {type === 'public' && <span className="badge badge-blue">Public listing</span>}
          </div>

          {/* Description */}
          {job.description && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-2)' }}>About the Role</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{job.description}</div>
            </div>
          )}

          {/* Skills */}
          {requirements.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-2)' }}>Skill Requirements</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {requirements.map((r, i) => (
                  <span key={i} className="skill-pill" style={{
                    borderColor: r.required ? 'var(--accent)' : 'var(--border)',
                    color: PROFICIENCY_COLOR[r.proficiency] || 'var(--text-2)',
                    background: r.required ? 'var(--accent-dim)' : undefined,
                  }}>
                    {r.skillName}
                    {r.proficiency && <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: '0.2rem' }}>{r.proficiency}</span>}
                    {r.required && <span style={{ fontSize: '0.6rem', color: 'var(--accent)', marginLeft: '0.2rem' }}>★</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {type === 'public' && job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ExternalLink size={13} /> View Original
            </a>
          )}
          {job.applied ? (
            <span className="badge badge-green" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>✓ Already Applied</span>
          ) : (
            <button className="btn btn-primary" onClick={() => onApply(job._id, type)} disabled={applying}>
              {applying ? <><span className="spinner" />Applying…</> : <><Zap size={14} />Apply Now</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, type, onApply, applying, onClick }) {
  const requirements = type === 'employer' ? (job.requirements || []) : (job.extractedSkills || []);
  const sal = type === 'employer'
    ? (RUPEE(job.salaryMin) && RUPEE(job.salaryMax) ? `${RUPEE(job.salaryMin)} – ${RUPEE(job.salaryMax)}` : null)
    : (job.salary?.min ? `${RUPEE(job.salary.min)} – ${RUPEE(job.salary.max)}` : null);

  return (
    <div className="card card-hover animate-in" style={{ marginBottom: '0.75rem', cursor: 'pointer' }} onClick={onClick}>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>{job.title}</span>
              {job.remote && <span className="badge badge-green">Remote</span>}
              {type === 'public' && <span className="badge badge-blue">Public</span>}
              {job.applied && <span className="badge badge-muted">Applied</span>}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 500, marginBottom: '0.5rem' }}>
              {job.companyName || job.company}
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-3)', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {job.location && <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><MapPin size={12} />{job.location}</span>}
              {sal && <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><DollarSign size={12} />{sal}</span>}
              {job.jobType && <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><Clock size={12} />{job.jobType}</span>}
            </div>
            {requirements.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {requirements.slice(0, 5).map((r, i) => (
                  <span key={i} className="skill-pill" style={{ color: PROFICIENCY_COLOR[r.proficiency] || 'var(--text-2)' }}>
                    {r.skillName}
                  </span>
                ))}
                {requirements.length > 5 && <span className="skill-pill">+{requirements.length - 5}</span>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <ChevronRight size={16} color="var(--text-3)" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobBoardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('employer');
  const [showAll, setShowAll] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: employerJobs, isLoading: ejLoading } = useQuery({
    queryKey: ['jobs-employer', showAll],
    queryFn: () => jobsApi.getEmployerJobs({ showAll }).then(r => r.data),
  });

  const { data: publicJobs, isLoading: pjLoading, refetch: refetchPublic } = useQuery({
    queryKey: ['jobs-public'],
    queryFn: () => jobsApi.getPublicJobs({}).then(r => r.data),
    enabled: tab === 'public',
  });

  const qc = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: ({ id, type }) => jobsApi.apply(type, id).then(r => r.data),
    onSuccess: (data) => {
      setApplyingId(null);
      setSelectedJob(null);
      qc.invalidateQueries(['my-applications']);
      qc.invalidateQueries(['jobs-employer']);
      qc.invalidateQueries(['jobs-public']);
      if (data.triggerTest) {
        toast.success(data.message, { duration: 5000 });
        pathsApi.generate({
          skillName: data.triggerTest.skillName,
          targetProficiency: 'intermediate',
        }).then(r => {
          navigate(`/paths/${r.data.path._id}`);
        }).catch(() => navigate('/paths'));
      } else {
        toast.success(data.message);
      }
    },
    onError: (err) => {
      setApplyingId(null);
      toast.error(err.response?.data?.error || 'Could not apply');
    },
  });

  const handleApply = (id, type) => {
    setApplyingId(`${type}-${id}`);
    applyMutation.mutate({ id, type });
  };

  const handleRefreshAdzuna = async () => {
    setRefreshing(true);
    try {
      await jobsApi.getPublicJobs({ refresh: 'true' });
      await refetchPublic();
      toast.success('Jobs refreshed from Adzuna!');
    } catch {
      toast.error('Could not refresh from Adzuna');
    } finally {
      setRefreshing(false);
    }
  };

  const jobs = tab === 'employer' ? (employerJobs?.jobs || []) : (publicJobs?.jobs || []);
  const loading = tab === 'employer' ? ejLoading : pjLoading;

  const filtered = keywords
    ? jobs.filter(j => j.title?.toLowerCase().includes(keywords.toLowerCase()) ||
        j.companyName?.toLowerCase().includes(keywords.toLowerCase()) ||
        j.company?.toLowerCase().includes(keywords.toLowerCase()))
    : jobs;

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      {selectedJob && (
        <JobModal
          job={selectedJob}
          type={tab}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
          applying={!!applyingId}
        />
      )}

      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Job Board</div>
        <h1 className="display-lg">Find Your <span className="accent-mark">Next Role</span></h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input className="input" placeholder="Search by title or company…" value={keywords}
            onChange={e => setKeywords(e.target.value)} />
        </div>
        {tab === 'employer' && (
          <button
            id="toggle-show-all"
            className={`btn ${showAll ? 'btn-outline' : 'btn-ghost'} btn-sm`}
            onClick={() => setShowAll(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={13} />
            {showAll ? 'All roles' : 'Matched only'}
          </button>
        )}
        {tab === 'public' && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRefreshAdzuna}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh from Adzuna'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn ${tab === 'employer' ? 'active' : ''}`} onClick={() => setTab('employer')}>
          Employer Listings
        </button>
        <button className={`tab-btn ${tab === 'public' ? 'active' : ''}`} onClick={() => setTab('public')}>
          Public Jobs (Adzuna)
        </button>
      </div>

      {/* Job list */}
      {loading ? (
        [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Briefcase size={32} style={{ opacity: 0.3 }} />
            <div style={{ color: 'var(--text-2)', fontWeight: 600 }}>No jobs found</div>
            <div style={{ fontSize: '0.875rem' }}>
              {tab === 'employer' && !showAll ? 'Try toggling "All roles" to see stretch roles.' :
               tab === 'public' ? 'Click "Refresh from Adzuna" to fetch live listings.' :
               'No postings available yet.'}
            </div>
          </div>
        </div>
      ) : (
        filtered.map(job => (
          <JobCard key={job._id} job={job} type={tab}
            applying={applyingId === `${tab}-${job._id}`}
            onApply={handleApply}
            onClick={() => setSelectedJob(job)} />
        ))
      )}
    </div>
  );
}
