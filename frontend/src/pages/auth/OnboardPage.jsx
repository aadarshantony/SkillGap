import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, User, ChevronRight, CheckCircle, AlertCircle, X, Plus, Trash2, Zap } from 'lucide-react';
import { profileApi, skillsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

const PROFICIENCY_OPTS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function OnboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [mode, setMode] = useState(null); // 'upload' | 'manual'
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const [aiConfidence, setAiConfidence] = useState(null);

  const [form, setForm] = useState({
    headline: '', location: '', industry: '', phone: '',
    education: [],
    workHistory: [],
    skills: [],
  });

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      toast.error('Supported: PDF, DOCX, DOC, TXT');
      return;
    }
    setUploading(true);
    try {
      const { data } = await profileApi.parseResume(file);
      const p = data.prefilled;
      setAiDraft(p);
      setAiConfidence(Math.round((p.aiConfidence || 0.7) * 100));
      setForm({
        headline: p.headline || '',
        location: p.location || '',
        industry: p.industry || '',
        phone: p.phone || '',
        education: p.education || [],
        workHistory: p.workHistory || [],
        skills: p.skills || [],
      });
      setMode('manual'); // show review form
      toast.success('Resume parsed! Review and confirm below.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Resume parsing failed');
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => setForm(f => ({ ...f, skills: [...f.skills, { skillName: '', proficiency: 'intermediate', verified: false, source: 'manual' }] }));
  const removeSkill = (i) => setForm(f => ({ ...f, skills: f.skills.filter((_, j) => j !== i) }));
  const updateSkill = (i, key, val) => setForm(f => ({ ...f, skills: f.skills.map((s, j) => j === i ? { ...s, [key]: val } : s) }));

  const addEdu = () => setForm(f => ({ ...f, education: [...f.education, { institution: '', degree: '', field: '', year: '' }] }));
  const removeEdu = (i) => setForm(f => ({ ...f, education: f.education.filter((_, j) => j !== i) }));
  const updateEdu = (i, key, val) => setForm(f => ({ ...f, education: f.education.map((e, j) => j === i ? { ...e, [key]: val } : e) }));

  const addWork = () => setForm(f => ({ ...f, workHistory: [...f.workHistory, { title: '', company: '', duration: '', description: '' }] }));
  const removeWork = (i) => setForm(f => ({ ...f, workHistory: f.workHistory.filter((_, j) => j !== i) }));
  const updateWork = (i, key, val) => setForm(f => ({ ...f, workHistory: f.workHistory.map((w, j) => j === i ? { ...w, [key]: val } : w) }));

  const handleSave = async () => {
    if (!form.headline) { toast.error('Add a professional headline'); return; }
    if (form.skills.length === 0) { toast.error('Add at least one skill'); return; }
    const emptySkills = form.skills.filter(s => !s.skillName.trim());
    if (emptySkills.length) { toast.error('Fill in all skill names'); return; }
    setSaving(true);
    try {
      await profileApi.update({
        ...form,
        resumeSource: aiDraft ? 'upload' : 'manual',
        profileComplete: true,
      });
      toast.success('Profile saved! Taking you to your dashboard.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Step 1: Choose method
  if (!mode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 560 }} className="animate-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <span className="display-sm" style={{ fontSize: '1.1rem' }}>Skill<span className="accent-mark">Gap</span></span>
          </div>

          <h1 className="display-lg" style={{ marginBottom: '0.5rem' }}>
            Build Your <span className="accent-mark">Profile</span>
          </h1>
          <p style={{ color: 'var(--text-2)', marginBottom: '2.5rem' }}>
            Welcome, {user?.name}! Let's set up your skill profile so we can find your best-fit opportunities.
          </p>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <button onClick={() => fileRef.current?.click()}
              style={{ padding: '1.5rem', border: '1.5px dashed var(--accent)', borderRadius: 'var(--radius-lg)', background: 'var(--accent-dim)', cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,255,71,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(212,255,71,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={20} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem' }}>Upload my Resume</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>AI extracts your skills, education, and experience automatically</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>PDF, DOCX, DOC, TXT — up to 10MB</div>
                </div>
                <ChevronRight size={18} color="var(--accent)" style={{ marginLeft: 'auto' }} />
              </div>
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />

            <button onClick={() => setMode('manual')}
              style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, background: 'var(--surface-2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--text-2)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem' }}>Fill out manually</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>Enter your skills and details step by step</div>
                </div>
                <ChevronRight size={18} color="var(--text-3)" style={{ marginLeft: 'auto' }} />
              </div>
            </button>
          </div>

          {uploading && (
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span className="spinner" />
              <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>Parsing resume with AI… this may take a moment</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Form (manual or AI-prefilled)
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <span className="display-sm" style={{ fontSize: '1.1rem' }}>Skill<span className="accent-mark">Gap</span></span>
        </div>

        {aiDraft && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: aiConfidence >= 70 ? 'rgba(62,207,110,0.08)' : 'rgba(240,160,64,0.08)', border: `1px solid ${aiConfidence >= 70 ? 'var(--green)' : 'var(--amber)'}`, borderRadius: 'var(--radius)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }} className="animate-in">
            {aiConfidence >= 70 ? <CheckCircle size={16} color="var(--green)" style={{ marginTop: '2px', flexShrink: 0 }} /> : <AlertCircle size={16} color="var(--amber)" style={{ marginTop: '2px', flexShrink: 0 }} />}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: aiConfidence >= 70 ? 'var(--green)' : 'var(--amber)' }}>
                AI extracted your profile ({aiConfidence}% confidence)
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: '0.2rem' }}>
                Review everything below carefully. Nothing is saved until you click "Save Profile".
              </div>
            </div>
          </div>
        )}

        <h1 className="display-md" style={{ marginBottom: '1.5rem' }}>
          {aiDraft ? 'Review Your' : 'Build Your'} <span className="accent-mark">Profile</span>
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Basic Info */}
          <div className="card animate-in">
            <div className="card-body">
              <div className="display-sm" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Basic Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Professional headline *</label>
                  <input className="input" placeholder='e.g. "Full-Stack Developer | 3 years exp."'
                    value={form.headline} onChange={e => setField('headline', e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Location</label>
                  <input className="input" placeholder="City, Country"
                    value={form.location} onChange={e => setField('location', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Industry</label>
                  <select className="input" value={form.industry} onChange={e => setField('industry', e.target.value)}>
                    <option value="">Select industry</option>
                    {['Technology', 'Healthcare', 'Retail', 'Logistics', 'Hospitality', 'Finance', 'Construction', 'Marketing', 'Education', 'Other'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="card animate-in">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div className="display-sm" style={{ fontSize: '0.85rem' }}>Your Skills *</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>These drive your gap analysis and job matching</div>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addSkill}>
                  <Plus size={14} /> Add skill
                </button>
              </div>

              {form.skills.length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-3)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                  No skills added yet — click "Add skill"
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {form.skills.map((s, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                    <input className="input" placeholder="Skill name (e.g. Python, Customer Service)"
                      value={s.skillName} onChange={e => updateSkill(i, 'skillName', e.target.value)} />
                    <select className="input" style={{ width: 'auto' }} value={s.proficiency}
                      onChange={e => updateSkill(i, 'proficiency', e.target.value)}>
                      {PROFICIENCY_OPTS.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <button type="button" className="btn btn-icon btn-ghost" onClick={() => removeSkill(i)} title="Remove">
                      <Trash2 size={14} color="var(--text-3)" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="card animate-in">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div className="display-sm" style={{ fontSize: '0.85rem' }}>Education</div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addEdu}><Plus size={14} /> Add</button>
              </div>
              {form.education.map((e, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: i < form.education.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <input className="input" placeholder="Institution" value={e.institution} onChange={ev => updateEdu(i, 'institution', ev.target.value)} />
                  <input className="input" placeholder="Degree (e.g. B.Tech)" value={e.degree} onChange={ev => updateEdu(i, 'degree', ev.target.value)} />
                  <input className="input" placeholder="Field of study" value={e.field} onChange={ev => updateEdu(i, 'field', ev.target.value)} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input" placeholder="Year" type="number" value={e.year} onChange={ev => updateEdu(i, 'year', ev.target.value)} />
                    <button type="button" className="btn btn-icon btn-ghost" onClick={() => removeEdu(i)}><X size={14} /></button>
                  </div>
                </div>
              ))}
              {form.education.length === 0 && <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>No education entries — optional</p>}
            </div>
          </div>

          {/* Work History */}
          <div className="card animate-in">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div className="display-sm" style={{ fontSize: '0.85rem' }}>Work History</div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addWork}><Plus size={14} /> Add</button>
              </div>
              {form.workHistory.map((w, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: i < form.workHistory.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <input className="input" placeholder="Job title" value={w.title} onChange={ev => updateWork(i, 'title', ev.target.value)} />
                  <input className="input" placeholder="Company" value={w.company} onChange={ev => updateWork(i, 'company', ev.target.value)} />
                  <input className="input" placeholder="Duration (e.g. 2021–2023)" value={w.duration} onChange={ev => updateWork(i, 'duration', ev.target.value)} />
                  <button type="button" className="btn btn-icon btn-ghost" onClick={() => removeWork(i)} style={{ justifySelf: 'start' }}><X size={14} /></button>
                  <textarea className="input" placeholder="Brief description" rows={2} value={w.description} onChange={ev => updateWork(i, 'description', ev.target.value)} style={{ gridColumn: '1 / -1', resize: 'vertical' }} />
                </div>
              ))}
              {form.workHistory.length === 0 && <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>No work history entries — optional</p>}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setMode(null)}>Back</button>
            <button type="button" className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" />Saving…</> : <><CheckCircle size={16} />Save Profile & Continue</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
