import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerApi } from '../../api';
import toast from 'react-hot-toast';
import { Calendar, Plus, ExternalLink, Download, Trash2, Clock, Video, User, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';

export default function EmployerCalendarPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['employer-interviews'],
    queryFn: () => employerApi.getInterviews().then(r => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => employerApi.cancelInterview(id),
    onSuccess: () => {
      qc.invalidateQueries(['employer-interviews']);
      toast.success('Interview cancelled');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not cancel interview'),
  });

  const interviews = data?.interviews || [];

  return (
    <div className="animate-in" style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="label" style={{ marginBottom: '0.4rem' }}>Calendar Integration</div>
          <h1 className="display-lg">
            Interview <span className="accent-mark">Calendar</span>
          </h1>
          <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
            Schedule candidate interviews, sync to Google Calendar, or export .ics events directly.
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Schedule Interview
        </button>
      </div>

      {/* Interviews List / Calendar View */}
      {isLoading ? (
        [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, marginBottom: '0.85rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : interviews.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Calendar size={36} style={{ opacity: 0.3 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>No scheduled interviews</div>
            <div style={{ fontSize: '0.8125rem' }}>Click "+ Schedule Interview" to add your first appointment.</div>
          </div>
        </div>
      ) : (
        interviews.map((item, idx) => {
          const dt = new Date(item.scheduledAt);
          const startTimeIso = dt.toISOString().replace(/-|:|\.\d\d\d/g, '');
          const endTimeIso = new Date(dt.getTime() + (item.durationMinutes || 45) * 60000).toISOString().replace(/-|:|\.\d\d\d/g, '');
          const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${startTimeIso}/${endTimeIso}&details=${encodeURIComponent(`Interview with ${item.candidateName} for ${item.jobTitle}.\nMeeting link: ${item.meetingUrl}\nNotes: ${item.notes}`)}&location=${encodeURIComponent(item.meetingUrl || 'Online Video Call')}`;

          const icsData = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//SkillGap//Employer Calendar//EN',
            'BEGIN:VEVENT',
            `SUMMARY:${item.title}`,
            `DESCRIPTION:Interview with ${item.candidateName} for ${item.jobTitle}. Notes: ${item.notes}`,
            `LOCATION:${item.meetingUrl || 'Online'}`,
            `DTSTART:${startTimeIso}`,
            `DTEND:${endTimeIso}`,
            'END:VEVENT',
            'END:VCALENDAR',
          ].join('\r\n');

          const icsUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsData)}`;

          return (
            <div key={item._id} className="card card-hover animate-in" style={{ marginBottom: '0.85rem', animationDelay: `${idx * 40}ms` }}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.title}</span>
                      <span className="badge badge-accent">{item.interviewType}</span>
                      <span className="badge badge-muted">{item.durationMinutes} mins</span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '0.4rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={13} color="var(--accent)" /> {item.candidateName} ({item.candidateEmail})</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} color="var(--blue)" /> {format(dt, 'PPPP p')}</span>
                    </div>

                    {item.notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
                        Notes: {item.notes}
                      </div>
                    )}
                  </div>

                  {/* Calendar Export Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ExternalLink size={12} /> Google Calendar
                    </a>
                    <a href={icsUrl} download={`interview-${item.candidateName.replace(/\s+/g, '_')}.ics`} className="btn btn-ghost btn-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Download size={12} /> .ics File
                    </a>
                    <button className="btn btn-ghost btn-xs" style={{ color: 'var(--red)' }} onClick={() => cancelMutation.mutate(item._id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Schedule Interview Modal */}
      {showModal && <ScheduleInterviewModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export function ScheduleInterviewModal({ candidate, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    candidateName: candidate?.name || 'Ananya Varma',
    candidateEmail: candidate?.email || 'ananya.hr@email.com',
    candidateId: candidate?.userId || candidate?.applicationId || '6ab59b06dedad6dae42c6813',
    jobTitle: 'Senior HR Manager',
    title: `Interview: ${candidate?.name || 'Ananya Varma'} — HR Role`,
    interviewType: 'Initial Screening',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    durationMinutes: 45,
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    notes: 'Discuss HR compliance experience and team lead deliverables.',
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => employerApi.scheduleInterview(data).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries(['employer-interviews']);
      toast.success('Interview scheduled & added to calendar!');
      if (res.googleCalendarUrl) {
        window.open(res.googleCalendarUrl, '_blank');
      }
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not schedule interview'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    scheduleMutation.mutate(form);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={18} color="var(--accent)" /> Schedule Interview
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Candidate Name</label>
                <input className="input" value={form.candidateName} onChange={e => setForm(f => ({ ...f, candidateName: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Candidate Email</label>
                <input className="input" type="email" value={form.candidateEmail} onChange={e => setForm(f => ({ ...f, candidateEmail: e.target.value }))} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Interview Title</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Interview Type</label>
                <select className="input" value={form.interviewType} onChange={e => setForm(f => ({ ...f, interviewType: e.target.value }))}>
                  {['Initial Screening', 'Technical Assessment', 'HR Interview', 'Final Round'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Date & Time</label>
                <input className="input" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Meeting URL (Google Meet / Zoom)</label>
              <input className="input" value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))} placeholder="https://meet.google.com/…" />
            </div>

            <div className="input-group">
              <label className="input-label">Notes</label>
              <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional interview focus areas" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={scheduleMutation.isPending}>
                {scheduleMutation.isPending ? <><span className="spinner" /> Scheduling…</> : <><Calendar size={14} /> Schedule & Sync Calendar</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
