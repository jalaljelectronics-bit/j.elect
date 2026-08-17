import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/;

export default function Register() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [regError, setRegError] = useState(null);
  const [regSubmitting, setRegSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(null);

    const email = regForm.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setRegError('Please enter a valid email address.');
      return;
    }

    const phone = regForm.phone.trim();
    if (!PHONE_REGEX.test(phone)) {
      setRegError('Please enter a valid phone number.');
      return;
    }

    setRegSubmitting(true);
    try {
      await signup({ name: regForm.name, email, phone, password: regForm.password });
      await login({ email, password: regForm.password });
      navigate('/products');
    } catch (err) {
      setRegError(err.response?.data?.message || 'Could not create account. Please try again.');
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 0', maxWidth: '480px' }}>
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
          <label>Phone Number *</label>
          <input
            type="tel"
            required
            placeholder="e.g. 0317 6572690"
            value={regForm.phone}
            onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
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

        <p style={{ marginTop: '18px', fontSize: '0.85rem', color: 'var(--text-sub, #9CA3AF)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600 }}>
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}