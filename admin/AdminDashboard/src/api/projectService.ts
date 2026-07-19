import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/projects`
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type { LinkedProduct } from '../components/LinkedProductsEditor';
import type { LinkedProduct } from '../components/LinkedProductsEditor';

export interface ContentSection {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
}

export interface ProjectPayload {
  title: string;
  category: 'Commercial' | 'University';
  status?: 'In Progress' | 'Completed' | 'On Hold';
  price: number;
  imageUrl: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  githubUrl: string;
  introDescription: string;
  introImageUrl: string;
  sections: ContentSection[];
  linkedProducts: LinkedProduct[];
}

export const getProjects = async (filters: Record<string, any> = {}) => {
  const res = await api.get('/', { params: filters });
  return res.data;
};

export const getProjectById = async (id: number) => {
  const res = await api.get(`/${id}`);
  return res.data;
};

export const createProject = async (data: ProjectPayload) => {
  const res = await api.post('/', data);
  return res.data;
};

export const updateProject = async (id: number, data: Partial<ProjectPayload>) => {
  const res = await api.put(`/${id}`, data);
  return res.data;
};

export const deleteProject = async (id: number) => {
  const res = await api.delete(`/${id}`);
  return res.data;
};
