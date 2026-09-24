import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { employerApi } from '../../api';
import toast from 'react-hot-toast';
import { Sparkles, CheckCircle, AlertTriangle, Zap, FileText, ArrowRight, Copy, Check } from 'lucide-react';

export default function JdToolsPage() {
  const [form, setForm] = useState({
    title: 'Senior HR Manager',
    location: 'Mumbai, India',
    salaryMin: '12',
    salaryMax: '18',
    description: 'We are seeking a rockstar ninja Senior HR Manager to oversee employee grievance mechanisms, handle labor compliance, manage 10+ years experience, and synergy with team leads.',
    requirements: [
      { skillName: 'HR Compliance', proficiency: 'advanced', required: true },
      { skillName: 'Talent Acquisition', proficiency: 'advanced', required: true },
    ],
  });

  const [copied, setCopied] = useState(false);

  // Analyzer Mutation
  const analyzeMutation = useMutation({
    mutationFn: (data) => employerApi.analyzeJd(data).then(r => r.data),
    onError: (err) => toast.error(err.response?.data?.error || 'Analysis failed'),
  });

  // Requirement Inspector Mutation
  const inspectMutation = useMutation({
    mutationFn: (data) => employerApi.detectRequirements(data).then(r => r.data),
    onError: (err) => toast.error(err.response?.data?.error || 'Inspection failed'),
  });

  const handleRunAnalysis = () => {
    analyzeMutation.mutate(form);
    inspectMutation.mutate(form);
  };

  const copyBetterJd = () => {
    if (inspectMutation.data?.betterJd) {
      navigator.clipboard.writeText(inspectMutation.data.betterJd);
      setCopied(true);
      toast.success('Optimized JD copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quality = analyzeMutation.data;
  const inspection = inspectMutation.data;

  return (
    <div className="animate-in" style={{ maxWidth: 1040 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Employer AI Toolkit</div>
        <h1 className="display-lg">
          JD Quality <span className="accent-mark">Analyzer</span> & AI Optimizer
        </h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
          Evaluate job description clarity, detect realistic skill requirements vs AI fluff, and generate structured JDs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: Input Form */}
        <div className="card">
          <div className="card-body">
            <div className="display-sm" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>Job Description Input</div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Job Title</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior HR Manager" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Location</label>
                <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City or Remote" />
              </div>
              <div className="input-group">
                <label className="input-label">Salary Range (Lakhs)</label>
                <input className="input" value={`${form.salaryMin} - ${form.salaryMax}`} onChange={e => {
                  const parts = e.target.value.split('-');
                  setForm(f => ({ ...f, salaryMin: parts[0]?.trim() || '', salaryMax: parts[1]?.trim() || '' }));
                }} placeholder="e.g. 12 - 18" />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">Job Description Text</label>
              <textarea className="input" rows={7} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Paste or type your job description here…" />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleRunAnalysis} disabled={analyzeMutation.isPending}>
              {analyzeMutation.isPending ? <><span className="spinner" /> Analyzing…</> : <><Sparkles size={16} /> Analyze JD Quality & Realism</>}
            </button>
          </div>
        </div>

        {/* Right: Results & Insights */}
        <div>
          {/* Analysis Score Card */}
          {quality ? (
            <div className="card animate-in" style={{ marginBottom: '1.25rem', borderLeft: '4px solid var(--accent)' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>Quality Score: {quality.qualityScore}/100</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{quality.summary}</div>
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(212,255,71,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                    {quality.grade}
                  </div>
                </div>

                {/* Strengths */}
                {quality.strengths?.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Strengths</div>
                    {quality.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                        <CheckCircle size={12} color="var(--green)" /> {s}
                      </div>
                    ))}
                  </div>
                )}

                {/* Improvements */}
                {quality.improvements?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Suggestions to Improve</div>
                    {quality.improvements.map((imp, i) => (
                      <div key={i} style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-2)', marginBottom: '0.2rem' }}>
                        <AlertTriangle size={12} color="var(--amber)" /> {imp}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div className="card-body" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                <FileText size={32} color="var(--text-3)" style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
                <div style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Click "Analyze JD Quality" to inspect readability, market alignment, and realistic requirements.</div>
              </div>
            </div>
          )}

          {/* Realism Inspector & AI Generated JD */}
          {inspection && (
            <div className="card animate-in">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Requirements & Realism Audit</div>
                  <span className={`badge ${inspection.realismStatus.includes('Realistic') ? 'badge-green' : 'badge-amber'}`}>
                    {inspection.realismStatus}
                  </span>
                </div>

                {/* Red Flags */}
                {inspection.redFlags?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    {inspection.redFlags.map((rf, i) => (
                      <div key={i} style={{ padding: '0.6rem 0.75rem', background: 'rgba(240,74,74,0.08)', border: '1px solid rgba(240,74,74,0.25)', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--red)', marginBottom: '0.1rem' }}>⚠️ {rf.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{rf.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detected Skills */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.4rem' }}>Detected Requirements in Text:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {inspection.detectedSkills?.map((s, i) => (
                      <span key={i} className="skill-pill verified">
                        {s.skillName} ({s.suggestedProficiency})
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Restructured JD preview */}
                {inspection.betterJd && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>⚡ AI-Optimized JD Preview:</span>
                      <button className="btn btn-ghost btn-xs" onClick={copyBetterJd}>
                        {copied ? <><Check size={11} color="var(--green)" /> Copied!</> : <><Copy size={11} /> Copy JD</>}
                      </button>
                    </div>
                    <pre style={{ background: 'var(--surface-2)', padding: '0.85rem', borderRadius: 'var(--radius)', fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: 'var(--text-2)', maxHeight: 200, overflowY: 'auto' }}>
                      {inspection.betterJd}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
