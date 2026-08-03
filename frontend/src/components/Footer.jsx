import { Link } from 'react-router-dom';
import { useCategories } from '../context/CategoryContext';
import { useEffect, useRef } from 'react';

const socialIconStyle = {
  background: 'none',
  border: 'none',
  borderRadius: 0,
  width: '25px',
  height: '25px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  overflow: 'hidden',
};

const socialImgStyle = {
  maxWidth: '100%',
  maxHeight: '100%',
  width: 'auto',
  height: 'auto',
  objectFit: 'contain',
};

// For icons with extra internal padding baked into the file
const socialImgStyleZoomed = {
  ...socialImgStyle,
  transform: 'scale(1.4)',
};

export default function Footer() {
  const { categories: allCategories } = useCategories();
  const categories = allCategories.slice(0, 6);
  const footerVideoRef = useRef(null);

  // The footer is below the fold on every page load, so there's no reason to
  // download footer-bg.mp4 until the user actually scrolls near it — unlike
  // the hero video (deferred to "after first paint" since it's visible
  // immediately), this one can be deferred until it's about to be seen at
  // all. IntersectionObserver with a rootMargin starts the fetch slightly
  // before the footer enters the viewport, so there's no visible pop-in as
  // it scrolls into view.
  useEffect(() => {
    const video = footerVideoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          video.src = '/footer-bg.mp4';
          video.play().catch(() => {});
          observer.disconnect();
        }
      },
      { rootMargin: '300px' } // start loading 300px before it's actually visible
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="site-footer">
      <video
        ref={footerVideoRef}
        className="footer-video-bg"
        loop
        muted
        playsInline
      />
      <div className="footer-video-overlay" />
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-col">
            <Link
              to="/"
              className="logo"
              style={{ marginBottom: '14px', display: 'flex' }}
            >
              <img
                src="/logo.png"
                alt="J Electronics"
                className="logo-wordmark"
              />

              <span className="logo-text">
                <span>Electronics</span>
              </span>
            </Link>

            <p
              style={{
                color: '#9CA3AF',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                maxWidth: '280px',
              }}
            >
              Next-generation electronics, gadgets, and maker project kits —
              curated for builders in Pakistan and beyond.
            </p>

           <p
  style={{
    color: '#9CA3AF',
    fontSize: '0.85rem',
    marginTop: '10px',
  }}
>
  Contact us at{' '}
  <a
    href="tel:+923176572690"
    style={{ color: 'var(--cyan)', fontWeight: 600 }}
  >
    +92 317 6572690
  </a>
</p>
            {/* Social Links */}
            <div
              className="footer-social"
              style={{
                marginTop: '18px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              {/* Facebook */}
              <a
              
                href="https://www.facebook.com/profile.php?id=61552590364369"
                target="_blank"
                rel="noreferrer"
                title="Facebook"
                style={socialIconStyle}
              >
                <img
                  src="/facebook.png"
                  alt="Facebook"
                  style={socialImgStyle}
                  width={25}
                  height={25}
                />
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/visiongiants"
                target="_blank"
                rel="noreferrer"
                title="Instagram"
                style={socialIconStyle}
              >
                <img
                  src="/instagram.png"
                  alt="Instagram"
                  style={socialImgStyleZoomed}
                  width={25}
                  height={25}
                />
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/company/jelectronics/?viewAsMember=true"
                target="_blank"
                rel="noreferrer"
                title="LinkedIn"
                style={socialIconStyle}
              >
                <img
                  src="/linkedin.jpeg"
                  alt="LinkedIn"
                  style={socialImgStyle}
                  width={25}
                  height={25}
                />
              </a>

              {/* Daraz */}
              <a
              
                href="https://www.daraz.pk/shop/duuuytiz"
                target="_blank"
                rel="noreferrer"
                title="Shop on Daraz"
                style={socialIconStyle}
              >
                <img
                  src="/daraz.png"
                  alt="Daraz"
                  style={socialImgStyleZoomed}
                  width={25}
                  height={25}
                />
              </a>

              {/* YouTube */}
               
              <a
                href="https://www.youtube.com/@JElectronicss"
                target="_blank"
                rel="noreferrer"
                title="YouTube"
                style={socialIconStyle}
              >
                <img
                  src="/youtube.png"
                  alt="YouTube"
                  style={socialImgStyleZoomed}
                  width={25}
                  height={25}
                />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="footer-col">
            <h4>Shop</h4>
            <ul id="footerShopLinks">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/products?category=${cat.id}`}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/projects">Projects</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li>
                <Link to="/policies?tab=shipping">Shipping Info</Link>
              </li>
              <li>
                <Link to="/contact">Get Help</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <center>
            <span>
              © {new Date().getFullYear()} J. Electronics. All rights reserved.
            </span>
          </center>
        </div>
      </div>
    </footer>
  );
}