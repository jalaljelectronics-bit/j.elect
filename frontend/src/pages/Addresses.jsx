import { useEffect, useState } from 'react';
import { getAddresses, saveAddress } from '../api/addressService';

const EMPTY = { fullName: '', street: '', city: '', phone: '' };

export default function Addresses() {
  const [addresses, setAddresses] = useState({ shipping: null, billing: null });
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState(null); // 'shipping' | 'billing' | null
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAddresses()
      .then((list) => {
        const byType = { shipping: null, billing: null };
        list.forEach((a) => { byType[a.type] = a; });
        setAddresses(byType);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startEdit = (type) => {
    setEditingType(type);
    setForm(addresses[type] || EMPTY);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAddress({ type: editingType, ...form });
      setEditingType(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save address.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading addresses...</p>;

  const renderColumn = (type, label) => {
    const addr = addresses[type];
    const isEditing = editingType === type;

    return (
      <div>
        <h3 style={{ marginBottom: '12px' }}>{label}</h3>

        {isEditing ? (
          <form onSubmit={handleSave} className="address-form">
            <input placeholder="Full name" required value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            <input placeholder="Street address" required value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
            <input placeholder="City" required value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            <input placeholder="Phone" required value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <div className="address-form-actions">
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save address'}
              </button>
              <button type="button" className="btn-cancel" onClick={() => setEditingType(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : addr ? (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
            <div>{addr.fullName}</div>
            <div>{addr.street}</div>
            <div>{addr.city}</div>
            <div>{addr.phone}</div>
            <span onClick={() => startEdit(type)} className="account-link"
              style={{ cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>
              Edit address
            </span>
          </div>
        ) : (
          <div>
            <span onClick={() => startEdit(type)} className="account-link"
              style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              Add {label.toLowerCase()}
            </span>
            <p style={{ fontStyle: 'italic', color: 'var(--text-sub)', fontSize: '0.85rem', marginTop: '4px' }}>
              You have not set up this type of address yet.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <p style={{ color: 'var(--text-sub)', marginBottom: '24px' }}>
        The following addresses will be used on the checkout page by default.
      </p>
      <div className="address-grid">
        {renderColumn('billing', 'Billing address')}
        {renderColumn('shipping', 'Shipping address')}
      </div>
    </div>
  );
}