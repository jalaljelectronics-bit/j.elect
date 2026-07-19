// src/components/LinkedProductsEditor.tsx
//
// Shared "Linked Products" editor used by both BlogForm and ProjectForm.
// Keeping it in one place means the link format can only ever be generated
// one way — which is what broke before (blog links were built as
// `/products/<slug>`, a route the storefront doesn't have, so React Router
// fell through to the `*` catch-all and rendered Home).
import React, { useEffect, useState } from 'react';
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

  // Picking from the dropdown stores the real DB id and generates the correct
  // storefront path. This is the path that was wrong before.
  const handlePickCatalogProduct = (linkId: string, productId: string) => {
    if (!productId) {
      updateLink(linkId, { productId: '', url: '' });
      return;
    }
    const product = catalog.find(p => String(p.id) === String(productId));
    if (product) {
      updateLink(linkId, {
        productId: String(product.id),
        label: product.name,
        url: productPath(product.id)
      });
    }
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

      {catalogError && (
        <p style={{ color: '#b45309', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>
          ⚠️ {catalogError}
        </p>
      )}

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
                  Pick from Catalog
                </label>
                <select
                  value={link.productId || ''}
                  onChange={(e) => handlePickCatalogProduct(link.id, e.target.value)}
                  disabled={loadingCatalog}
                  style={{ ...inputStyle, backgroundColor: '#fff', cursor: loadingCatalog ? 'wait' : 'pointer' }}
                >
                  <option value="">
                    {loadingCatalog ? 'Loading products…' : '-- Custom link (no catalog product) --'}
                  </option>
                  {catalog.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}{p.categoryName ? ` — ${p.categoryName}` : ''}
                    </option>
                  ))}
                </select>
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
