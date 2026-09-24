import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pathsApi } from '../../api';
import toast from 'react-hot-toast';
import {
  BookOpen, CheckCircle, Clock, ChevronLeft, Award, ExternalLink,
  Play, AlertTriangle, X, ChevronRight, Timer, Zap, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

const STEP_ICONS = {
  read: '📖', watch: '🎬', practice: '💻', project: '🛠', checkpoint: '🎯'
};

function TestModal({ pathId, skillName, onClose, onPass }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime] = useState(Date.now());

  React.useEffect(() => {
    pathsApi.getTest(pathId).then(r => {
      setTest(r.data.test);
      setLoading(false);
    }).catch(err => {
      toast.error(err.response?.data?.error || 'Failed to load test');
      onClose();
    });
  }, [pathId]);

  const handleSubmit = async () => {
    const answered = Object.keys(answers).length;
    if (answered < (test?.questions?.length || 0)) {
      toast.error(`Please answer all ${test.questions.length} questions`);
      return;
    }
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qi, opt]) => ({
        questionIndex: parseInt(qi),
        selectedOption: opt,
      }));
      const timeTaken = Math.round((Date.now() - startTime) / 60000);
      const { data } = await pathsApi.submitCheckpoint(pathId, { answers: formattedAnswers, timeTakenMinutes: timeTaken });
      setResult(data);
      if (data.passed) onPass(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ padding: '3rem', textAlign: 'center' }}>
        <span className="spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem' }} />
        <div style={{ color: 'var(--text-2)' }}>Loading your skill assessment…</div>
      </div>
    </div>
  );

  if (result) return (
    <div className="modal-backdrop">
      <div className="modal-box animate-scale">
        <div className="modal-body" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          {result.passed ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h2 className="display-md" style={{ color: 'var(--green)', marginBottom: '0.75rem' }}>You Passed!</h2>
              <div style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', lineHeight: 1, marginBottom: '0.5rem' }}>{result.score}%</div>
              <div style={{ color: 'var(--text-2)', marginBottom: '1.5rem' }}>
                {result.correctAnswers}/{result.totalQuestions} correct · Passing: {result.passingScore}%
              </div>
              <div style={{ padding: '1rem', background: 'rgba(62,207,110,0.08)', border: '1px solid rgba(62,207,110,0.25)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
                <Award size={16} color="var(--green)" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: '0.25rem' }}>Credential Issued!</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>Your {skillName} credential is now live and verifiable.</div>
              </div>
              <button className="btn btn-primary" onClick={() => { onClose(); }}>
                <CheckCircle size={15} /> View My Credentials
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <h2 className="display-md" style={{ marginBottom: '0.75rem' }}>Not quite yet</h2>
              <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--amber)', lineHeight: 1, marginBottom: '0.5rem' }}>{result.score}%</div>
              <div style={{ color: 'var(--text-2)', marginBottom: '1rem' }}>
                {result.correctAnswers}/{result.totalQuestions} correct · Need: {result.passingScore}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginBottom: '1.5rem' }}>{result.message}</div>
              <button className="btn btn-primary" onClick={onClose}>Got it — keep studying</button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop">
      <div className="modal-box animate-scale" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div>
            <div className="display-sm" style={{ fontSize: '1rem' }}>{skillName} Assessment</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>
              {test?.questions?.length} questions · {test?.timeLimit} min · Pass: {test?.passingScore}%
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Timer size={14} /> {Object.keys(answers).length}/{test?.questions?.length} answered
            </div>
            <button className="btn btn-icon btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="modal-body">
          {test?.questions?.map((q, qi) => (
            <div key={qi} style={{ marginBottom: '1.75rem', paddingBottom: '1.75rem', borderBottom: qi < test.questions.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: answers[qi] !== undefined ? 'var(--accent)' : 'var(--surface-3)', color: answers[qi] !== undefined ? '#0a0a0a' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, transition: 'all var(--transition)' }}>
                  {qi + 1}
                </div>
                <div style={{ fontWeight: 500, lineHeight: 1.5 }}>{q.text}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '2rem' }}>
                {q.options.map((opt, oi) => (
                  <button key={oi} type="button"
                    onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                    style={{
                      padding: '0.75rem 1rem', textAlign: 'left', borderRadius: 'var(--radius)',
                      border: `1px solid ${answers[qi] === oi ? 'var(--accent)' : 'var(--border)'}`,
                      background: answers[qi] === oi ? 'var(--accent-dim)' : 'var(--surface-2)',
                      color: answers[qi] === oi ? 'var(--accent)' : 'var(--text-2)',
                      cursor: 'pointer', fontSize: '0.875rem', fontWeight: answers[qi] === oi ? 500 : 400,
                      transition: 'all var(--transition)', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${answers[qi] === oi ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {answers[qi] === oi && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner" />Submitting…</> : <><Zap size={15} />Submit Assessment</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PathDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showTest, setShowTest] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['path', id],
    queryFn: () => pathsApi.getOne(id).then(r => r.data),
  });

  const completeStep = useMutation({
    mutationFn: (order) => pathsApi.completeStep(id, order).then(r => r.data),
    onSuccess: (_, order) => {
      qc.invalidateQueries(['path', id]);
      qc.invalidateQueries(['my-paths']);
      toast.success('Step completed!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to mark step'),
  });

  if (isLoading) return (
    <div className="animate-in" style={{ maxWidth: 760 }}>
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  if (isError || !data?.path) return (
    <div className="empty-state">
      <AlertTriangle size={32} />
      <div>Path not found</div>
      <Link to="/paths" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Back to paths</Link>
    </div>
  );

  const path = data.path;
  const total = path.steps?.length || 0;
  const done = path.steps?.filter(s => s.completed).length || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allNonCheckpointDone = path.steps?.filter(s => s.type !== 'checkpoint').every(s => s.completed);
  const isCompleted = path.status === 'completed';

  const handleTestPass = (result) => {
    qc.invalidateQueries(['path', id]);
    qc.invalidateQueries(['my-paths']);
    qc.invalidateQueries(['my-credentials']);
    setShowTest(false);
    navigate('/credentials');
  };

  return (
    <div className="animate-in" style={{ maxWidth: 760 }}>
      {showTest && (
        <TestModal
          pathId={id}
          skillName={path.skillName}
          onClose={() => setShowTest(false)}
          onPass={handleTestPass}
        />
      )}

      <Link to="/paths" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        <ChevronLeft size={16} /> All Paths
      </Link>

      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div className="label" style={{ marginBottom: '0.3rem' }}>Learning Path</div>
              <h1 className="display-md">{path.skillName}</h1>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge badge-blue">{path.targetProficiency}</span>
                {isCompleted && <span className="badge badge-green"><CheckCircle size={11} /> Completed</span>}
                {path.triggeredBy?.companyName && (
                  <span className="badge badge-muted">For: {path.triggeredBy.companyName}</span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="stat-num" style={{ color: 'var(--accent)' }}>{pct}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Complete</div>
            </div>
          </div>

          <div className="progress-track" style={{ height: 6, marginBottom: '0.5rem' }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{done} of {total} steps complete</div>
        </div>
      </div>

      {/* Credential badge if earned */}
      {path.credentialId && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(62,207,110,0.4)', background: 'rgba(62,207,110,0.05)' }}>
          <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Award size={24} color="var(--green)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: '0.2rem' }}>Credential Earned!</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>
                Your {path.skillName} credential was issued on{' '}
                {path.credentialId.issuedAt ? format(new Date(path.credentialId.issuedAt), 'MMM d, yyyy') : '—'}
              </div>
            </div>
            <Link to="/credentials" className="btn btn-outline btn-sm">
              <ExternalLink size={13} /> View
            </Link>
          </div>
        </div>
      )}

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {path.steps?.map((step, i) => {
          const isCheckpoint = step.type === 'checkpoint';
          const isLocked = !isCheckpoint && i > 0 && !path.steps[i - 1].completed && !step.completed;
          const canDoCheckpoint = isCheckpoint && allNonCheckpointDone && !step.completed && !isCompleted;

          return (
            <div key={step.order} className={`card ${step.completed ? '' : isLocked ? '' : 'card-hover'}`}
              style={{ border: `1px solid ${step.completed ? 'rgba(62,207,110,0.3)' : isCheckpoint ? 'var(--accent)' : 'var(--border)'}`, background: step.completed ? 'rgba(62,207,110,0.04)' : isCheckpoint ? 'var(--accent-dim)' : isLocked ? 'var(--bg)' : undefined, opacity: isLocked ? 0.5 : 1, transition: 'all var(--transition)' }}>
              <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: step.completed ? 'rgba(62,207,110,0.15)' : isCheckpoint ? 'rgba(212,255,71,0.2)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                  {step.completed ? <CheckCircle size={18} color="var(--green)" /> : <span>{STEP_ICONS[step.type] || '📌'}</span>}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{step.title}</span>
                    <span className="badge badge-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{step.type}</span>
                    {step.estimatedMinutes && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={11} /> {step.estimatedMinutes}m
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: step.resourceUrl ? '0.6rem' : 0 }}>
                    {step.description}
                  </div>
                  {step.resourceUrl && (
                    <a href={step.resourceUrl} target="_blank" rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm" style={{ marginTop: '0.4rem' }}>
                      <ExternalLink size={12} /> Open Resource
                    </a>
                  )}
                  {step.completedAt && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <CheckCircle size={11} color="var(--green)" /> Completed {format(new Date(step.completedAt), 'MMM d')}
                    </div>
                  )}
                </div>

                {/* Action */}
                {!step.completed && !isLocked && (
                  isCheckpoint ? (
                    canDoCheckpoint ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setShowTest(true)}>
                        <Play size={13} /> Take Test
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Complete all steps first</span>
                    )
                  ) : (
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => completeStep.mutate(step.order)}
                      disabled={completeStep.isPending}>
                      {completeStep.isPending ? <span className="spinner" /> : <CheckCircle size={13} />}
                      Done
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
