import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api/projects`
});

// Add token to headers if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all projects
export const getProjects = async (filters = {}) => {
  try {
    const res = await api.get('/', { params: filters });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get single project
export const getProjectById = async (id) => {
  try {
    const res = await api.get(`/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create project (Admin)
export const createProject = async (projectData) => {
  try {
    const res = await api.post('/', projectData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update project (Admin)
export const updateProject = async (id, projectData) => {
  try {
    const res = await api.put(`/${id}`, projectData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete project (Admin)
export const deleteProject = async (id) => {
  try {
    const res = await api.delete(`/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Submit a customer inquiry/query on a project (Public)
export const createProjectQuery = async (id, queryData) => {
  try {
    const res = await api.post(`/${id}/queries`, queryData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get all queries for a project (Admin)
export const getProjectQueries = async (id) => {
  try {
    const res = await api.get(`/${id}/queries`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update a query's status (Admin)
export const updateQueryStatus = async (queryId, status) => {
  try {
    const res = await api.patch(`/queries/${queryId}/status`, { status });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default api;