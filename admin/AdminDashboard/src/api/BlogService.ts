import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/blog`
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Types (canonical home for the blog shapes the admin UI uses)
// ---------------------------------------------------------------------------
export interface LinkedProduct {
  id: string;
  productId?: string; // set when picked from the catalog dropdown in the form
  label: string;
  url: string;
}

export type BlogStatus = 'Published' | 'Draft';

// The shape the admin components render.
export interface BlogPost {
  id: number;
  title: string;
  url: string;          // maps to `slug` in the DB
  author: string;
  publishDate: string;  // derived from createdAt
  status: BlogStatus;
  description: string;  // maps to `content` in the DB
  imageUrl: string;
  linkedProducts: LinkedProduct[];
}

// What a form submits.
export interface BlogInput {
  title: string;
  description: string;
  url?: string;
  status?: BlogStatus;
  author?: string;
  imageUrl?: string;
  linkedProducts?: LinkedProduct[];
}

export const makeLinkId = () =>
  `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------------
// Mapping helpers: DB record <-> admin UI model
// ---------------------------------------------------------------------------
const fromApi = (p: any): BlogPost => ({
  id: p.id,
  title: p.title ?? '',
  url: p.slug ?? '',
  author: p.author ?? 'Admin',
  publishDate: (p.createdAt ?? '').split('T')[0],
  status: (p.status as BlogStatus) ?? 'Draft',
  description: p.content ?? '',
  imageUrl: p.imageUrl ?? '',
  linkedProducts: Array.isArray(p.linkedProducts) ? p.linkedProducts : []
});

const toApi = (d: BlogInput) => ({
  title: d.title,
  content: d.description,
  slug: d.url || null,
  status: d.status || 'Draft',
  author: d.author || 'Admin',
  imageUrl: d.imageUrl || null,
  linkedProducts: d.linkedProducts || []
});

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------
export const getBlogs = async (): Promise<BlogPost[]> => {
  const res = await api.get('/');
  return (res.data.posts || []).map(fromApi);
};

export const getBlog = async (id: number): Promise<BlogPost> => {
  const res = await api.get(`/${id}`);
  return fromApi(res.data);
};

export const createBlog = async (data: BlogInput) => {
  const res = await api.post('/', toApi(data));
  return res.data;
};

export const updateBlog = async (id: number, data: BlogInput) => {
  const res = await api.put(`/${id}`, toApi(data));
  return res.data;
};

export const deleteBlog = async (id: number) => {
  const res = await api.delete(`/${id}`);
  return res.data;
};
