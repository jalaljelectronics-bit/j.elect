import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getAddresses, saveAddress } from '../api/addressService';
import { getShippingOptions, checkout } from '../api/orderService';
import { formatPrice } from '../data/catalog';

export default function Checkout() {
  const { cart, subtotal, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const addressOverrideFromCart = location.state?.addressOverride || null;

  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingOption, setShippingOption] = useState(location.state?.shippingOption || null);

  const [savedAddress, setSavedAddress] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', street: '', city: '', phone: '' });

  const [loadingAddress, setLoadingAddress] = useState(!addressOverrideFromCart);
  const [loadingShipping, setLoadingShipping] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch shipping options regardless of how we got here — "Buy Now"
    // skips the Cart page entirely, so there may be no pre-selected
    // option yet. Default to the first one instead of bouncing to /cart.
    getShippingOptions()
      .then((opts) => {
        setShippingOptions(opts);
        if (!location.state?.shippingOption && opts.length > 0) {
          setShippingOption(opts[0].key);
        }
      })
      .finally(() => setLoadingShipping(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cart.length === 0 && !placed) {
      navigate('/cart');
      return;
    }
    if (addressOverrideFromCart) {
      setLoadingAddress(false);
      return;
    }
    (async () => {
      try {
        const addresses = await getAddresses();
        const shippingAddr = addresses.find((a) => a.type === 'shipping');
        if (shippingAddr) {
          setSavedAddress(shippingAddr);
          setForm({
            fullName: shippingAddr.fullName,
            street: shippingAddr.street,
            city: shippingAddr.city,
            phone: shippingAddr.phone,
          });
        } else {
          setEditing(true);
        }
      } catch (err) {
        console.error('Failed to load address:', err);
      } finally {
        setLoadingAddress(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!shippingOption) {
      setError('Please select a shipping method.');
      return;
    }

    setSubmitting(true);

    try {
      let payload;

      if (addressOverrideFromCart) {
        payload = { addressOverride: addressOverrideFromCart, shippingOption, paymentMethod: 'COD' };
      } else {
        if (!form.fullName || !form.street || !form.city || !form.phone) {
          setError('Please fill in all address fields.');
          setSubmitting(false);
          return;
        }
        const { address } = await saveAddress({ type: 'shipping', ...form });
        payload = { addressId: address.id, shippingOption, paymentMethod: 'COD' };
      }

      const { order } = await checkout(payload);
      await refreshCart();
      setPlacedOrderId(order.id);
      setPlaced(true);
    } catch (err) {
      console.error('Checkout failed:', err);
      setError(err?.response?.data?.message || 'Something went wrong placing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: '10px' }}>Order Placed!</h1>
        <p style={{ color: 'var(--text-sub)', marginBottom: '24px' }}>
          Thanks for shopping with Vision Giants{user?.email ? ` — a confirmation will be sent to ${user.email}` : ''}.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => navigate(`/orders/${placedOrderId}`)}>View Order</button>
          <button className="btn-secondary" onClick={() => navigate('/products')}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  if (loadingAddress || loadingShipping) return <div className="container" style={{ padding: '80px 0' }} />;

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="page-header" style={{ textAlign: 'left', padding: '40px 0 24px' }}>
        <h1 style={{ textAlign: 'left' }}>Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="cart-layout">
        <div className="form-card">
          <h3 style={{ marginBottom: '18px' }}>Shipping Address</h3>

          {addressOverrideFromCart ? (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
              <strong>Custom address (from cart)</strong>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                {addressOverrideFromCart}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '8px' }}>
                Go back to Cart to change this address.
              </p>
            </div>
          ) : savedAddress && !editing ? (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
              <strong>{savedAddress.fullName}</strong>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                {savedAddress.street}, {savedAddress.city} — {savedAddress.phone}
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '10px', color: '#fff' }}
                onClick={() => setEditing(true)}
              >
  Use a different address
</button>
            </div>
          ) : (
            <div className="form-grid">
              <div className="field">
                <label>Full Name</label>
                <input required placeholder="Ali Raza" value={form.fullName} onChange={updateField('fullName')} />
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input required placeholder="03xx-xxxxxxx" value={form.phone} onChange={updateField('phone')} />
              </div>
              <div className="field">
                <label>Street Address</label>
                <input required placeholder="House #, Street, Area" value={form.street} onChange={updateField('street')} />
              </div>
              <div className="field">
                <label>City</label>
                <input required placeholder="Multan" value={form.city} onChange={updateField('city')} />
              </div>
              {savedAddress && (
                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              )}
            </div>
          )}

          <h3 style={{ margin: '24px 0 10px' }}>Shipping Method</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shippingOptions.map((opt) => (
              <label key={opt.key} style={{ display: 'block', fontSize: '0.85rem', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 12px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="shippingOption"
                  checked={shippingOption === opt.key}
                  onChange={() => setShippingOption(opt.key)}
                  style={{ marginRight: '8px' }}
                />
                {opt.label}{opt.taxable ? ' (COD 4% tax applies)' : ''}: <strong>{formatPrice(opt.cost)}</strong>
              </label>
            ))}
          </div>

          <h3 style={{ margin: '24px 0 10px' }}>Payment Method</h3>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '14px 16px' }}>
            <strong>Cash on Delivery</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-mid)' }}>Pay when your order arrives</div>
          </div>

          {error && <p style={{ color: '#c0392b', marginTop: '14px', fontSize: '0.85rem' }}>{error}</p>}
        </div>

        <div className="summary-box">
          <h3>Order Summary</h3>
          {cart.map((item) => {
            const isProject = item.itemType === 'PROJECT';
            const entity = isProject ? item.project : item.product;
            const name = isProject ? entity.title : entity.name;
            return (
              <div className="summary-row" key={item.id}>
                <span>{name} × {item.quantity}</span>
                <span>{formatPrice(entity.price * item.quantity)}</span>
              </div>
            );
          })}
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
            Final shipping cost and tax are confirmed on the next screen after you place your order.
          </p>
          <button
            className="btn-primary"
            type="submit"
            disabled={submitting} 
            style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}