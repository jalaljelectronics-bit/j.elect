import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../api/orderService';

const STATUS_LABELS = {
  pending: '⏳ Pending',
  processing: '⚙️ Processing',
  shipped: '📦 Shipped',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled',
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOrderById(id)
      .then(setOrder)
      .catch((err) => setError(err.response?.data?.message || 'Could not load this order.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading order...</div>;
  if (error) return <div className="container" style={{ padding: '60px 0', color: '#c0392b' }}>{error}</div>;
  if (!order) return null;

  return (
    <div className="container order-detail-wrap">
      <Link to="/orders" style={{ fontSize: '0.85rem' }}>&larr; Back to Orders</Link>
      <h1 style={{ marginTop: '12px' }}>Order #{order.id}</h1>
      <p style={{ color: '#64748b' }}>
        Placed on {new Date(order.createdAt).toLocaleString()} · {STATUS_LABELS[order.status] || order.status}
      </p>

      {order.trackingNumber && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px', borderRadius: '6px', margin: '16px 0' }}>
          📦 Tracking number: <strong>{order.trackingNumber}</strong>
        </div>
      )}

      <h3 style={{ marginTop: '24px' }}>Items</h3>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        {order.items.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
            background: i % 2 === 0 ? '#fff' : '#f8fafc',
            color: '#000',
            borderBottom: i === order.items.length - 1 ? 'none' : '1px solid #e2e8f0'
          }}>
            <span>{item.itemName} <span style={{ color: '#64748b' }}>x{item.quantity}</span></span>
            <span>Rs {(item.priceAtOrder * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="order-summary-box">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>Rs {order.subtotal.toLocaleString()}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>Rs {order.shippingCost.toLocaleString()}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>Rs {order.taxAmount.toLocaleString()}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '6px' }}>
          <span>Total</span><span>Rs {order.total.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#fff' }}>
        <div><strong>Shipping to:</strong> {order.shippingAddress}</div>
        <div><strong>Method:</strong> {order.shippingMethod}</div>
        <div><strong>Payment:</strong> {order.paymentMethod}</div>
      </div>
    </div>
  );
}
