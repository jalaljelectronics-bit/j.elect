import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoryContext';
import SearchBar from './SearchBar';

export default function Header() {
  const { cartCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const { categories } = useCategories();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const productsCloseTimerRef = useRef(null);

  // Drives the Products dropdown with JS state instead of pure CSS :hover.
  // Pure :hover was closing the dropdown mid-move whenever the cursor
  // crossed a small visual gap between the trigger and the panel — fast
  // moves skipped over the gap, slow ones didn't. A short close-delay
  // makes brief gap-crossings harmless: onMouseEnter (on either the
  // trigger or the dropdown itself, since both live inside the same <li>)
  // cancels the pending close before it fires.
  const openProductsDropdown = () => {
    clearTimeout(productsCloseTimerRef.current);
    setProductsOpen(true);
  };

  const closeProductsDropdownDelayed = () => {
    productsCloseTimerRef.current = setTimeout(() => setProductsOpen(false), 200);
  };

  useEffect(() => {
    return () => clearTimeout(productsCloseTimerRef.current);
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

  // Close the mobile menu when clicking anywhere outside it (or the toggle button)
  useEffect(() => {
    const handleClickOutsideMobile = (e) => {
      if (
        mobileOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(e.target)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMobile);
    return () => document.removeEventListener('mousedown', handleClickOutsideMobile);
  }, [mobileOpen]);

  // Close the mobile menu (and profile dropdown) the moment the user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (mobileOpen) setMobileOpen(false);
      if (profileOpen) setProfileOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileOpen, profileOpen]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="announcement-bar">
        <div className="announce-inner">
          <span className="announce-text">✦ Free Delivery on Orders Above Rs 25,000 ✦ </span>
          <div className="announce-links">
  <a href="https://www.instagram.com/jelectronicss/" target="_blank" rel="noreferrer" title="Instagram">
    <img src="/instagram.png" alt="Instagram" style={{ width: '25px', height: '25px', objectFit: 'contain' }} />
  </a>
  <a href="mailto:support@visiongiants.pk" title="Email">
    <img src="/email.png" alt="Email" style={{ width: '25px', height: '25px', objectFit: 'contain' }} />
  </a>
 
  <a href="https://www.facebook.com/profile.php?id=61552590364369&sk=directory_links&fb_profile_edit_entry_point=%7B%22feature%22%3A%22profile_directory%22%2C%22click_point%22%3A%22pencil_edit_directory_section%22%2C%22additional_metadata%22%3A%7B%22section_type%22%3A%22links%22%7D%7" target="_blank" rel="noreferrer" title="Facebook">
    <img src="/facebook.png" alt="Facebook" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
  </a>
  <a href="https://linkedin.com/company/jelectronics/?viewAsMember=true" target="_blank" rel="noreferrer" title="LinkedIn">
    <img src="/linkedin.jpeg" alt="LinkedIn" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
  </a>
  <a href="https://www.daraz.pk/shop/duuuytiz" target="_blank" rel="noreferrer" title="Shop on Daraz">
    <img src="/daraz.png" alt="Daraz" style={{ width: '25px', height: '25px', objectFit: 'contain' }} />
  </a>
   <a href="https://www.youtube.com/@JElectronicss" target="_blank" rel="noreferrer" title="YouTube">
    <img src="/youtube.png" alt="YouTube" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
  </a>
</div>      
        </div>
      </div>
      <div className="nav-inner">
        <Link to="/" className="logo">
  <img
    src="/logo.png"
    alt="J. Electronics"
    className="logo-wordmark"
  />
  <span className="logo-text">
    <span>Electronics</span>
  </span>
</Link>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>

          <li
            onMouseEnter={openProductsDropdown}
            onMouseLeave={closeProductsDropdownDelayed}
          >
            <span className="nav-link-btn" style={{ cursor: 'pointer' }}>
             <Link to="/products">Products</Link>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
            {productsOpen && (
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
            )}
          </li>
          <li><Link to="/projects">Projects</Link></li>
          <li><Link to="/blog">Blog</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>

        <div className="nav-end">
          <SearchBar />

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
          <button ref={mobileToggleRef} className="icon-btn mobile-toggle" onClick={() => setMobileOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div ref={mobileMenuRef} style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              ['/', 'Home'],
              ['/about', 'About Us'],
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