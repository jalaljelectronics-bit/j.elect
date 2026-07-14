// src/layouts/AdminLayout.tsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/responsive.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Controls the slide-in sidebar drawer on mobile (<=768px).
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navigationItems = [
    { name: '📊 Dashboard', path: '/admin' },
    { name: '📱 Products', path: '/admin/products' },
    { name: '📂 Categories', path: '/admin/categories' },
    { name: '🛠️ Projects', path: '/admin/projects' },
    { name: '📝 Blog Section', path: '/admin/blogs' },
    { name: '📦 Orders', path: '/admin/orders' },
    { name: '💬 Queries', path: '/admin/queries' },
  ];

  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f3f4f6' }}>

      {/* 📱 Mobile-only top bar with hamburger (hidden on desktop via CSS) */}
      <div className="mobile-topbar">
        <button aria-label="Open menu" onClick={() => setSidebarOpen(true)}>☰</button>
        <span style={{ fontWeight: 700, letterSpacing: '0.025em' }}>🚀 J. Electronics</span>
        <button onClick={handleLogout} style={{ fontSize: '0.85rem', fontWeight: 600 }}>Logout</button>
      </div>

      {/* Dark overlay behind the drawer; tap to close */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar (static on desktop, slide-in drawer on mobile) */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '260px', backgroundColor: '#1e293b', color: '#fff', padding: '1.5rem', boxSizing: 'border-box' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem', fontWeight: '700', letterSpacing: '0.025em' }}>
          🚀 J. Electronics
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: isActive ? '#3b82f6' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <header className="admin-topbar" style={{ backgroundColor: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <span style={{ fontWeight: '600', color: '#334155' }}>
            Role: {auth?.user?.role ? auth.user.role.toUpperCase() : 'GUEST'}
          </span>
          <button
            onClick={handleLogout}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
          >
            Logout
          </button>
        </header>

        {/* Dynamic Route Content */}
        <main className="admin-main" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};