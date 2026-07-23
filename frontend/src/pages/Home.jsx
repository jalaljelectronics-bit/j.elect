import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, normalizeProduct } from '../api/productService';
import { getCategories } from '../api/categoryService';
import { getProjects } from '../api/projectService';
import ProductCard from '../components/ProductCard';
import ProjectCard from '../components/ProjectCard';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/catalog';

const WHATSAPP_NUMBER = '923176572690';

const DUMMY_PROJECTS = [
  { id: 'dummy-1', emoji: '🚁', badge: 'POPULAR', category: 'Drone Projects', name: 'FPV Racing Drone Build Kit', rating: 4.7, reviews: 89, difficulty: 'Advanced', duration: '5–6 Weeks', description: 'Placeholder project — real data coming soon.' },
  { id: 'dummy-2', emoji: '🌡️', badge: 'POPULAR', category: 'IoT Projects', name: 'ESP32 Weather Station', rating: 4.5, reviews: 134, difficulty: 'Beginner', duration: '1–2 Weeks', description: 'Placeholder project — real data coming soon.' },
  { id: 'dummy-3', emoji: '🔋', badge: 'POPULAR', category: 'Power Electronics', name: 'Solar MPPT Charge Controller', rating: 4.6, reviews: 58, difficulty: 'Intermediate', duration: '3–4 Weeks', description: 'Placeholder project — real data coming soon.' },
  { id: 'dummy-4', emoji: '🚗', badge: 'POPULAR', category: 'Robotics Projects', name: 'Line-Following Robot Car', rating: 4.4, reviews: 210, difficulty: 'Beginner', duration: '1 Week', description: 'Placeholder project — real data coming soon.' },
  { id: 'dummy-5', emoji: '🔐', badge: 'POPULAR', category: 'Security Systems', name: 'RFID Door Lock System', rating: 4.8, reviews: 96, difficulty: 'Intermediate', duration: '2–3 Weeks', description: 'Placeholder project — real data coming soon.' },
  { id: 'dummy-6', emoji: '💧', badge: 'POPULAR', category: 'Smart Home Projects', name: 'Automatic Plant Watering System', rating: 4.5, reviews: 77, difficulty: 'Beginner', duration: '1–2 Weeks', description: 'Placeholder project — real data coming soon.' },
];

// The category (as created in the admin dashboard) whose products populate the
// "Laser Modules" section on the home page. Matched on the exact name first
// (case-insensitive, whitespace-tolerant); if no exact match exists we fall
// back to any category containing "laser" so a rename doesn't empty the row.
const LASER_CATEGORY_NAME = 'Laser-Modules';

const findLaserCategory = (cats = []) => {
  const target = LASER_CATEGORY_NAME.trim().toLowerCase();
  return (
    cats.find((c) => (c.name || '').trim().toLowerCase() === target) ||
    cats.find((c) => (c.name || '').toLowerCase().includes('laser')) ||
    null
  );
};

const MARQUEE = [
  'Free Delivery on Orders Above Rs 25,000',
  'New Arrivals Every Week',
  'Authentic Products Only',
  '24/7 Expert Support',
  '0% Instalment Plans Available',
];

export default function Home() {
  const { addToCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [laserProducts, setLaserProducts] = useState([]);
  const [laserCategoryId, setLaserCategoryId] = useState(null);

  const [productCount, setProductCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);

  const navigate = useNavigate();

  const carouselRef = useRef(null);
  const catCarouselRef = useRef(null);
  const newArrivalsRef = useRef(null);
  const projectCarouselRef = useRef(null);
  const laserCarouselRef = useRef(null);

  useEffect(() => {
    const NEW_ARRIVAL_WINDOW_DAYS = 30;
    const windowStart = Date.now() - NEW_ARRIVAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    Promise.all([
      getProducts({ limit: 1000 }),
      getCategories(),
      getProjects({ limit: 100 }),
    ])
      .then(([productData, cats, projectData]) => {
        const products = (productData.products || []).map(normalizeProduct);
        const projects = projectData.projects || [];

        setProductCount(productData.totalProducts ?? products.length);
        setProjectCount(projectData.totalProjects ?? projects.length);

        setFeaturedProducts(products.slice(0, 8));

        const laserCategory = findLaserCategory(cats);

        console.debug('[Laser] categories from API:', cats.map((c) => `${c.id}:${c.name}`));
        console.debug('[Laser] matched category:', laserCategory);

        if (laserCategory) {
          setLaserCategoryId(laserCategory.id);

          getProducts({ category: laserCategory.id, limit: 10 })
            .then((laserData) => {
              const lasers = (laserData.products || []).map(normalizeProduct);
              console.debug('[Laser] products returned for category', laserCategory.id, lasers);
              setLaserProducts(lasers);
            })
            .catch((err) => {
              console.error('[Laser] category fetch failed, falling back:', err);
              setLaserProducts(
                products
                  .filter((p) => Number(p.categoryId) === Number(laserCategory.id))
                  .slice(0, 10)
              );
            });
        } else {
          console.warn(
            `[Laser] No category matching "${LASER_CATEGORY_NAME}" exists in the DB — section hidden.`
          );
          setLaserCategoryId(null);
          setLaserProducts([]);
        }

        setCategories(
          cats.map((c) => ({
            ...c,
            emoji: c.emoji || '📦',
            count: products.filter((p) => p.categoryId === c.id).length,
          }))
        );

        const featured = projects.filter((p) => p.isFeatured);
        const projectList = featured.length > 0 ? featured : projects;
        setFeaturedProjects(projectList.length > 0 ? projectList.slice(0, 10) : DUMMY_PROJECTS);

        const toArrival = (item, type) => ({
          id: item.id,
          type,
          name: type === 'project' ? item.title : item.name,
          price: Number(item.price) || 0,
          image: item.imageUrl && String(item.imageUrl).startsWith('http') ? item.imageUrl : '',
          createdAt: item.createdAt,
        });

        const productArrivals = products.map((p) => toArrival(p, 'product'));
        const projectArrivals = projects
          .filter((p) => p.isNewArrival)
          .map((p) => toArrival(p, 'project'));

        const combined = [...productArrivals, ...projectArrivals].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const recent = combined.filter(
          (item) => new Date(item.createdAt).getTime() >= windowStart
        );

        setNewArrivals((recent.length > 0 ? recent : combined).slice(0, 12));
      })
      .catch((err) => console.error('Failed to load home data:', err));
  }, []);

  useEffect(() => {
    if (featuredProducts.length === 0) return;
    const timer = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const card = el.querySelector('.product-card');
      if (!card) return;
      const step = card.offsetWidth + 20;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft + step > maxScroll + 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredProducts]);

  useEffect(() => {
    if (categories.length === 0) return;
    const timer = setInterval(() => {
      const el = catCarouselRef.current;
      if (!el || !el.firstElementChild) return;
      const step = el.firstElementChild.offsetWidth + 24;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft + step > maxScroll + 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [categories]);

  useEffect(() => {
    if (newArrivals.length === 0) return;
    const timer = setInterval(() => {
      const el = newArrivalsRef.current;
      if (!el || !el.firstElementChild) return;
      const step = el.firstElementChild.offsetWidth + 20;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft + step > maxScroll + 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [newArrivals]);

  useEffect(() => {
    if (featuredProjects.length === 0) return;
    const timer = setInterval(() => {
      const el = projectCarouselRef.current;
      if (!el) return;
      const card = el.querySelector('.product-card');
      if (!card) return;
      const step = card.offsetWidth + 20;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft + step > maxScroll + 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredProjects]);

  useEffect(() => {
    if (laserProducts.length === 0) return;
    const timer = setInterval(() => {
      const el = laserCarouselRef.current;
      if (!el) return;
      const card = el.querySelector('.product-card');
      if (!card) return;
      const step = card.offsetWidth + 20;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft + step > maxScroll + 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [laserProducts]);

  const scrollCarousel = (dir) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector('.product-card');
    if (!card) return;
    const step = card.offsetWidth + 20;
    const current = Math.round(el.scrollLeft / step);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = Math.min(Math.max((current + dir) * step, 0), maxScroll);
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  const scrollCategories = (dir) => {
    const el = catCarouselRef.current;
    if (!el || !el.firstElementChild) return;
    const step = el.firstElementChild.offsetWidth + 24;
    const current = Math.round(el.scrollLeft / step);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = Math.min(Math.max((current + dir) * step, 0), maxScroll);
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  const scrollProjectCarousel = (dir) => {
    const el = projectCarouselRef.current;
    if (!el) return;
    const card = el.querySelector('.product-card');
    if (!card) return;
    const step = card.offsetWidth + 20;
    const current = Math.round(el.scrollLeft / step);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = Math.min(Math.max((current + dir) * step, 0), maxScroll);
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  const scrollNewArrivals = (dir) => {
    const el = newArrivalsRef.current;
    if (!el || !el.firstElementChild) return;
    const step = el.firstElementChild.offsetWidth + 20;
    const current = Math.round(el.scrollLeft / step);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = Math.min(Math.max((current + dir) * step, 0), maxScroll);
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  const scrollLaserCarousel = (dir) => {
    const el = laserCarouselRef.current;
    if (!el) return;
    const card = el.querySelector('.product-card');
    if (!card) return;
    const step = card.offsetWidth + 20;
    const current = Math.round(el.scrollLeft / step);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = Math.min(Math.max((current + dir) * step, 0), maxScroll);
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  return (
    <>
      <section className="hero" style={{ paddingTop: '64px' }}>
        <video
          className="hero-video-bg"
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="hero-video-overlay" />

        <div className="hero-content">
          <h1>See the <span>Future</span> of Technology</h1>
          <p>
            From 3D printers to Arduino modules and robotics parts — J.Electronics brings you the sharpest
            electronics and DIY components, curated for makers who demand more.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/products')}>Explore Products</button>
            <button className="btn-primary" onClick={() => navigate('/projects')}>Explore Projects</button>
            <button className="btn-ghost" onClick={() => navigate('/contact')}>Get in Touch</button>
          </div>
          <div className="hero-stats">
            {[
              [productCount, 'Products'],
              [projectCount, 'Projects'],
              ['98%', 'Satisfaction'],
            ].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '1.4rem', color: 'var(--cyan)' }}>{val}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-mid)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="marquee">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i}>✦ {m}</span>
          ))}
        </div>
      </div>

      <div className="container">
        <section className="section">
          <div className="section-divider" />
          <div className="section-head section-head-center">
            <div>
              <h2>Browse Categories</h2>
              <p>Explore our full range of premium electronics organized by what matters most to you.</p>
            </div>
          </div>
          <div className="carousel-wrap">
            <button className="carousel-arrow prev" onClick={() => scrollCategories(-1)} aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="cat-carousel cat-carousel-lg" ref={catCarouselRef}>
              {categories.map((cat) => (
                <div key={cat.id} className="cat-card" onClick={() => navigate(`/products?category=${cat.id}`)}>
                  <div className="cat-image-wrap">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="cat-image" />
                    ) : (
                      <div className="cat-emoji">📦</div>
                    )}
                  </div>
                  <div style={{ padding: '12px 4px 4px' }}>
                    <div className="cat-name">{cat.name}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="carousel-arrow next" onClick={() => scrollCategories(1)} aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </section>

        <section className="section">
          <div className="section-divider" />
          <div className="section-head section-head-center">
            <div>
              <h2>New Arrivals</h2>
              <p>Fresh in stock — the latest products and project kits, just added.</p>
            </div>
          </div>
          <div className="carousel-wrap">
            <button className="carousel-arrow prev" onClick={() => scrollNewArrivals(-1)} aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="product-carousel" ref={newArrivalsRef}>
              {newArrivals.map((item) => {
                const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Hi! I want to buy: ${item.name} (${formatPrice(item.price)})`
                )}`;
                return (
                <div key={item.id} className="product-card">
                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--cyan)', color: '#000', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', zIndex: 1 }}>
                    NEW
                  </div>
                  <div
                    onClick={() => navigate(item.type === 'project' ? `/project/${item.id}` : `/product/${item.id}`)}
                    style={{ width: '100%', aspectRatio: '1', background: 'var(--bg3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{item.type === 'project' ? 'Project' : 'Product'}</span>
                    )}
                  </div>
                  <div style={{ padding: '12px 4px 4px' }}>
                    <div
                      onClick={() => navigate(item.type === 'project' ? `/project/${item.id}` : `/product/${item.id}`)}
                      style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px', cursor: 'pointer' }}
                    >
                      {item.name}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.95rem', color: 'var(--cyan)', fontWeight: 700 }}>{formatPrice(item.price)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(item.id, item.type, 1); navigate('/checkout'); }}
                        className="btn-primary"
                        style={{ flex: 1, padding: '9px', fontSize: '0.8rem' }}
                      >
                        Buy Now
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(item.id, item.type, 1); }}
                        className="btn-ghost"
                        style={{ flex: 1, padding: '9px', fontSize: '0.8rem' }}
                      >
                        🛒 Add to Cart
                      </button>
                    </div>
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="btn-ghost"
                      style={{ display: 'flex', marginTop: '8px', padding: '9px', fontSize: '0.8rem', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                        <path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 4a8.94 8.94 0 0 0-7.74 13.4L3 21l3.7-1.27a8.93 8.93 0 0 0 4.34 1.1h.01a8.94 8.94 0 0 0 8.93-8.93 8.87 8.87 0 0 0-2.38-5.58zM12.05 19.4h-.01a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.8.95.94-2.73-.18-.28A7.42 7.42 0 1 1 19.5 12a7.45 7.45 0 0 1-7.45 7.4z" />
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
                );
              })}
            </div>
            <button className="carousel-arrow next" onClick={() => scrollNewArrivals(1)} aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </section>

        <section className="section">
          <div className="section-divider" />
          <div className="section-head section-head-center">
            <div>
              <h2>Featured Products</h2>
              <p>The season's most sought-after tech — from 3D printers to Arduino-based DIY builds.</p>
            </div>
            <a className="section-link" href="/products" onClick={(e) => { e.preventDefault(); navigate('/products'); }}>View All →</a>
          </div>
          <div className="carousel-wrap">
            <button className="carousel-arrow prev" onClick={() => scrollCarousel(-1)} aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="product-carousel" ref={carouselRef}>
              {featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            <button className="carousel-arrow next" onClick={() => scrollCarousel(1)} aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </section>

        <section className="section section-tinted">
          <div className="section-divider" />
          <div className="section-head section-head-center">
            <div>
              <h2>Featured Projects</h2>
              <p>Get inspired with expert-curated projects, from beginner-friendly Arduino builds to advanced robotics systems.</p>
            </div>
            <a className="section-link" href="/projects" onClick={(e) => { e.preventDefault(); navigate('/projects'); }}>View All →</a>
          </div>
          <div className="carousel-wrap">
            <button className="carousel-arrow prev" onClick={() => scrollProjectCarousel(-1)} aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="product-carousel" ref={projectCarouselRef}>
              {featuredProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
            <button className="carousel-arrow next" onClick={() => scrollProjectCarousel(1)} aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </section>

        {laserProducts.length >= 0 && (
          <section className="section">
            <div className="section-divider" />
            <div className="section-head section-head-center">
              <div>
                <h2>Laser Modules</h2>
                <p>High-precision laser heads and engraving modules for CNC, wood, acrylic, and metal work.</p>
              </div>
              <a
                className="section-link"
                href={laserCategoryId ? `/products?category=${laserCategoryId}` : '/products'}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(laserCategoryId ? `/products?category=${laserCategoryId}` : '/products');
                }}
              >
                View All →
              </a>
            </div>
            <div className="carousel-wrap">
              <button className="carousel-arrow prev" onClick={() => scrollLaserCarousel(-1)} aria-label="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div className="product-carousel" ref={laserCarouselRef}>
                {laserProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <button className="carousel-arrow next" onClick={() => scrollLaserCarousel(1)} aria-label="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}