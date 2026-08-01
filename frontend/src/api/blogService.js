import api from "./axiosConfig";

// Customer frontend only needs read access — write endpoints (POST/PUT/DELETE)
// belong to the admin panel, so intentionally not included here.

// GET /api/blog
export const getBlogs = async () => {
  const res = await api.get("/api/blog", { params: { limit: 100 } });
  return res.data;
};

// GET /api/blog/:id
export const getBlog = async (id) => {
  const res = await api.get(`/api/blog/${id}`);
  return res.data;
};