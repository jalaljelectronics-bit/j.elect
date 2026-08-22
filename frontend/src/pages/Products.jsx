import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts } from '../api/productService';
import { getCategories } from '../api/categoryService';
import ProductCard from '../components/ProductCard';

// Maps the UI's sort labels to the exact keys the backend switch statement understands.
// "rating" has no backend equivalent — sorted client-side on the current page only (see below).
const SORT_MAP = {
  featured: undefined, // backend defaults       to newest-first when sort is omitted
  'price-asc': 'price_asc',
  'price-desc': 'price_desc',
  rating: undefined,
};

// Set this to your image URL when you decide, e.g. '/products-banner.jpg'.
// Leave empty for the gradient-only look (matches .page-banner.no-image).
const BANNER_IMAGE = '';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mobile-only: controls whether the category list under the "Categories"
  // header is expanded or collapsed. Ignored on desktop (list is always
  // visible there via CSS — see .sidebar-caret / .sidebar-list rules).
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const gridRef = useRef(null);
  const isFirstRender = useRef(true);

  const activeCategory = params.get('category') || '';
  const query = params.get('q') || '';
  const sort = params.get('sort') || 'featured';
  const page = Number(params.get('page') || 1);

  // Categories load once — they don't change per filter/page.
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Filtered/sorted views of this page (?category=, ?sort=, ?page=, ?q=) are
  // all variations of the same content — Google should treat /products as the
  // single canonical URL, not index each filter combination separately.
  // This is what fixes the "Duplicate without user-selected canonical" flag
  // Search Console reported on /products?category=44, ?category=27, etc.
  // Empty dependency array is intentional: the canonical stays /products no
  // matter how activeCategory/query/sort/page change, so it never needs to re-run.
  useEffect(() => {
    const canonicalUrl = 'https://www.jelectronics.store/products';
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getProducts({
      search: query || undefined,
      category: activeCategory || undefined, // backend expects a numeric category id
      sort: SORT_MAP[sort],
      page,
      limit: 12,
    })
      .then((data) => {
        let list = data.products;
        // Client-side fallback for "Highest Rated" — only sorts within the current page,
        // since the backend has no rating sort option.
        if (sort === 'rating') {
          list = [...list].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }
        setProducts(list);
        setTotalPages(data.totalPages);
        setTotalProducts(data.totalProducts);
      })
      .catch((err) => {
        console.error('Failed to load products:', err);
        setError('Could not load products. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [activeCategory, query, sort, page]);

  // The Previous/Next buttons sit at the BOTTOM of the grid, so after a page
  // change the user would otherwise be left staring at the footer while a
  // fresh set of products loads off-screen above them. Scroll back up to the
  // top of the results column whenever the page number changes.
  //
  // Skipped on first render so that deep-linking to ?page=3 (or landing here
  // from a shared URL) doesn't yank the viewport around on arrival.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  // Single source of truth for building the next URL params — always carries forward
  // the current category/query/sort/page unless explicitly overridden, so no filter
  // silently disappears when only one control changes.
  const updateParams = (overrides) => {
    const next = {
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(query ? { q: query } : {}),
      ...(sort !== 'featured' ? { sort } : {}),
      ...(page > 1 ? { page: String(page) } : {}),
      ...overrides,
    };
    // Changing category/query/sort (not page itself) resets back to page 1
    if (!('page' in overrides)) delete next.page;
    Object.keys(next).forEach((k) => (next[k] === '' || next[k] == null) && delete next[k]);
    setParams(next);
  };

  const clearSearch = () => updateParams({ q: '' });

  const selectCategory = (categoryId) => {
    updateParams({ category: categoryId });
    // Auto-collapse after picking a category — mobile only (no-op on
    // desktop since the list is always open there regardless of this state).
    setMobileFiltersOpen(false);
  };

  return (
    <div className="page-wrap">
      <div
        className={`page-banner align-left${BANNER_IMAGE ? '' : ' no-image'}`}
        style={BANNER_IMAGE ? { '--banner-image': `url(${BANNER_IMAGE})` } : undefined}
      >
        {BANNER_IMAGE && <div className="page-banner-media" />}
        <div className="page-banner-veil" />
        <div className="page-banner-inner">
          <div className="page-banner-content">
            <span className="page-banner-eyebrow">Shop</span>
            <h1 className="page-banner-title">Shop All Products</h1>
            <p className="page-banner-subtitle">Browse our full catalog of electronics, components, and maker gear.</p>
            <div className="page-banner-crumbs">
              <Link to="/">Home</Link>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">Products</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="shop-layout" style={{ paddingBottom: '80px', paddingTop: '32px' }}>
          <aside className="sidebar">
            <h4
              className="sidebar-toggle"
              onClick={() => setMobileFiltersOpen((v) => !v)}
            >
              <span>Categories</span>
              <span className={`sidebar-caret${mobileFiltersOpen ? ' open' : ''}`} aria-hidden="true">▾</span>
            </h4>

            <div className={`sidebar-list${mobileFiltersOpen ? ' open' : ''}`}>
              <div
                className={`sidebar-cat${!activeCategory ? ' active' : ''}`}
                onClick={() => selectCategory('')}
              >
                <span>All Products</span>
              </div>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`sidebar-cat${Number(activeCategory) === cat.id ? ' active' : ''}`}
                  onClick={() => selectCategory(String(cat.id))}
                >
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </aside>

          <div ref={gridRef} style={{ scrollMarginTop: '110px' }}>
            {query && (
              <div
                className="search-query-banner"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}
              >
                <span style={{ fontSize: '0.95rem' }}>
                  Showing results for <strong>&ldquo;{query}&rdquo;</strong>
                </span>
                <button
                  className="btn-ghost"
                  style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                  onClick={clearSearch}
                >
                  Clear search ✕
                </button>
              </div>
            )}

            <div className="toolbar">
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-mid)' }}>
                {loading ? 'Loading…' : `${totalProducts} products found`}
              </span>
              <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })}>
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated (this page only)</option>
              </select>
            </div>

            {error && <div className="empty-state">{error}</div>}

            {!error && !loading && products.length === 0 ? (
              <div className="empty-state search-not-found" style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
                {query ? (
                  <>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>
                      No results found for &ldquo;{query}&rdquo;
                    </div>
                    <div style={{ color: 'var(--gray-mid)', fontSize: '0.9rem' }}>
                      Try checking your spelling, using fewer or more general keywords, or browsing a category instead.
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>No products match your filters.</div>
                )}
              </div>
            ) : (
              <div className="product-grid">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px' }}>
                <button
                  className="btn-ghost"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                >
                  Previous
                </button>
                <span style={{ alignSelf: 'center', fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
                <button
                  className="btn-ghost"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}