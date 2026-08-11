import React, { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, deleteOrder, deleteOrders, Order } from '../api/orderService';

const STATUS_OPTIONS: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_LABELS: Record<Order['status'], string> = {
  pending: '⏳ Pending',
  processing: '⚙️ Processing',
  shipped: '📦 Shipped',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled',
};

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not update status.');
    }
  };

  const handleSaveTracking = async (orderId: number) => {
    if (!trackingInput.trim()) {
      alert('Please enter a valid tracking reference.');
      return;
    }
    setSaving(true);
    try {
      await updateOrderStatus(orderId, { trackingNumber: trackingInput.trim() });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, trackingNumber: trackingInput.trim() } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, trackingNumber: trackingInput.trim() } : null));
      }
      setTrackingInput('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not save tracking number.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    const confirmed = window.confirm(`Delete order #${orderId}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(orderId);
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not delete order.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelect = (orderId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === orders.length ? new Set() : new Set(orders.map((o) => o.id))
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`Delete ${selectedIds.size} order(s)? This cannot be undone.`);
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await deleteOrders(ids);
      setOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
      if (selectedOrder && selectedIds.has(selectedOrder.id)) setSelectedOrder(null);
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not delete orders.');
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading orders...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#c0392b' }}>{error}</div>;

  return (
    <div>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Order Fulfillment Dashboard</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Update order status and add tracking numbers.</p>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.75rem 1rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: 500 }}>
            {selectedIds.size} order(s) selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            style={{ padding: '0.375rem 0.75rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
          >
            {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{ padding: '0.375rem 0.75rem', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Clear
          </button>
        </div>
      )}

      <div className="table-wrap" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto', marginTop: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', width: '2rem' }}>
                <input
                  type="checkbox"
                  checked={orders.length > 0 && selectedIds.size === orders.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>Order ID</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>Customer</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>Total</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(order.id)}
                    onChange={() => toggleSelect(order.id)}
                  />
                </td>
                <td
                  style={{ padding: '1rem', fontWeight: 600, color: '#3b82f6', cursor: 'pointer' }}
                  onClick={() => { setSelectedOrder(order); setTrackingInput(order.trackingNumber || ''); }}
                >
                  #{order.id}
                </td>
                <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 500 }}>
                  {order.user?.name || 'Unknown'}
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{order.user?.email}</div>
                </td>
                <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a' }}>Rs {order.total.toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                    style={{ padding: '0.375rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button
                    onClick={() => { setSelectedOrder(order); setTrackingInput(order.trackingNumber || ''); }}
                    style={{ padding: '0.375rem 0.75rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    disabled={deletingId === order.id}
                    style={{ padding: '0.375rem 0.75rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {deletingId === order.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-card modal-pad" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Order #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div><strong>Customer:</strong> {selectedOrder.user?.name}</div>
              <div><strong>Email:</strong> {selectedOrder.user?.email}</div>
              <div><strong>Placed:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
              <div><strong>Payment:</strong> {selectedOrder.paymentMethod}</div>
            </div>

            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1e293b' }}>Items</h4>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem', overflow: 'hidden', marginBottom: '1.25rem' }}>
              {selectedOrder.items.map((item, index) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: index === selectedOrder.items.length - 1 ? 'none' : '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.itemName}</span>
                    <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>x{item.quantity}</span>
                  </div>
                  <div style={{ fontWeight: 500 }}>Rs {(item.priceAtOrder * item.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              <div>📍 <strong>Shipping Address:</strong> {selectedOrder.shippingAddress}</div>
              <div>🚚 <strong>Method:</strong> {selectedOrder.shippingMethod}</div>
            </div>

            <div style={{ width: '220px', marginLeft: 'auto', fontSize: '0.875rem', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span>Subtotal:</span><span>Rs {selectedOrder.subtotal.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span>Tax:</span><span>Rs {selectedOrder.taxAmount.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span>Shipping:</span><span>Rs {selectedOrder.shippingCost.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.25rem', marginTop: '0.25rem' }}><span>Total:</span><span>Rs {selectedOrder.total.toLocaleString()}</span></div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#344155' }}>Tracking Number</label>
              {selectedOrder.trackingNumber ? (
                <div style={{ padding: '0.625rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                  📦 <strong>{selectedOrder.trackingNumber}</strong>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                  />
                  <button
                    onClick={() => handleSaveTracking(selectedOrder.id)}
                    disabled={saving}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {saving ? 'Saving...' : 'Save Tracking'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};