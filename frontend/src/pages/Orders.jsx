import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/orderService';

const STATUS_LABELS = {
  pending: '⏳ Pending',
  processing: '⚙️ Processing',
  shipped: '📦 Shipped',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.response?.data?.message || 'Could not load orders.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading your orders...</div>;
  if (error) return <div className="container" style={{ padding: '60px 0', color: '#c0392b' }}>{error}</div>;

  if (orders.length === 0) {
  return (
    <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '12px' }}>No orders yet</h1>
      <p style={{ marginBottom: '28px' }}>Once you place an order, it'll show up here.</p>
      <Link to="/products" className="btn-primary">Browse Products</Link>
    </div>
  );
}

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <h1>My Orders</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px', border: '1px solid #e2e8f0', borderRadius: '8px',
              textDecoration: 'none', color: 'inherit'
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Order #{order.id}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>Rs {order.total.toLocaleString()}</div>
              <div style={{ fontSize: '0.85rem' }}>{STATUS_LABELS[order.status] || order.status}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}