import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    to: '/account',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/account/orders',
    label: 'Orders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.5 7.5 12 3 3.5 7.5 12 12l8.5-4.5Z" />
        <path d="M3.5 7.5v9L12 21l8.5-4.5v-9" />
        <path d="M12 12v9" />
      </svg>
    ),
  },
  {
    to: '/account/addresses',
    label: 'Addresses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    to: '/account/details',
    label: 'Account details',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

// "Maryam Ubaid" -> "MU". Falls back to "?" if we somehow have no name yet
// (e.g. a brief flash before the user object loads).
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile-only: collapses the nav list under a tappable header showing the
  // current section, same pattern as the Products page category filter —
  // avoids dumping all 5 nav items inline above the page content on phones.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const activeItem = NAV_ITEMS.find((item) => item.to === location.pathname);
  const activeLabel = activeItem?.label || 'My Account';

  return (
    <div className="container" style={{ paddingTop: '64px', paddingBottom: '40px' }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.6rem', letterSpacing: '0.03em' }}>MY ACCOUNT</h1>
      </div>

      <div className="account-layout">
        <aside className="account-sidebar">
          <div className="account-identity">
            <div className="account-avatar">{getInitials(user?.name)}</div>
            <div>
              <div className="account-greeting">Hi, {firstName}</div>
              {user?.email && <div className="account-email">{user.email}</div>}
            </div>
          </div>

          {/* Mobile-only toggle — shows current section, expands the nav below.
              Hidden on desktop via CSS; desktop always shows the full nav. */}
          <button
            type="button"
            className="account-nav-toggle"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <span>{activeLabel}</span>
            <span className={`sidebar-caret${mobileNavOpen ? ' open' : ''}`} aria-hidden="true">▾</span>
          </button>

          <nav className={`account-nav${mobileNavOpen ? ' open' : ''}`}>
            {NAV_ITEMS.map(({ to, label, icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`account-nav-item${active ? ' active' : ''}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className="account-nav-icon">{icon}</span>
                  {label}
                </Link>
              );
            })}
            <button type="button" className="account-nav-item account-logout" onClick={handleLogout}>
              <span className="account-nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              Logout
            </button>
          </nav>
        </aside>

        <main><Outlet /></main>
      </div>
    </div>
  );
}