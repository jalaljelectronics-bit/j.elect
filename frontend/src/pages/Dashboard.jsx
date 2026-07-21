import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  ['/account/orders', 'Orders', 'Track and review past purchases'],
  ['/account/addresses', 'Addresses', 'Manage shipping and billing details'],
  ['/account/details', 'Account details', 'Update your name, email, and password'],
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>
        Hello <strong>{user?.name}</strong> (not <strong>{user?.name}</strong>?{' '}
        <span onClick={logout} className="account-link" style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          Log out
        </span>)
      </h3>
      <p style={{ color: 'var(--text-sub)', lineHeight: 1.6 }}>
        From your account dashboard you can view your <Link className="account-link" to="/account/orders">recent orders</Link>, manage your{' '}
        <Link className="account-link" to="/account/addresses">shipping and billing addresses</Link>, and edit your{' '}
        <Link className="account-link" to="/account/details">password and account details</Link>.
      </p>

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