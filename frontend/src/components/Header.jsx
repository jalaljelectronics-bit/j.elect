import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getCategories } from '../api/categoryService';
import SearchBar from './SearchBar';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { cartCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef(null);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(cats))
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Close the profile dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="announcement-bar">
        <div className="announce-inner">
          <span className="announce-text">✦ Free Delivery on Orders Above Rs 25,000 · </span>
          <div className="announce-links">
            <a href="https://instagram.com/visiongiants" target="_blank" rel="noreferrer" title="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
            <a href="mailto:support@visiongiants.pk" title="Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
            <a href="tel:+923176572690" title="Call Us">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
            <a href="https://facebook.com/visiongiants" target="_blank" rel="noreferrer" title="Facebook">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="https://linkedin.com/company/visiongiants" target="_blank" rel="noreferrer" title="LinkedIn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v2a6 6 0 0 1 2-2z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="nav-inner">
        <Link to="/" className="logo">
          <img
            src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
            alt="J. Electronics"
            className="logo-wordmark"
          />
        </Link>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li>
            <span className="nav-link-btn" style={{ cursor: 'pointer' }}>
             <Link to="/products">Products</Link>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
            <div className="dropdown">
              {categories.map((cat) => (
                <div key={cat.id} className="drop-item" onClick={() => navigate(`/products?category=${cat.id}`)}>
                  <div className="drop-icon">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    ) : (
                      '📦'
                    )}
                  </div>
                  <div>
                    <div className="drop-label">{cat.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </li>
          <li><Link to="/projects">Projects</Link></li>
          <li><Link to="/blog">Blog</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>

        <div className="nav-end">
          <SearchBar />
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Profile: logged out -> link straight to /login.
              Logged in -> click toggles a dropdown (Dashboard / My Orders / Account details / Addresses / Logout) */}
          {isAuthenticated ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setProfileOpen((v) => !v)} title={user?.name || 'Account'}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              {profileOpen && (
                <div
                  style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    background: 'var(--bg2, #fff)', border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                    minWidth: '200px', padding: '8px', zIndex: 200,
                  }}
                >
                  {user?.name && (
                    <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-sub, #64748b)', borderBottom: '1px solid var(--border, #e2e8f0)', marginBottom: '4px' }}>
                      Signed in as <strong>{user.name}</strong>
                    </div>
                  )}
                  {[
                    ['/account', 'Dashboard'],
                    ['/orders', 'My Orders'],
                    ['/account', 'Account details'],
                    ['/addresses', 'Addresses'],
                  ].map(([to, label]) => (
                    <Link
                      key={label}
                      to={to}
                      onClick={() => setProfileOpen(false)}
                      style={{ display: 'block', padding: '9px 12px', borderRadius: '6px', color: 'var(--text, #0f172a)', textDecoration: 'none', fontSize: '0.9rem' }}
                    >
                      {label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                      borderRadius: '6px', color: '#c0392b', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '0.9rem', marginTop: '4px', borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '10px'
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="icon-btn" title="Log in">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          )}

          <Link to="/cart" className="icon-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="cartCount" style={{ display: cartCount > 0 ? 'flex' : 'none' }}>{cartCount}</span>
          </Link>
          <button className="icon-btn mobile-toggle" onClick={() => setMobileOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              ['/', 'Home'],
              ['/products', 'Products'],
              ['/projects', 'Projects'],
              ['/blog', 'Blog'],
              ['/contact', 'Contact'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '10px 6px', color: 'var(--text-sub)' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
