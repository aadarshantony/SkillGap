import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, User, Building2, ArrowRight } from 'lucide-react';

const Page = ({ children }) => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
    {children}
  </div>
);

const Card = ({ children, wide }) => (
  <div style={{ width: '100%', maxWidth: wide ? 520 : 440, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }} className="animate-in">
    {children}
  </div>
);

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
    <span className="display-sm" style={{ color: 'var(--text)', fontSize: '1.1rem' }}>Skill<span className="accent-mark">Gap</span></span>
  </div>
);

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { user, setAuth } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'employer' ? '/employer' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const fillDemo = (email) => setForm({ email, password: 'password123' });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'employer' ? '/employer' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Card>
        <Logo />
        <h1 className="display-md" style={{ marginBottom: '0.35rem' }}>Sign In</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '2rem' }}>Continue your path to verified skills.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <input id="login-email" className="input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoComplete="email" />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="login-password" className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ paddingRight: '2.75rem' }} required autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', display: 'flex', padding: '0.25rem' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button id="login-submit" className="btn btn-primary btn-lg" type="submit" disabled={loading}
            style={{ marginTop: '0.5rem', justifyContent: 'center', width: '100%' }}>
            {loading ? <><span className="spinner" /><span>Signing in…</span></> : <><span>Sign In</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-3)' }}>
          New to SkillGap?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 500 }}>Create an account</Link>
        </div>

        {/* Quick demo logins */}
        <div style={{ marginTop: '1.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: '0.75rem' }}>Quick Demo Access</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { email: 'ananya.hr@email.com', label: 'Ananya Varma', sub: 'Learner — HR Specialist', icon: User, color: 'var(--blue)' },
              { email: 'arjun.tech@email.com', label: 'Arjun Mehta', sub: 'Learner — Tech & Full Stack', icon: User, color: 'var(--green)' },
              { email: 'sunita@apexcorp.com', label: 'Sunita Rao', sub: 'Employer — Apex Global', icon: Building2, color: 'var(--accent)' },
              { email: 'karan@techspark.io', label: 'Karan Malhotra', sub: 'Employer — TechSpark Systems', icon: Building2, color: 'var(--amber)' },
            ].map(({ email, label, sub, icon: Icon, color }) => (
              <button key={email} type="button"
                onClick={() => fillDemo(email)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.6rem', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'border-color 140ms', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <Icon size={14} color={color} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.6rem' }}>Password for all: <code style={{ color: 'var(--accent)' }}>password123</code></div>
        </div>
      </Card>
    </Page>
  );
}

export function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', companyName: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { user, setAuth } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'employer' ? '/employer' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.role) { toast.error('Please select a role to continue'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.signup(form);
      setAuth(data.user, data.token);
      toast.success(`Account created! Welcome, ${data.user.name}.`);
      navigate(data.user.role === 'employer' ? '/employer' : '/onboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Card wide>
        <Logo />
        <h1 className="display-md" style={{ marginBottom: '0.35rem' }}>Create Account</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '2rem' }}>Build your verified skills profile and land jobs faster.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Full name</label>
              <input id="signup-name" className="input" type="text" placeholder="Your name"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoComplete="name" />
            </div>
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input id="signup-email" className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoComplete="email" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="signup-password" className="input" type={showPw ? 'text' : 'password'} placeholder="Minimum 8 characters"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ paddingRight: '2.75rem' }} required minLength={8} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', display: 'flex', padding: '0.25rem' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">I am a</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { value: 'learner', label: 'Job Seeker', desc: 'Find roles, build skills, earn verified credentials', icon: User, color: 'var(--blue)' },
                { value: 'employer', label: 'Employer', desc: 'Post jobs, find skill-verified candidates', icon: Building2, color: 'var(--accent)' },
              ].map(r => (
                <button key={r.value} type="button" id={`role-${r.value}`}
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  style={{
                    padding: '1rem', textAlign: 'left', cursor: 'pointer',
                    border: `1.5px solid ${form.role === r.value ? r.color : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    background: form.role === r.value ? `rgba(${r.color === 'var(--accent)' ? '212,255,71' : '74,158,240'},0.07)` : 'var(--surface-2)',
                    transition: 'all var(--transition)',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <r.icon size={15} color={form.role === r.value ? r.color : 'var(--text-3)'} />
                    <div style={{ fontWeight: 600, color: form.role === r.value ? r.color : 'var(--text)', fontSize: '0.9rem' }}>{r.label}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.4 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {form.role === 'employer' && (
            <div className="input-group animate-in">
              <label className="input-label">Company name</label>
              <input id="signup-company" className="input" type="text" placeholder="Your company"
                value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} required />
            </div>
          )}

          <button id="signup-submit" className="btn btn-primary btn-lg" type="submit" disabled={loading || !form.role}
            style={{ marginTop: '0.5rem', justifyContent: 'center', width: '100%' }}>
            {loading ? <><span className="spinner" /><span>Creating account…</span></> : <><span>Create Account</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign in</Link>
        </div>
      </Card>
    </Page>
  );
}
