import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerApi, jobsApi } from '../../api';
import toast from 'react-hot-toast';
import { Users, BarChart2, Briefcase, PlusSquare, Award, ChevronRight, CheckCircle, ExternalLink, Zap, X, MapPin, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// ─── Employer Dashboard / Overview ───────────────────────────────────────────
export function EmployerDashboard() {
  const { data: jobsData } = useQuery({ queryKey: ['employer-jobs'], queryFn: () => employerApi.getMyJobs().then(r => r.data) });
  const { data: analyticsData } = useQuery({ queryKey: ['employer-analytics'], queryFn: () => employerApi.getAnalytics().then(r => r.data) });

  const jobs = jobsData?.jobs || [];
  const analytics = analyticsData?.summary || {};

  return (
    <div className="animate-in" style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Employer Dashboard</div>
        <h1 className="display-lg">Your <span className="accent-mark">Hiring</span> Pipeline</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Active Jobs', value: analytics.activeJobs ?? jobs.filter(j => j.active).length, icon: Briefcase, color: 'var(--accent)' },
          { label: 'Total Applicants', value: analytics.totalApplicants ?? 0, icon: Users, color: 'var(--green)' },
          { label: 'Pending Tests', value: analytics.pendingTest ?? 0, icon: Zap, color: 'var(--amber)' },
          { label: 'Avg Match Score', value: analytics.avgMatchScore ? `${analytics.avgMatchScore}%` : '—', icon: Award, color: 'var(--blue)' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/employer/post" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <PlusSquare size={20} color="var(--accent)" />
            <div>
              <div style={{ fontWeight: 600 }}>Post a Job</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>Add structured skill requirements</div>
            </div>
            <ChevronRight size={16} color="var(--text-3)" style={{ marginLeft: 'auto' }} />
          </div>
        </Link>
        <Link to="/employer/applicants" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Users size={20} color="var(--green)" />
            <div>
              <div style={{ fontWeight: 600 }}>View Applicants</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>See who applied per job</div>
            </div>
            <ChevronRight size={16} color="var(--text-3)" style={{ marginLeft: 'auto' }} />
          </div>
        </Link>
      </div>

      {/* Active jobs */}
      <div className="section-header">
        <div style={{ fontWeight: 600 }}>Your Active Listings</div>
        <Link to="/employer/post" style={{ fontSize: '0.8125rem', color: 'var(--accent)' }}>+ Post new</Link>
      </div>
      {jobs.length === 0 ? (
        <div className="card"><div className="empty-state"><div style={{ fontSize: '0.875rem' }}>No jobs posted yet.</div></div></div>
      ) : (
        jobs.slice(0, 5).map(job => (
          <div key={job._id} className="card card-hover" style={{ marginBottom: '0.75rem' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{job.title}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
                  {job.location} · {job.requirements?.length} skills · {format(new Date(job.createdAt), 'MMM d')}
                  {job.applicantCount > 0 && <span style={{ marginLeft: '0.75rem', color: 'var(--accent)' }}>{job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge ${job.active ? 'badge-green' : 'badge-muted'}`}>{job.active ? 'Active' : 'Closed'}</span>
                <Link to={`/employer/applicants?job=${job._id}`} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Users size={13} /> Applicants
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Post Job ────────────────────────────────────────────────────────────────
export function PostJobPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', location: '', remote: false,
    industry: '', jobType: 'full-time', salaryMin: '', salaryMax: '',
    companyName: '',
    requirements: [{ skillName: '', proficiency: 'intermediate', required: true }],
  });
  const [loading, setLoading] = useState(false);

  const addReq = () => setForm(f => ({ ...f, requirements: [...f.requirements, { skillName: '', proficiency: 'intermediate', required: true }] }));
  const removeReq = (i) => setForm(f => ({ ...f, requirements: f.requirements.filter((_, j) => j !== i) }));
  const updateReq = (i, field, val) => setForm(f => ({
    ...f, requirements: f.requirements.map((r, j) => j === i ? { ...r, [field]: val } : r)
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await jobsApi.postJob({
        ...form,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin) * 100000 : undefined,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax) * 100000 : undefined,
        requirements: form.requirements.filter(r => r.skillName),
      });
      qc.invalidateQueries(['employer-jobs']);
      toast.success('Job posted successfully! Candidates can now apply.');
      navigate('/employer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Hiring</div>
        <h1 className="display-lg">Post a <span className="accent-mark">Job</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>Structured skill requirements unlock verified-skill matching.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-body">
            <div className="display-sm" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Job Details</div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Job title</label>
                <input id="job-title" className="input" placeholder="e.g. Senior React Developer" required
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Company name</label>
                <input id="job-company" className="input" placeholder="Your company name"
                  value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Location</label>
                  <input id="job-location" className="input" placeholder="City or Remote"
                    value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Job type</label>
                  <select id="job-type" className="input" value={form.jobType} onChange={e => setForm(f => ({ ...f, jobType: e.target.value }))}>
                    {['full-time', 'part-time', 'contract', 'internship'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Salary min (L)</label>
                  <input id="job-salary-min" className="input" type="number" placeholder="e.g. 8 for ₹8L"
                    value={form.salaryMin} onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Salary max (L)</label>
                  <input id="job-salary-max" className="input" type="number" placeholder="e.g. 15 for ₹15L"
                    value={form.salaryMax} onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input id="job-remote" type="checkbox" checked={form.remote} onChange={e => setForm(f => ({ ...f, remote: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                <label htmlFor="job-remote" className="input-label" style={{ margin: 0 }}>Remote-friendly</label>
              </div>
              <div className="input-group">
                <label className="input-label">Industry</label>
                <select id="job-industry" className="input" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
                  <option value="">Select industry</option>
                  {['Technology', 'Healthcare', 'Finance', 'Banking', 'Education', 'Retail', 'Logistics', 'Hospitality', 'Construction', 'Manufacturing', 'Marketing', 'Legal'].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Job description</label>
                <textarea id="job-description" className="input" rows={5} placeholder="Describe the role, responsibilities, and what a great candidate looks like…" required
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div className="display-sm" style={{ fontSize: '0.85rem' }}>Skill Requirements</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>These power the verified-match engine. Be specific.</div>
              </div>
              <button type="button" id="add-requirement" className="btn btn-ghost btn-sm" onClick={addReq}>+ Add skill</button>
            </div>

            {form.requirements.map((req, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', marginBottom: '0.6rem', alignItems: 'center' }}>
                <input className="input" placeholder="Skill name" value={req.skillName}
                  onChange={e => updateReq(i, 'skillName', e.target.value)} />
                <select className="input" style={{ width: 'auto' }} value={req.proficiency}
                  onChange={e => updateReq(i, 'proficiency', e.target.value)}>
                  {['beginner', 'intermediate', 'advanced', 'expert'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button type="button" className={`btn btn-sm ${req.required ? 'btn-outline' : 'btn-ghost'}`}
                  onClick={() => updateReq(i, 'required', !req.required)} title={req.required ? 'Required' : 'Nice to have'}>
                  {req.required ? '★ Required' : '☆ Optional'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeReq(i)} style={{ color: 'var(--text-3)' }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link to="/employer" className="btn btn-ghost">Cancel</Link>
          <button id="post-job-submit" type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" />Posting…</> : <><Zap size={15} />Post Job</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Applicants Page (per-job) ────────────────────────────────────────────────
export function ApplicantsPage() {
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: () => employerApi.getMyJobs().then(r => r.data),
  });

  const { data: applicantsData, isLoading: appsLoading } = useQuery({
    queryKey: ['job-applicants', selectedJobId],
    queryFn: () => selectedJobId ? employerApi.getApplicants(selectedJobId).then(r => r.data) : null,
    enabled: !!selectedJobId,
  });

  const jobs = jobsData?.jobs || [];
  const applicants = applicantsData?.applicants || [];
  const selectedJob = applicantsData?.job;

  // Auto-select first job
  React.useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) setSelectedJobId(jobs[0]._id);
  }, [jobs]);

  return (
    <div className="animate-in" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Talent Pipeline</div>
        <h1 className="display-lg">Job <span className="accent-mark">Applicants</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>See verified candidates who applied for each specific role.</p>
      </div>

      {/* Job selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {jobsLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ width: 160, height: 36, borderRadius: 'var(--radius)' }} />)
        ) : jobs.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>No jobs posted yet. <Link to="/employer/post" style={{ color: 'var(--accent)' }}>Post one →</Link></div>
        ) : (
          jobs.map(job => (
            <button key={job._id}
              className={`btn btn-sm ${selectedJobId === job._id ? 'btn-outline' : 'btn-ghost'}`}
              onClick={() => { setSelectedJobId(job._id); setSelectedApplicant(null); }}>
              {job.title}
              {job.applicantCount > 0 && <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', color: 'var(--accent)' }}>({job.applicantCount})</span>}
            </button>
          ))
        )}
      </div>

      {selectedJobId && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedApplicant ? '1fr 380px' : '1fr', gap: '1.25rem' }}>
          {/* Applicant list */}
          <div>
            {appsLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
            ) : applicants.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <Users size={32} style={{ opacity: 0.3 }} />
                  <div style={{ color: 'var(--text-2)', fontWeight: 600 }}>No applicants yet</div>
                  <div style={{ fontSize: '0.875rem' }}>Share the job listing to attract candidates.</div>
                </div>
              </div>
            ) : (
              applicants.map((c, i) => (
                <div key={c.userId} className={`card card-hover animate-in`}
                  style={{ marginBottom: '0.75rem', animationDelay: `${i * 40}ms`, borderColor: selectedApplicant?.userId === c.userId ? 'var(--accent)' : undefined, cursor: 'pointer' }}
                  onClick={() => setSelectedApplicant(c.userId === selectedApplicant?.userId ? null : c)}>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                          <span className={`badge ${c.status === 'submitted' ? 'badge-green' : 'badge-amber'}`}>{c.status === 'pending_test' ? 'Test Pending' : 'Applied'}</span>
                          {c.verifiedSkills?.length > 0 && (
                            <span className="badge badge-accent"><Award size={11} /> {c.verifiedSkills.length} verified</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '0.35rem' }}>{c.headline}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>{c.location} · {c.email}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {c.skills?.slice(0, 5).map(s => (
                            <span key={s.skillName} className={`skill-pill ${s.verified ? 'verified' : ''}`}>{s.skillName}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `conic-gradient(var(--accent) ${c.matchScore * 3.6}deg, var(--surface-3) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                            {c.matchScore}%
                          </div>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>match</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail panel */}
          {selectedApplicant && (
            <div className="animate-in">
              <CandidateDetail candidate={selectedApplicant} onClose={() => setSelectedApplicant(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CandidateDetail({ candidate: c, onClose }) {
  return (
    <div className="card" style={{ position: 'sticky', top: '1.5rem' }}>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{c.headline}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>{c.location} · {c.email}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <hr className="divider" style={{ marginBottom: '1rem' }} />

        <div style={{ marginBottom: '1rem' }}>
          <div className="label" style={{ marginBottom: '0.6rem' }}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {c.skills?.map(s => (
              <span key={s.skillName} className={`skill-pill ${s.verified ? 'verified' : ''}`}>
                {s.skillName}
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{s.proficiency?.slice(0, 3)}</span>
                {s.verified && <CheckCircle size={10} />}
              </span>
            ))}
          </div>
        </div>

        <hr className="divider" style={{ marginBottom: '1rem' }} />

        {/* Verified credentials */}
        {c.verifiedSkills?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="label" style={{ marginBottom: '0.6rem' }}>Verified for This Role</div>
            {c.verifiedSkills.map(vs => (
              <div key={vs.skillName} style={{ padding: '0.6rem 0.75rem', background: 'rgba(62,207,110,0.06)', border: '1px solid rgba(62,207,110,0.25)', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <CheckCircle size={13} color="var(--green)" />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{vs.skillName}</span>
                  <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{vs.proficiencyLevel}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{vs.score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <hr className="divider" style={{ marginBottom: '1rem' }} />

        {/* All credentials */}
        <div>
          <div className="label" style={{ marginBottom: '0.6rem' }}>All Credentials</div>
          {c.credentials?.length === 0 ? (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>No credentials issued yet.</div>
          ) : (
            c.credentials?.map(cred => (
              <div key={cred.slug} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <Award size={13} color="var(--accent)" />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cred.skillName}</span>
                  <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{cred.proficiencyLevel}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{cred.score}%</span>
                </div>
                <a href={cred.verifyUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <ExternalLink size={11} /> Verify
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Page ────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['employer-analytics'],
    queryFn: () => employerApi.getAnalytics().then(r => r.data),
  });

  const summary = data?.summary || {};
  const perJob = data?.perJob || [];
  const topSkills = data?.topDemandSkills || [];

  return (
    <div className="animate-in" style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Insights</div>
        <h1 className="display-lg">Hiring <span className="accent-mark">Analytics</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>Performance metrics across your job listings.</p>
      </div>

      {isLoading ? (
        [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, marginBottom: '1rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Jobs', value: summary.totalJobs ?? 0, color: 'var(--accent)' },
              { label: 'Total Applicants', value: summary.totalApplicants ?? 0, color: 'var(--green)' },
              { label: 'Avg Match Score', value: summary.avgMatchScore ? `${summary.avgMatchScore}%` : '—', color: 'var(--blue)' },
            ].map(s => (
              <div key={s.label} className="card">
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.4rem' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Per-job breakdown */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <div style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Per-Job Breakdown</div>
              {perJob.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>No jobs data yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Job Title', 'Status', 'Applicants', 'Avg Score', 'Top Score'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-3)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perJob.map(j => (
                      <tr key={j.jobId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 500 }}>{j.jobTitle}</td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <span className={`badge ${j.active ? 'badge-green' : 'badge-muted'}`}>{j.active ? 'Active' : 'Closed'}</span>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-2)' }}>{j.applicants}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-2)' }}>{j.avgScore > 0 ? `${j.avgScore}%` : '—'}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--accent)', fontWeight: 600 }}>{j.topScore > 0 ? `${j.topScore}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Market demand skills */}
          {topSkills.length > 0 && (
            <div className="card">
              <div className="card-body">
                <div style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Top Skills in Market Demand</div>
                {topSkills.slice(0, 8).map((s, i) => {
                  const pct = Math.round((s.avgCount / (topSkills[0]?.avgCount || 1)) * 100);
                  return (
                    <div key={s.skillName} style={{ marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{s.skillName}</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>{s.avgCount.toLocaleString()}/mo</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { PostJobPage as EmployerPostJobPage };
export { ApplicantsPage as EmployerApplicantsPage };
export { AnalyticsPage as EmployerAnalyticsPage };
