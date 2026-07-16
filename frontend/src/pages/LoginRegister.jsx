import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginRegister() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' });
  const [regError, setRegError] = useState(null);
  const [regSubmitting, setRegSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);
    try {
      await login({ email: loginForm.email, password: loginForm.password });
      navigate('/products');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(null);
    setRegSubmitting(true);
    try {
      await signup({ name: regForm.name, email: regForm.email, password: regForm.password });
      await login({ email: regForm.email, password: regForm.password });
      navigate('/products');
    } catch (err) {
      setRegError(err.response?.data?.message || 'Could not create account. Please try again.');
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div className="auth-split">
        {/* LOGIN */}
        <div>
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
          </form>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <h2 style={{ letterSpacing: '0.05em', fontSize: '1.1rem', marginBottom: '24px' }}>REGISTER</h2>
          <form onSubmit={handleRegister} className="form-card" style={{ border: 'none', padding: 0 }}>
            <div className="field">
              <label>Full Name *</label>
              <input
                required
                value={regForm.name}
                onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field" style={{ marginTop: '16px' }}>
              <label>Email address *</label>
              <input
                type="email"
                required
                value={regForm.email}
                onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="field" style={{ marginTop: '16px' }}>
              <label>Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={regForm.password}
                onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-sub, #64748b)', marginTop: '16px' }}>
              Your personal data will be used to support your experience throughout this website and to manage access to your account.
            </p>

            {regError && <p style={{ color: '#c0392b', marginTop: '10px', fontSize: '0.85rem' }}>{regError}</p>}

            <button
              className="btn-primary"
              type="submit"
              disabled={regSubmitting}
              style={{ marginTop: '16px' }}
            >
              {regSubmitting ? 'Creating account...' : 'REGISTER'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
