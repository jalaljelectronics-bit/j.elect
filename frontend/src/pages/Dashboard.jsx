import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  ['/account/orders', 'Orders'],
  ['/account/addresses', 'Addresses'],
  ['/account/details', 'Account details'],
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>
        Hello <strong>{user?.name}</strong> (not <strong>{user?.name}</strong>?{' '}
        <span onClick={logout} style={{ color: '#3b5a80', cursor: 'pointer', textDecoration: 'underline' }}>
          Log out
        </span>)
      </h3>
      <p style={{ color: 'var(--text-sub, #64748b)', lineHeight: 1.6 }}>
        From your account dashboard you can view your <Link to="/account/orders">recent orders</Link>, manage your{' '}
        <Link to="/account/addresses">shipping and billing addresses</Link>, and edit your{' '}
        <Link to="/account/details">password and account details</Link>.
      </p>

      <div className="dashboard-cards">
        {CARDS.map(([to, label]) => (
          <Link
            key={to}
            to={to}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border, #e2e8f0)', borderRadius: '6px',
              color: '#3b5a80', fontSize: '1.1rem', textDecoration: 'none'
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}