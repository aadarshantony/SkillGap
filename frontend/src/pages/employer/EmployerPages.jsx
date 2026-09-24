import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerApi, jobsApi } from '../../api';
import { HeatmapChart } from '../../components/charts/Charts';
import toast from 'react-hot-toast';
import { Users, BarChart2, Briefcase, PlusSquare, Award, ChevronRight, CheckCircle, ExternalLink, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// ─── Employer Dashboard / Overview ───────────────────────────────────────────
export function EmployerDashboard() {
  const { data: jobsData } = useQuery({ queryKey: ['employer-jobs'], queryFn: () => employerApi.getMyJobs().then(r => r.data) });
  const { data: candData } = useQuery({ queryKey: ['employer-candidates'], queryFn: () => employerApi.getCandidates({}).then(r => r.data) });

  const jobs = jobsData?.jobs || [];
  const candidates = candData?.candidates || [];

  return (
    <div className="animate-in" style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Employer Dashboard</div>
        <h1 className="display-lg">Your <span className="accent-mark">Hiring</span> Pipeline</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Active Jobs', value: jobs.filter(j => j.active).length, icon: Briefcase, color: 'var(--accent)' },
          { label: 'Matched Candidates', value: candidates.length, icon: Users, color: 'var(--green)' },
          { label: 'Verified Skills on File', value: candidates.reduce((a, c) => a + (c.credentials?.length || 0), 0), icon: Award, color: 'var(--blue)' },
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
        <Link to="/employer/candidates" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Users size={20} color="var(--green)" />
            <div>
              <div style={{ fontWeight: 600 }}>Browse Candidates</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>Filtered by verified skills</div>
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
                  {job.location} · {job.requirements?.length} skill requirements · {format(new Date(job.createdAt), 'MMM d')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge ${job.active ? 'badge-green' : 'badge-muted'}`}>{job.active ? 'Active' : 'Closed'}</span>
                <Link to="/employer/candidates" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Users size={13} /> Candidates
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
      toast.success('Job posted successfully! Candidates are being matched.');
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
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>Structured requirements unlock verified-skill matching.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Basic */}
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
                  {['Technology', 'Healthcare', 'Retail', 'Logistics', 'Hospitality', 'Finance', 'Construction', 'Marketing'].map(i => <option key={i}>{i}</option>)}
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

        {/* Requirements */}
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
            {loading ? <><span className="spinner" /> Posting…</> : <><Zap size={15} /> Post Job</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Candidates Page ──────────────────────────────────────────────────────────
export function CandidatesPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [minScore, setMinScore] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['employer-candidates', minScore],
    queryFn: () => employerApi.getCandidates({ minScore }).then(r => r.data),
  });

  const { data: detailData } = useQuery({
    queryKey: ['candidate-detail', selectedId],
    queryFn: () => selectedId ? employerApi.getCandidate(selectedId).then(r => r.data) : null,
    enabled: !!selectedId,
  });

  const candidates = data?.candidates || [];

  return (
    <div className="animate-in" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Talent Pool</div>
        <h1 className="display-lg">Verified <span className="accent-mark">Candidates</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>Sorted by match score against your open roles. Only verified skills shown.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>Min match:</label>
        {[0, 40, 60, 80].map(s => (
          <button key={s} className={`btn btn-sm ${minScore === s ? 'btn-outline' : 'btn-ghost'}`}
            onClick={() => setMinScore(s)}>{s === 0 ? 'Any' : `${s}%+`}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedId ? '1fr 400px' : '1fr', gap: '1.25rem' }}>
        {/* List */}
        <div>
          {isLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
          ) : candidates.length === 0 ? (
            <div className="card"><div className="empty-state">No candidates match at {minScore}%+ yet.</div></div>
          ) : (
            candidates.map((c, i) => (
              <div key={c.userId} className={`card card-hover animate-in`}
                style={{ marginBottom: '0.75rem', animationDelay: `${i * 40}ms`, borderColor: selectedId === c.userId ? 'var(--accent)' : undefined, cursor: 'pointer' }}
                onClick={() => setSelectedId(c.userId === selectedId ? null : c.userId)}>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        {c.credentials?.filter(cr => cr.status === 'active').length > 0 && (
                          <span className="badge badge-green">
                            <Award size={11} /> {c.credentials.filter(cr => cr.status === 'active').length} verified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '0.4rem' }}>{c.headline}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{c.location} · {c.industry}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' }}>
                        {c.skills?.slice(0, 5).map(s => (
                          <span key={s.skillName} className={`skill-pill ${s.verified ? 'verified' : ''}`}>{s.skillName}</span>
                        ))}
                      </div>
                    </div>
                    {/* Match score ring */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: `conic-gradient(var(--accent) ${c.bestMatchScore * 3.6}deg, var(--surface-3) 0)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                          {c.bestMatchScore}%
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
        {selectedId && detailData?.candidate && (
          <div className="animate-in">
            <CandidateDetail candidate={detailData.candidate} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
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

        {/* Skills */}
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

        {/* Credentials / verification trail */}
        <div>
          <div className="label" style={{ marginBottom: '0.6rem' }}>Verification Trail</div>
          {c.credentials?.length === 0 ? (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>No credentials issued yet.</div>
          ) : (
            c.credentials?.map(cred => (
              <div key={cred.slug} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <Award size={13} color="var(--accent)" />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cred.skillName}</span>
                  <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{cred.proficiencyLevel}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Score: {cred.score}%</span>
                </div>
                {cred.anchoredTo?.jobTitle && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.35rem' }}>
                    Anchored: {cred.anchoredTo.jobTitle} @ {cred.anchoredTo.companyName}
                    <span style={{ marginLeft: '0.5rem' }}>({format(new Date(cred.anchoredTo.snapshotDate || cred.issuedAt), 'MMM d, yyyy')})</span>
                  </div>
                )}
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

// ─── Skill Heatmap Page ───────────────────────────────────────────────────────
export function HeatmapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['heatmap'],
    queryFn: () => employerApi.getHeatmap({}).then(r => r.data),
  });

  const heatmap = data?.heatmap || [];

  return (
    <div className="animate-in" style={{ maxWidth: 860 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Market Intelligence</div>
        <h1 className="display-lg">Skill <span className="accent-mark">Heatmap</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>Which skills are hardest to find in the verified candidate pool for your open roles.</p>
      </div>

      {isLoading ? <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} /> : (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} /> Scarcity (shortage in pool)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--surface-3)' }} /> Supply rate (% of candidates who have it)
              </div>
            </div>
            <HeatmapChart data={heatmap} />
          </div>
        </div>
      )}

      {/* Table */}
      {heatmap.length > 0 && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <div className="card-body">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Skill', 'In your jobs', 'Candidates w/ skill', 'Verified', 'Scarcity'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-3)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map(row => (
                  <tr key={row.skillName} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 500 }}>{row.skillName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-2)' }}>{row.jobCount}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-2)' }}>{row.candidatesWithSkill} <span style={{ color: 'var(--text-3)' }}>({row.supplyRate}%)</span></td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--green)' }}>{row.candidatesVerified}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span className={`badge ${row.scarcity > 70 ? 'badge-red' : row.scarcity > 40 ? 'badge-amber' : 'badge-green'}`}>{row.scarcity}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export { PostJobPage as EmployerPostJobPage };
export { CandidatesPage as EmployerCandidatesPage };
export { HeatmapPage as EmployerHeatmapPage };

