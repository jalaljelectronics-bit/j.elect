// Resolves a stored "linked product" entry into a real storefront path.
//
// The storefront route is `/product/:id` (singular — see App.jsx). Older data
// was saved as `/products/<slug>` (plural, slug id) which matches no route, so
// React Router fell through to the `*` catch-all and rendered Home. That is
// why linked products appeared to "go to the main home page".
//
// This helper repairs those old rows on read, so existing blog posts start
// working again without needing a data migration.

export const isExternalLink = (url = '') => /^(https?:)?\/\//i.test(String(url).trim());

export const resolveProductLink = (link) => {
  if (!link) return '/products';

  // Preferred: the real DB product id captured when the admin picked from the catalog.
  const productId = link.productId;
  if (productId !== undefined && productId !== null && String(productId).trim() !== '') {
    return `/product/${String(productId).trim()}`;
  }

  const raw = String(link.url || '').trim();
  if (!raw) return '/products';

  // Leave full external URLs alone.
  if (isExternalLink(raw)) return raw;

  // Normalize `/products/123`, `products/123`, `/product/123` → `/product/123`.
  const match = raw.match(/^\/?products?\/([^/?#]+)/i);
  if (match) return `/product/${match[1]}`;

  return raw.startsWith('/') ? raw : `/${raw}`;
};

// Only entries that will actually lead somewhere useful.
export const usableLinks = (linkedProducts) =>
  (Array.isArray(linkedProducts) ? linkedProducts : []).filter(
    (l) => l && (l.productId || l.url || l.label)
  );
