// src/api/catalogService.ts
//
// Small helper used by the Blog / Project forms to populate the
// "Linked Products" dropdown.
//
// IMPORTANT: this hits the live /api/products endpoint instead of the old
// static src/products.json. products.json had slug-style ids ("provisionx15")
// that do not exist in the database, so any link built from it pointed at a
// product the storefront could never resolve.
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface CatalogProduct {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  categoryName?: string;
}

// The storefront route is `/product/:id` (singular). Everything that builds a
// product link should go through this helper so the path can never drift again.
export const productPath = (productId: number | string) => `/product/${productId}`;

export const getCatalogProducts = async (): Promise<CatalogProduct[]> => {
  const token = localStorage.getItem('token');

  const res = await axios.get(`${API_URL}/api/products`, {
    params: { limit: 500, sort: 'name_asc' },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return (res.data?.products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
    categoryName: p.category?.name || ''
  }));
};
