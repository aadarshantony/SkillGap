import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { credentialsApi } from '../../api';
import { Award, ExternalLink, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const PROFICIENCY_COLOR = { beginner: 'var(--blue)', intermediate: 'var(--amber)', advanced: 'var(--green)', expert: 'var(--accent)' };
const STATUS_ICON = {
  active: <CheckCircle size={14} color="var(--green)" />,
  expired: <XCircle size={14} color="var(--red)" />,
  flagged: <AlertTriangle size={14} color="var(--amber)" />,
};

export default function CredentialsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: () => credentialsApi.getMine().then(r => r.data),
  });

  const credentials = data?.credentials || [];
  const active = credentials.filter(c => c.status === 'active').length;

  return (
    <div className="animate-in" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="label" style={{ marginBottom: '0.4rem' }}>Verified Skills</div>
        <h1 className="display-lg">My <span className="accent-mark">Credentials</span></h1>
        <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
          {active} active credential{active !== 1 ? 's' : ''} · Share these links on your resume or LinkedIn.
        </p>
      </div>

      {isLoading ? (
        [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : credentials.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Award size={36} style={{ opacity: 0.25 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>No credentials yet</div>
            <div style={{ fontSize: '0.875rem' }}>Complete a learning path's checkpoint to earn your first verified credential.</div>
            <Link to="/paths" className="btn btn-outline" style={{ marginTop: '0.5rem' }}>Go to My Paths</Link>
          </div>
        </div>
      ) : (
        credentials.map((cred, i) => (
          <div key={cred._id} className="card card-hover animate-in" style={{ marginBottom: '0.75rem', animationDelay: `${i * 40}ms`, borderColor: cred.marketDriftFlag ? 'var(--amber)' : undefined }}>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <Award size={16} color={PROFICIENCY_COLOR[cred.proficiencyLevel]} />
                    <span style={{ fontWeight: 600 }}>{cred.skillName}</span>
                    <span className="badge" style={{ background: 'transparent', border: `1px solid ${PROFICIENCY_COLOR[cred.proficiencyLevel]}`, color: PROFICIENCY_COLOR[cred.proficiencyLevel] }}>
                      {cred.proficiencyLevel}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {STATUS_ICON[cred.status]}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{cred.status}</span>
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span>Score: <strong style={{ color: 'var(--text-2)' }}>{cred.score}%</strong></span>
                    <span><Clock size={11} style={{ verticalAlign: 'middle' }} /> Issued {format(new Date(cred.issuedAt), 'MMM d, yyyy')}</span>
                    {cred.expiresAt && <span>Expires {format(new Date(cred.expiresAt), 'MMM d, yyyy')}</span>}
                  </div>

                  {cred.anchoredTo?.jobTitle && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>
                      Anchored to: <span style={{ color: 'var(--text-2)' }}>{cred.anchoredTo.jobTitle}</span> @ {cred.anchoredTo.companyName}
                    </div>
                  )}

                  {cred.marketDriftFlag && (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--amber)', background: 'rgba(240,160,64,0.1)', padding: '0.4rem 0.7rem', borderRadius: 'var(--radius)', marginTop: '0.4rem' }}>
                      <AlertTriangle size={12} />
                      {cred.marketDriftNote || 'Market standards have shifted — consider refreshing this credential.'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <a
                    href={`/verify/${cred.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    id={`verify-link-${cred.slug}`}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ExternalLink size={13} /> Verify link
                  </a>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/verify/${cred.slug}`); }}
                    style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
