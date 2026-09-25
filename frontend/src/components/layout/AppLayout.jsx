import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { Menu, Zap } from 'lucide-react';

export default function AppLayout() {
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      {/* Mobile Header Topbar */}
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="display-sm" style={{ color: 'var(--text)', fontSize: '1rem' }}>
            Skill<span className="accent-mark">Gap</span>
          </span>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)} aria-label="Open Navigation Menu">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      <div className={`mobile-overlay ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
