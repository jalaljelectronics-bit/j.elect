import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);

    const email = loginForm.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    setLoginSubmitting(true);
    try {
      await login({ email, password: loginForm.password });
      navigate('/products');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 0', maxWidth: '480px' }}>
      <h2 style={{ letterSpacing: '0.05em', fontSize: '1.1rem', marginBottom: '24px' }}>LOGIN</h2>
      <form onSubmit={handleLogin} className="form-card" style={{ border: 'none', padding: 0 }}>
        <div className="field">
          <label>Username or email address *</label>
          <input
            type="email"
            required
            value={loginForm.email}
            onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="field" style={{ marginTop: '16px' }}>
          <label>Password *</label>
          <input
            type="password"
            required
            value={loginForm.password}
            onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
          />
        </div>

        {loginError && <p style={{ color: '#c0392b', marginTop: '10px', fontSize: '0.85rem' }}>{loginError}</p>}

        <button
          className="btn-primary"
          type="submit"
          disabled={loginSubmitting}
          style={{ marginTop: '20px' }}
        >
          {loginSubmitting ? 'Logging in...' : 'LOG IN'}
        </button>

        <p style={{ marginTop: '18px', fontSize: '0.85rem', color: 'var(--text-sub, #9CA3AF)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--cyan)', fontWeight: 600 }}>
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}