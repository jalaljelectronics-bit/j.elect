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
            <h4>Categories</h4>
            <div
              className={`sidebar-cat${!activeCategory ? ' active' : ''}`}
              onClick={() => updateParams({})}
            >
              <span>All Products</span>
            </div>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`sidebar-cat${Number(activeCategory) === cat.id ? ' active' : ''}`}
                onClick={() => updateParams({ category: String(cat.id) })}
              >
                <span>{cat.name}</span>
              </div>
            ))}
          </aside>

          <div ref={gridRef} style={{ scrollMarginTop: '110px' }}>
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
              <div className="empty-state">No products match your filters.</div>
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
