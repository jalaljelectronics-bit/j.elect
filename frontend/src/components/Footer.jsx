import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api/categoryService';

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
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(cats.slice(0, 6)))
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  return (
    <footer className="site-footer">
      <video
        className="footer-video-bg"
        src="YOUR_VIDEO_URL_HERE"
        autoPlay
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