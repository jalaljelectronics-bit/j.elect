import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../data/catalog';
import { getProducts, normalizeProduct } from '../api/productService';
import { getCategories } from '../api/categoryService';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(''); // '' = All
  const barRef = useRef(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(cats || []))
      .catch((err) => console.error('Failed to load categories for search:', err));
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (barRef.current && !barRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Queries the live /api/products endpoint (server-side per-word match
  // across name + description) so newly added admin products show up
  // immediately, instead of filtering against a static snapshot. Debounced
  // slightly since this now hits the database on every keystroke rather
  // than an in-memory array. categoryId is included whenever a specific
  // category (not "All") is selected, so the dropdown results respect the
  // scope the user picked instead of always searching everything.
  const runFilter = (value, catId = categoryId) => {
    const q = value.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q) {
      setOpen(false);
      setMatches([]);
      return;
    }

    const thisRequest = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const params = { search: q, limit: 12 };
        if (catId) params.category = catId;
        const data = await getProducts(params);
        if (thisRequest !== requestIdRef.current) return; // stale response, newer keystroke won
        setMatches((data.products || []).map(normalizeProduct));
      } catch (err) {
        console.error('Search failed:', err);
        if (thisRequest === requestIdRef.current) setMatches([]);
      }
      setActiveIndex(-1);
      setOpen(true);
    }, 180);
  };

  const goToProduct = (id) => {
    setOpen(false);
    setQuery('');
    navigate(`/product/${id}`);
  };

  // Sends the user to the full results page (Products.jsx), the same way
  // Daraz/Amazon-style search bars behave on a bare Enter press: it doesn't
  // guess a product, it shows everything matching the query — including the
  // page's own "No products match your filters" empty state when there are
  // zero results, instead of silently doing nothing or jumping somewhere odd.
  // Carries the selected category through as a query param so Products.jsx
  // opens already scoped to it, same as clicking a category in the nav dropdown.
  const goToSearchResults = (value, catId = categoryId) => {
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    const params = new URLSearchParams({ q });
    if (catId) params.set('category', catId);
    navigate(`/products?${params.toString()}`);
  };

  const onCategoryChange = (e) => {
    const newCatId = e.target.value;
    setCategoryId(newCatId);
    // Re-run the current search immediately under the new scope, so picking
    // a category updates the dropdown results without needing another keystroke.
    if (query.trim()) runFilter(query, newCatId);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (!open || !matches.length) return;
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.min(matches.length, 12) - 1));
    } else if (e.key === 'ArrowUp') {
      if (!open || !matches.length) return;
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Only jump straight to a product if the user has actually arrow-key
      // highlighted one. A plain Enter always goes to the results page —
      // that's what lets "no matches" show a real not-found state instead
      // of picking matches[0] or failing silently.
      const highlighted = activeIndex >= 0 ? matches[activeIndex] : null;
      if (highlighted) {
        goToProduct(highlighted.id);
      } else {
        goToSearchResults(query);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="search-bar" ref={barRef}>
      {/* Fused pill wrapper: CSS (.search-bar-controls) handles the flex
          row layout, background, border, and pill radius that keep the
          category select and search input joined side by side. */}
      <div className="search-bar-controls">
        <select
          className="search-cat-select"
          value={categoryId}
          onChange={onCategoryChange}
          onClick={(e) => e.stopPropagation()}
          aria-label="Search category"
        >
          <option value="">All</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <div className="search-input-group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Search products..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              runFilter(e.target.value);
            }}
            onFocus={() => query.trim() && runFilter(query)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>

      <div className={`search-results${open ? ' open' : ''}`}>
        {matches.length === 0 ? (
          <div className="search-empty">No products match "{query}"</div>
        ) : (
          <>
            {matches.slice(0, 12).map((p, i) => (
              <div
                key={p.id}
                className={`search-result-item${i === activeIndex ? ' active' : ''}`}
                onClick={() => goToProduct(p.id)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <div className="search-result-icon">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }}
                    />
                  ) : (
                    p.emoji || p.image || '📦'
                  )}
                </div>
                <div className="search-result-info">
                  <div className="search-result-name">{p.name}</div>
                  <div className="search-result-meta">{p.category || ''}</div>
                </div>
                <div className="search-result-price">{formatPrice(p.price)}</div>
              </div>
            ))}
            {/* Daraz-style footer row: lets the user jump to the full results
                page for the raw query without having to press Enter. */}
            <div
              className="search-result-item search-view-all"
              onClick={() => goToSearchResults(query)}
              onMouseEnter={() => setActiveIndex(-1)}
            >
              <div className="search-result-info">
                <div className="search-result-name">View all results for "{query}"</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}