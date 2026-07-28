import api from "./axiosConfig";

// GET /api/products?search=&category=&sort=&minPrice=&maxPrice=
// Pass whatever filters your backend controller supports as a plain object;
// axios turns this into query params automatically.
export const getProducts = async (filters = {}) => {
  const res = await api.get("/api/products", { params: filters });
  return res.data;
};

// GET /api/products/:id
export const getProduct = async (id) => {
  const res = await api.get(`/api/products/${id}`);
  return res.data;
};

// The backend returns raw DB rows: category is a nested { id, name } object
// (from Prisma's `include: { category: true }`), and the image field is
// called `imageUrl`. Components like ProductCard/SearchBar were written
// against the old static products.json shape, which used a flat `category`
// string and an `image`/`emoji` field. This maps a DB row onto that shape
// so both data sources can be rendered by the same components.
export const normalizeProduct = (p) => ({
  ...p,
  category: (p.category && p.category.name) || p.category || '',
  categoryId: p.categoryId ?? p.category?.id,
  // Explicit boolean coercion so Home.jsx's `.filter((p) => p.isFeatured)`
  // never silently fails on undefined/null for older rows or edge cases.
  isFeatured: Boolean(p.isFeatured),
  isNewArrival: Boolean(p.isNewArrival),
});