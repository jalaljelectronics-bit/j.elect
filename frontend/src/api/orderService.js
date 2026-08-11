import api from "./axiosConfig";

export const getShippingOptions = async () => {
  const res = await api.get("/api/orders/shipping-options");
  return res.data;
};

export const checkout = async (payload) => {
  const res = await api.post("/api/orders", payload);
  return res.data;
};

export const getMyOrders = async () => {
  const res = await api.get("/api/orders");
  return res.data;
};

export const getOrderById = async (id) => {
  const res = await api.get(`/api/orders/${id}`);
  return res.data;
};
