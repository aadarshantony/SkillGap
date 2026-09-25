import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, Briefcase, BookOpen, Award,
  PlusSquare, LogOut, Zap, TrendingUp, ClipboardList,
  BarChart2, Users, Target, Search, User, Sparkles, AlertTriangle, Calendar, X
} from 'lucide-react';

const learnerNav = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs',           icon: Briefcase,        label: 'Job Board' },
  { to: '/applied',        icon: ClipboardList,    label: 'Applied Jobs' },
  { to: '/paths',          icon: BookOpen,          label: 'My Paths' },
  { to: '/credentials',    icon: Award,             label: 'Credentials' },
  { to: '/readiness',      icon: Target,            label: 'Role Recommendations' },
  { to: '/market-pulse',   icon: TrendingUp,        label: 'Market Pulse' },
];

const employerNav = [
  { to: '/employer',                    icon: LayoutDashboard, label: 'Overview' },
  { to: '/employer/post',               icon: PlusSquare,      label: 'Post a Job' },
  { to: '/employer/applicants',         icon: Users,           label: 'Applicants' },
  { to: '/employer/talent',             icon: Search,          label: 'Talent Pool' },
  { to: '/employer/jd-tools',           icon: Sparkles,        label: 'JD Quality & AI' },
  { to: '/employer/rejection-insights', icon: AlertTriangle,   label: 'Rejection Insights' },
  { to: '/employer/calendar',           icon: Calendar,        label: 'Interview Calendar' },
  { to: '/employer/analytics',          icon: BarChart2,       label: 'Analytics' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const nav = user?.role === 'employer' ? employerNav : learnerNav;

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo Header */}
      <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="display-sm" style={{ color: 'var(--text)', fontSize: '1rem' }}>
              Skill<span className="accent-mark">Gap</span>
            </span>
          </div>
          <div style={{ marginTop: '0.2rem', fontSize: '0.72rem', color: 'var(--text-3)' }}>
            {user?.role === 'employer' ? 'Employer Portal' : 'Learner Portal'}
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button className="btn btn-ghost btn-xs" onClick={onClose} style={{ color: 'var(--text-3)' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* User Chip */}
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0' }}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/employer'}
            onClick={() => { if (onClose) onClose(); }}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}>
        <button className="nav-item" style={{ width: '100%', border: 'none' }} onClick={handleLogout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
