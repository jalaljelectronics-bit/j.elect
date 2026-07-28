// src/components/LinkedProductsEditor.tsx
//
// Shared "Linked Products" editor used by both BlogForm and ProjectForm.
// Keeping it in one place means the link format can only ever be generated
// one way — which is what broke before (blog links were built as
// `/products/<slug>`, a route the storefront doesn't have, so React Router
// fell through to the `*` catch-all and rendered Home).
import React, { useEffect, useRef, useState } from 'react';
import { CatalogProduct, getCatalogProducts, productPath } from '../api/catalogService';

export interface LinkedProduct {
  id: string;
  productId?: string; // real numeric Product id, as a string
  label: string;
  url: string;
}

export const makeLinkId = () =>
  `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const blankLink = (): LinkedProduct => ({
  id: makeLinkId(),
  productId: '',
  label: '',
  url: ''
});

// Trims + drops empty rows before sending to the API.
export const cleanLinks = (links: LinkedProduct[]): LinkedProduct[] =>
  links
    .filter(l => l.label.trim() || l.url.trim() || l.productId)
    .map(l => ({
      ...l,
      productId: l.productId || '',
      label: l.label.trim(),
      url: l.url.trim()
    }));

// Returns an error message, or null when everything is valid.
export const validateLinks = (links: LinkedProduct[]): string | null => {
  const broken = cleanLinks(links).find(l => l.label && !l.url && !l.productId);
  if (broken) {
    return `Please pick a product (or add a link URL) for "${broken.label}", or remove that entry.`;
  }
  return null;
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box', fontSize: '0.95rem'
};

const linkCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem'
};

// ============================================================
// Searchable product combobox
// Replaces the old plain <select> — with 100+ catalog items a
// native dropdown is unusable, so this filters as you type.
// ============================================================
interface ProductSearchSelectProps {
  catalog: CatalogProduct[];
  loading: boolean;
  error: string;
  selectedProductId?: string;
  selectedLabel: string;
  onPick: (product: CatalogProduct) => void;
  onClear: () => void;
}

const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({
  catalog,
  loading,
  error,
  selectedProductId,
  selectedLabel,
  onPick,
  onClear
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // When a product is selected elsewhere (e.g. row initialized from saved
  // data), reflect its label in the search box when the box isn't focused.
  useEffect(() => {
    if (!open) setQuery('');
  }, [selectedProductId, open]);

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.slice(0, 50); // cap the idle list so it isn't huge
    return catalog
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q)
      )
      .slice(0, 50);
  })();

  const displayValue = open ? query : (selectedLabel || query);

  const handleSelect = (product: CatalogProduct) => {
    onPick(product);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) handleSelect(filtered[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={displayValue}
          disabled={loading}
          placeholder={loading ? 'Loading products…' : 'Search catalog by name…'}
          onFocus={() => { setQuery(''); setOpen(true); setHighlight(0); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
          onKeyDown={handleKeyDown}
          // Delay closing so a click on a list item registers before blur closes it.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{ ...inputStyle, backgroundColor: '#fff', cursor: loading ? 'wait' : 'text' }}
        />
        {selectedProductId ? (
          <button
            type="button"
            onClick={() => { onClear(); setQuery(''); }}
            title="Clear selection"
            style={{
              flexShrink: 0, padding: '0 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem',
              backgroundColor: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {open && !loading && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
            backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '0.375rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: '260px', overflowY: 'auto'
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '0.625rem', color: '#94a3b8', fontSize: '0.875rem' }}>No products match.</div>
          ) : (
            filtered.map((p, i) => (
              <div
                key={p.id}
                // onMouseDown (not onClick) so it fires before the input's onBlur.
                onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
                onMouseEnter={() => setHighlight(i)}
                style={{
                  padding: '0.5rem 0.625rem', cursor: 'pointer', fontSize: '0.875rem',
                  backgroundColor: i === highlight ? '#e0f2fe' : '#fff',
                  color: '#1e293b', borderBottom: '1px solid #f1f5f9'
                }}
              >
                {p.name}
                {p.categoryName ? (
                  <span style={{ color: '#94a3b8' }}> — {p.categoryName}</span>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <p style={{ color: '#b45309', fontSize: '0.75rem', marginTop: '0.375rem', marginBottom: 0 }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};

interface Props {
  value: LinkedProduct[];
  onChange: (links: LinkedProduct[]) => void;
  helperText?: string;
}

const LinkedProductsEditor: React.FC<Props> = ({ value, onChange, helperText }) => {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    let active = true;
    getCatalogProducts()
      .then(products => { if (active) setCatalog(products); })
      .catch(err => {
        console.error(err);
        if (active) setCatalogError('Could not load the product catalog. You can still paste a link URL manually.');
      })
      .finally(() => { if (active) setLoadingCatalog(false); });
    return () => { active = false; };
  }, []);

  const addLink = () => onChange([...value, blankLink()]);
  const removeLink = (linkId: string) => onChange(value.filter(l => l.id !== linkId));
  const updateLink = (linkId: string, patch: Partial<LinkedProduct>) =>
    onChange(value.map(l => (l.id === linkId ? { ...l, ...patch } : l)));

  // Picking a search result stores the real DB id and generates the correct
  // storefront path.
  const handlePickCatalogProduct = (linkId: string, product: CatalogProduct) => {
    updateLink(linkId, {
      productId: String(product.id),
      label: product.name,
      url: productPath(product.id)
    });
  };

  const handleClearCatalogProduct = (linkId: string) => {
    updateLink(linkId, { productId: '', url: '' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
          Linked Products{' '}
          <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>
            {helperText || '(readers can click through to view these on the site)'}
          </span>
        </label>
        <button
          type="button"
          onClick={addLink}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Product Link
        </button>
      </div>

      {value.length === 0 ? (
        <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0, fontSize: '0.875rem' }}>
          No product links added yet. Click "Add Product Link" to let visitors click through to a product page.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {value.map((link, idx) => (
            <div key={link.id} style={linkCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Product Link {idx + 1}</span>
                <button type="button" onClick={() => removeLink(link.id)} title="Remove link" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                  Search Catalog
                </label>
                <ProductSearchSelect
                  catalog={catalog}
                  loading={loadingCatalog}
                  error={catalogError}
                  selectedProductId={link.productId}
                  selectedLabel={link.label}
                  onPick={(product) => handlePickCatalogProduct(link.id, product)}
                  onClear={() => handleClearCatalogProduct(link.id)}
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>Display Label</label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(link.id, { label: e.target.value })}
                    placeholder="e.g. ProVision X15 Ultra"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>Link URL</label>
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => updateLink(link.id, { url: e.target.value, productId: '' })}
                    placeholder="/product/12"
                    style={inputStyle}
                  />
                </div>
              </div>

              {link.productId && (
                <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                  ✓ Linked to product #{link.productId} → opens {productPath(link.productId)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LinkedProductsEditor;