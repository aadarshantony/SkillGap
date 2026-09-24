import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { pathsApi } from '../../api';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ChevronRight, Award, Zap } from 'lucide-react';

const STATUS_COLOR = { active: 'var(--accent)', completed: 'var(--green)', abandoned: 'var(--text-3)' };
const STATUS_BADGE = { active: 'badge-accent', completed: 'badge-green', abandoned: 'badge-muted' };

export default function PathsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['paths'],
    queryFn: () => pathsApi.getAll().then(r => r.data),
  });

  const paths = data?.paths || [];
  const active = paths.filter(p => p.status === 'active');
  const completed = paths.filter(p => p.status === 'completed');

  if (isLoading) return (
    <div style={{ maxWidth: 760 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  return (
    <div className="animate-in" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Learning</div>
        <h1 className="display-lg">My <span className="accent-mark">Paths</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
          {active.length} active · {completed.length} completed
        </p>
      </div>

      {paths.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <BookOpen size={32} style={{ opacity: 0.3 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>No paths yet</div>
            <div style={{ fontSize: '0.875rem' }}>Go to your dashboard and click "Learn" on any skill gap to generate a path.</div>
            <Link to="/dashboard" className="btn btn-outline" style={{ marginTop: '0.5rem' }}>View Dashboard</Link>
          </div>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div className="label" style={{ marginBottom: '0.75rem' }}>In Progress</div>
              {active.map((path, i) => <PathCard key={path._id} path={path} i={i} />)}
            </>
          )}
          {completed.length > 0 && (
            <>
              <div className="label" style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Completed</div>
              {completed.map((path, i) => <PathCard key={path._id} path={path} i={i} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}

function PathCard({ path, i }) {
  const done = path.steps.filter(s => s.completed).length;
  const pct = path.steps.length ? Math.round((done / path.steps.length) * 100) : 0;
  const totalMin = path.steps.reduce((a, s) => a + (s.estimatedMinutes || 0), 0);

  return (
    <Link to={`/paths/${path._id}`} style={{ display: 'block', textDecoration: 'none', marginBottom: '0.75rem' }}>
      <div className="card card-hover animate-in" style={{ animationDelay: `${i * 40}ms` }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>{path.skillName}</span>
                <span className={`badge ${STATUS_BADGE[path.status]}`}>{path.status}</span>
                <span className="badge badge-muted">{path.targetProficiency}</span>
              </div>

              {path.triggeredBy && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>
                  <Zap size={10} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                  Anchored to: {path.triggeredBy.jobTitle} @ {path.triggeredBy.companyName}
                </div>
              )}

              <div style={{ marginBottom: '0.5rem' }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: STATUS_COLOR[path.status] }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                <span><Clock size={11} style={{ verticalAlign: 'middle' }} /> {totalMin} min</span>
                <span>{done}/{path.steps.length} steps</span>
                {path.credentialId && <span style={{ color: 'var(--green)', display: 'flex', gap: '0.2rem', alignItems: 'center' }}><Award size={11} /> Credential issued</span>}
              </div>
            </div>
            <ChevronRight size={18} color="var(--text-3)" />
          </div>
        </div>
      </div>
    </Link>
  );
}
