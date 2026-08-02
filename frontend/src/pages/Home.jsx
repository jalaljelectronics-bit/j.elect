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

        // Featured Products — now driven by the admin-controlled isFeatured
        // flag instead of "first 8 in the list" (which used to just be the
        // 8 newest products, causing overlap with New Arrivals below).
        // Falls back to the old slice only if nothing has been marked
        // featured yet, so the section isn't empty on a fresh DB.
        const featuredProductList = products.filter((p) => p.isFeatured);
        setFeaturedProducts(
          (featuredProductList.length > 0 ? featuredProductList : products).slice(0, 8)
        );

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

        // New Arrivals — now driven by the admin-controlled isNewArrival
        // flag on both products and projects, same manual-curation pattern
        // as Featured, instead of a rolling 30-day date window. This is
        // what actually stops the two sections from ever showing the exact
        // same items just because something was added recently: a product
        // has to be deliberately marked new-arrival, not merely recent.
        const newArrivalProducts = products.filter((p) => p.isNewArrival);
        const newArrivalProjects = projects.filter((p) => p.isNewArrival);

        const arrivalsList = [...newArrivalProducts, ...newArrivalProjects];

        // Fallback: if nothing has been flagged yet anywhere, show the
        // most recently created items instead of an empty section.
        const fallbackList =
          arrivalsList.length > 0
            ? arrivalsList
            : [...products, ...projects].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );

        const arrivals = fallbackList
          .map((item) => toArrival(item, item.title ? 'project' : 'product'))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setNewArrivals(arrivals.slice(0, 12));
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
            <div className="product-carousel new-arrivals-carousel" ref={newArrivalsRef}>
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
  style={{
    cursor: 'pointer',
    width: '100%',
    aspectRatio: '4 / 3',
    background: '#FFFFFF',
    borderRadius: '12px 12px 0 0',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  {item.image ? (
    <img
      src={item.image}
      alt={item.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  ) : (
    <div style={{ padding: '40px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
      {item.type === 'project' ? 'Project' : 'Product'}
    </div>
  )}
</div>

                    <div className="product-info">
                      <div
                        onClick={() => navigate(item.type === 'project' ? `/project/${item.id}` : `/product/${item.id}`)}
                        className="product-name"
                        style={{ cursor: 'pointer' }}
                      >
                        {item.name}
                      </div>

                      <div className="product-price">{formatPrice(item.price)}</div>

                      <div style={{ marginTop: 'auto' }}>
                        <div className="product-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item.id, item.type, 1);
                              navigate('/checkout');
                            }}
                            className="btn-buy-now"
                          >
                            Buy Now
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item.id, item.type, 1);
                            }}
                            className="btn-quick-view"
                          >
                            🛒 Add
                          </button>
                        </div>

                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-quick-view"
                          style={{
                            display: 'flex',
                            marginTop: '8px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                          }}
                        >
                          <svg viewBox="0 0 32 32" width="14" height="14" fill="currentColor">
                            <path d="M16.04 2.67C8.63 2.67 2.63 8.67 2.63 16.08c0 2.5.68 4.83 1.85 6.85L2 30l7.24-2.42a13.36 13.36 0 0 0 6.8 1.85h.01c7.4 0 13.4-6 13.4-13.41 0-3.58-1.4-6.94-3.93-9.47a13.31 13.31 0 0 0-9.48-3.93zm0 24.55h-.01a11.13 11.13 0 0 1-5.68-1.56l-.41-.24-4.24 1.42 1.42-4.13-.27-.42a11.1 11.1 0 0 1-1.7-5.9c0-6.14 5-11.13 11.15-11.13 2.98 0 5.78 1.16 7.88 3.27a11.05 11.05 0 0 1 3.26 7.87c0 6.14-5 11.13-11.14 11.13z" />
                            <path d="M22.4 19.14c-.34-.17-2.02-1-2.33-1.1-.31-.12-.54-.17-.77.17-.23.34-.88 1.1-1.08 1.32-.2.23-.4.26-.74.09-.34-.17-1.44-.53-2.74-1.69-1.01-.9-1.7-2.02-1.9-2.36-.2-.34-.02-.53.15-.7.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.77-1.86-1.06-2.55-.28-.66-.56-.57-.77-.58l-.66-.01c-.23 0-.6.09-.91.43-.31.34-1.19 1.16-1.19 2.84 0 1.68 1.22 3.3 1.39 3.53.17.23 2.39 3.65 5.8 5.12.81.35 1.44.56 1.94.72.81.26 1.55.22 2.13.13.65-.1 2.02-.83 2.3-1.63.29-.8.29-1.48.2-1.63-.09-.15-.31-.23-.65-.4z" />
                          </svg>
                          WhatsApp
                        </a>
                      </div>
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
            <div className="product-carousel featured-carousel" ref={carouselRef}>
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
            <div className="product-carousel featured-carousel" ref={projectCarouselRef}>
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
              < a
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