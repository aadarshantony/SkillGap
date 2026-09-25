import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerApi } from '../../api';
import toast from 'react-hot-toast';
import {
  Calendar as CalendarIcon, Plus, ExternalLink, Download, Trash2,
  Clock, Video, User, ChevronLeft, ChevronRight, CheckCircle, Info
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns';

export default function EmployerCalendarPage() {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employer-interviews'],
    queryFn: () => employerApi.getInterviews().then(r => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => employerApi.cancelInterview(id),
    onSuccess: () => {
      qc.invalidateQueries(['employer-interviews']);
      toast.success('Interview cancelled');
      setSelectedInterview(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not cancel interview'),
  });

  const interviews = data?.interviews || [];

  // Monthly Calendar Grid Generator
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const resetToday = () => setCurrentMonth(new Date());

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="label" style={{ marginBottom: '0.4rem' }}>Calendar & Appointments</div>
          <h1 className="display-lg">
            Interview <span className="accent-mark">Calendar</span>
          </h1>
          <p style={{ color: 'var(--text-2)', marginTop: '0.4rem' }}>
            Real-time monthly schedule of candidate interviews synced directly with MongoDB.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Schedule Interview
          </button>
        </div>
      </div>

      {/* Month Navigation Header */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarIcon size={20} color="var(--accent)" />
            <h2 className="display-sm" style={{ fontSize: '1.25rem', margin: 0 }}>
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button className="btn btn-ghost btn-xs" onClick={resetToday}>
              Today
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={prevMonth} title="Previous Month">
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-outline btn-sm" onClick={nextMonth} title="Next Month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Visual 7-Day Weekday Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} style={{ background: '#171717', padding: '0.75rem', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {day}
          </div>
        ))}
      </div>

      {/* 35/42 Date Grid Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '0 0 12px 12px', overflow: 'hidden', marginBottom: '2rem' }}>
        {calendarDays.map((day) => {
          const dayInterviews = interviews.filter(item => isSameDay(new Date(item.scheduledAt), day));
          const isCurrentMonthDay = isSameMonth(day, monthStart);
          const isCurrentToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              style={{
                background: isCurrentToday ? 'rgba(212,255,71,0.03)' : isCurrentMonthDay ? 'var(--surface)' : '#0d0d0d',
                minHeight: 110,
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                opacity: isCurrentMonthDay ? 1 : 0.45,
                borderTop: isCurrentToday ? '2px solid var(--accent)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: isCurrentToday ? 800 : 600,
                    color: isCurrentToday ? 'var(--accent)' : 'var(--text)',
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCurrentToday ? 'var(--accent-dim)' : 'transparent',
                  }}
                >
                  {format(day, 'd')}
                </span>

                {dayInterviews.length > 0 && (
                  <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                    {dayInterviews.length}
                  </span>
                )}
              </div>

              {/* Event Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
                {dayInterviews.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => setSelectedInterview(item)}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-2)',
                      borderLeft: '3px solid var(--accent)',
                      borderRadius: '4px',
                      padding: '0.3rem 0.4rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      color: 'var(--text)',
                      transition: 'all 120ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {format(new Date(item.scheduledAt), 'p')}
                    </div>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.candidateName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheduled Interviews Detailed List below Calendar */}
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Upcoming Scheduled Interviews ({interviews.length})</div>
      </div>

      {isLoading ? (
        [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />)
      ) : interviews.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CalendarIcon size={32} style={{ opacity: 0.25 }} />
            <div style={{ fontWeight: 600 }}>No interviews scheduled</div>
            <div style={{ fontSize: '0.8125rem' }}>Click "+ Schedule Interview" to add your candidate appointments.</div>
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
            <div key={item._id} className="card card-hover animate-in" style={{ marginBottom: '0.85rem', animationDelay: `${idx * 30}ms` }}>
              <div className="card-body" style={{ padding: '1.1rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.title}</span>
                      <span className="badge badge-accent">{item.interviewType}</span>
                      <span className="badge badge-muted">{item.durationMinutes} min</span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={13} color="var(--accent)" /> {item.candidateName} ({item.candidateEmail})</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} color="var(--blue)" /> {format(dt, 'PPPP p')}</span>
                    </div>

                    {item.notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
                        Notes: {item.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-xs">
                      <ExternalLink size={12} /> Google Calendar
                    </a>
                    <a href={icsUrl} download={`interview-${item.candidateName.replace(/\s+/g, '_')}.ics`} className="btn btn-ghost btn-xs">
                      <Download size={12} /> .ics Event
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

      {/* Detail Modal for Event Chip click */}
      {selectedInterview && (
        <div className="modal-backdrop" onClick={() => setSelectedInterview(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedInterview.title}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>Candidate: {selectedInterview.candidateName}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedInterview(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                <div><strong>Scheduled Date:</strong> {format(new Date(selectedInterview.scheduledAt), 'PPPP p')}</div>
                <div><strong>Duration:</strong> {selectedInterview.durationMinutes} minutes</div>
                <div><strong>Interview Type:</strong> {selectedInterview.interviewType}</div>
                <div><strong>Candidate Email:</strong> {selectedInterview.candidateEmail}</div>
                {selectedInterview.meetingUrl && <div><strong>Meeting URL:</strong> <a href={selectedInterview.meetingUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{selectedInterview.meetingUrl}</a></div>}
                {selectedInterview.notes && <div><strong>Notes:</strong> {selectedInterview.notes}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger btn-sm" onClick={() => cancelMutation.mutate(selectedInterview._id)}>
                Cancel Interview
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedInterview(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
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
      toast.success('Interview scheduled & added to real-time calendar!');
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CalendarIcon size={18} color="var(--accent)" /> Schedule Candidate Interview
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={scheduleMutation.isPending}>
              {scheduleMutation.isPending ? <><span className="spinner" /> Scheduling…</> : <><CalendarIcon size={14} /> Schedule & Sync Calendar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
