import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../data/catalog';
import { getProducts, normalizeProduct } from '../api/productService';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const barRef = useRef(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    function onDocClick(e) {
      if (barRef.current && !barRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Queries the live /api/products endpoint (server-side "contains" match on
  // name) so newly added admin products show up immediately, instead of
  // filtering against the static products.json snapshot. Debounced slightly
  // since this now hits the database on every keystroke rather than an
  // in-memory array.
  const runFilter = (value) => {
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
        const data = await getProducts({ search: q, limit: 8 });
        if (thisRequest !== requestIdRef.current) return; // stale response, newer keystroke won
        setMatches((data.products || []).map(normalizeProduct));
      } catch (err) {
        console.error('Search failed:', err);
        if (thisRequest === requestIdRef.current) setMatches([]);
      }
      setActiveIndex(-1);
      setOpen(true);
    }, 250);
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
  const goToSearchResults = (value) => {
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (!open || !matches.length) return;
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.min(matches.length, 8) - 1));
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
      <div className={`search-results${open ? ' open' : ''}`}>
        {matches.length === 0 ? (
          <div className="search-empty">No products match "{query}"</div>
        ) : (
          <>
            {matches.slice(0, 8).map((p, i) => (
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