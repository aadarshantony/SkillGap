import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { jobsApi, pathsApi } from '../../api';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Clock, DollarSign, ChevronRight, Zap, ExternalLink, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const RUPEE = (n) => n ? `₹${(n / 100000).toFixed(1)}L` : null;
const PROFICIENCY_COLOR = { beginner: 'var(--blue)', intermediate: 'var(--amber)', advanced: 'var(--green)', expert: 'var(--accent)' };

function JobCard({ job, type, onApply, applying }) {
  const requirements = type === 'employer' ? job.requirements : job.extractedSkills || [];
  const sal = type === 'employer'
    ? (RUPEE(job.salaryMin) && RUPEE(job.salaryMax) ? `${RUPEE(job.salaryMin)} – ${RUPEE(job.salaryMax)}` : null)
    : (job.salary?.min ? `${RUPEE(job.salary.min)} – ${RUPEE(job.salary.max)}` : null);

  return (
    <div className="card card-hover animate-in" style={{ marginBottom: '0.75rem' }}>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>{job.title}</span>
              {job.remote && <span className="badge badge-green">Remote</span>}
              {type === 'public' && <span className="badge badge-blue">Public</span>}
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
                {requirements.slice(0, 6).map((r, i) => (
                  <span key={i} className="skill-pill" style={{ borderColor: r.required ? 'var(--border)' : 'transparent', color: PROFICIENCY_COLOR[r.proficiency] || 'var(--text-2)' }}>
                    {r.skillName}
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{r.proficiency?.slice(0, 3)}</span>
                  </span>
                ))}
                {requirements.length > 6 && <span className="skill-pill">+{requirements.length - 6}</span>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button
              id={`apply-${type}-${job._id}`}
              className="btn btn-primary btn-sm"
              onClick={() => onApply(job._id, type)}
              disabled={applying}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {applying ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Zap size={13} />}
              Apply
            </button>
            {type === 'public' && job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ExternalLink size={12} /> View
              </a>
            )}
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

  const { data: employerJobs, isLoading: ejLoading } = useQuery({
    queryKey: ['jobs-employer', showAll],
    queryFn: () => jobsApi.getEmployerJobs({ showAll }).then(r => r.data),
  });

  const { data: publicJobs, isLoading: pjLoading } = useQuery({
    queryKey: ['jobs-public'],
    queryFn: () => jobsApi.getPublicJobs({}).then(r => r.data),
    enabled: tab === 'public',
  });

  const applyMutation = useMutation({
    mutationFn: ({ id, type }) => jobsApi.apply(type, id).then(r => r.data),
    onSuccess: (data, vars) => {
      setApplyingId(null);
      if (data.triggerTest) {
        toast.success(data.message, { duration: 5000 });
        // Navigate to generate path for the required skill
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

  const jobs = tab === 'employer' ? (employerJobs?.jobs || []) : (publicJobs?.jobs || []);
  const loading = tab === 'employer' ? ejLoading : pjLoading;

  const filtered = keywords
    ? jobs.filter(j => j.title?.toLowerCase().includes(keywords.toLowerCase()) || j.companyName?.toLowerCase().includes(keywords.toLowerCase()) || j.company?.toLowerCase().includes(keywords.toLowerCase()))
    : jobs;

  return (
    <div className="animate-in" style={{ maxWidth: 900 }}>
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
        <button
          id="toggle-show-all"
          className={`btn ${showAll ? 'btn-outline' : 'btn-ghost'} btn-sm`}
          onClick={() => setShowAll(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={13} />
          {showAll ? 'Showing all roles' : 'Matched only'}
        </button>
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
              {!showAll ? 'Try toggling "Showing all roles" to see stretch roles.' : 'No postings available yet.'}
            </div>
          </div>
        </div>
      ) : (
        filtered.map(job => (
          <JobCard key={job._id} job={job} type={tab}
            applying={applyingId === `${tab}-${job._id}`}
            onApply={handleApply} />
        ))
      )}
    </div>
  );
}
