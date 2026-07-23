import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api/categoryService';

export default function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(cats.slice(0, 6)))
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link to="/" className="logo" style={{ marginBottom: '14px', display: 'flex' }}>
              <img
                src="/logo-dark.png"
                alt="J. Electronics"
                className="logo-wordmark"
              />
            </Link>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '280px' }}>
              Next-generation electronics, gadgets, and maker project kits — curated for builders in Pakistan and beyond.
            </p>
            <div className="footer-social" style={{ marginTop: '18px' }}>
              <a href="https://facebook.com" target="_blank" rel="noreferrer">f</a>
              <a href="https://instagram.com/visiongiants" target="_blank" rel="noreferrer">◎</a>
              <a href="https://wa.me/923176572690" target="_blank" rel="noreferrer">✆</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <ul id="footerShopLinks">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/products?category=${cat.id}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link to="/projects">Projects</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/policies">Policies</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link to="/policies?tab=shipping">Shipping Info</Link></li>
              <li><Link to="/policies?tab=returns">Returns</Link></li>
              <li><Link to="/policies?tab=warranty">Warranty</Link></li>
              <li><Link to="/contact">Get Help</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Vision Giants. All rights reserved.</span>
          
        </div>
      </div>
    </footer>
  );
}