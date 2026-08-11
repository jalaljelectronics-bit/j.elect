import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/orders`
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface OrderItem {
  id: number;
  itemType: 'PRODUCT' | 'PROJECT';
  itemName: string;
  quantity: number;
  priceAtOrder: number;
}

export interface Order {
  id: number;
  userId: number;
  user?: { id: number; name: string; email: string };
  shippingAddress: string;
  billingAddress: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  notes: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber: string | null;
  createdAt: string;
  items: OrderItem[];
}

// Admin — get every order, with customer info
export const getAllOrders = async (): Promise<Order[]> => {
  const res = await api.get('/admin/all');
  return res.data;
};

export const getOrderById = async (id: number): Promise<Order> => {
  const res = await api.get(`/${id}`);
  return res.data;
};

// Admin only — matches PUT /api/orders/:id/status
export const updateOrderStatus = async (
  id: number,
  payload: { status?: Order['status']; trackingNumber?: string }
) => {
  const res = await api.put(`/${id}/status`, payload);
  return res.data;
};
// Admin only — matches DELETE /api/orders/:id
export const deleteOrder = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};

// Admin only — matches DELETE /api/orders/bulk-delete
export const deleteOrders = async (orderIds: number[]): Promise<void> => {
  await api.delete('/bulk-delete', { data: { orderIds } });
};