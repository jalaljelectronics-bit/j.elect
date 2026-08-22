import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  ['/account/orders', 'Orders', 'Track and review past purchases'],
  ['/account/addresses', 'Addresses', 'Manage shipping and billing details'],
  ['/account/details', 'Account details', 'Update your name, email, and password'],
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || '';

  return (
    <div>
      {/* The old "Hello X (not X? Log out)" line and its follow-up paragraph
          were dropped — that identity info now lives in the sidebar's
          avatar/greeting (see AccountLayout.jsx), and the paragraph just
          repeated what these three cards already say. */}
      <h3 style={{ marginTop: 0, fontWeight: 600, color: 'var(--text-sub)' }}>
        Welcome back{firstName ? `, ${firstName}` : ''}.
      </h3>

      <div className="dashboard-cards">
        {CARDS.map(([to, label, description]) => (
          <Link key={to} to={to} className="dashboard-card">
            <span className="dashboard-card-label">{label}</span>
            <span className="dashboard-card-desc">{description}</span>
            <span className="dashboard-card-arrow" aria-hidden="true">&rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}