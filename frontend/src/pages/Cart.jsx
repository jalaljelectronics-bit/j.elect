import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getShippingOptions, checkout } from '../api/orderService';
import { formatPrice } from '../data/catalog';

// Set this to your real business WhatsApp number, digits only, country code first (no +, no spaces)
const WHATSAPP_NUMBER = '923176572690';

export default function Cart() {
  const { cart, subtotal, loading, increaseCartQty, decreaseCartQty, removeFromCart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [showAddressBox, setShowAddressBox] = useState(false);
  const [addressOverride, setAddressOverride] = useState('');
  const [placingWhatsApp, setPlacingWhatsApp] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getShippingOptions().then((opts) => {
      setShippingOptions(opts);
      if (opts.length > 0) setSelectedShipping(opts[0].key);
    });
  }, []);

  const chosen = shippingOptions.find((o) => o.key === selectedShipping);
  const shippingCost = chosen?.cost ?? 0;
  const taxAmount = chosen?.taxable ? Math.round((subtotal + shippingCost) * 0.04) : 0;
  const total = subtotal + shippingCost + taxAmount;

  const handleCheckout = () => {
    navigate('/checkout', {
      state: {
        shippingOption: selectedShipping,
        addressOverride: addressOverride.trim() || null,
      },
    });
  };

  const handleWhatsAppOrder = async () => {
    setError(null);
    setPlacingWhatsApp(true);
    try {
      const { order } = await checkout({
        shippingOption: selectedShipping,
        addressOverride: addressOverride.trim() || undefined,
        paymentMethod: 'WhatsApp',
      });
      await refreshCart();

      const lines = order.items
        .map((i) => `- ${i.itemName} x${i.quantity} (${formatPrice(i.priceAtOrder * i.quantity)})`)
        .join('\n');
      const message =
        `New order #${order.id}\n\n${lines}\n\n` +
        `Shipping: ${order.shippingMethod} (${formatPrice(order.shippingCost)})\n` +
        `Tax: ${formatPrice(order.taxAmount)}\n` +
        `Total: ${formatPrice(order.total)}\n\n` +
        `Delivery address: ${order.shippingAddress}`;

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setPlacingWhatsApp(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '80px 0' }} />;

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="page-header" style={{ textAlign: 'left', padding: '40px 0 24px' }}>
        <h1 style={{ textAlign: 'left' }}>Your Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>🛒 Your cart is empty.</p>
          <Link className="btn-primary" to="/products" style={{ display: 'inline-flex' }}>Start Shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {cart.map((item) => {
              const isProject = item.itemType === 'PROJECT';
              const entity = isProject ? item.project : item.product;
              const name = isProject ? entity.title : entity.name;
              const maxedOut = !isProject && item.quantity >= entity.stock;

              return (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-img">
                    <img src={entity.imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div className="cart-item-name">
                      {name}
                      {isProject && <span style={{ marginLeft: '8px', fontSize: '0.7rem', opacity: 0.7 }}>PROJECT</span>}
                    </div>
                    <div className="cart-item-price">{formatPrice(entity.price)}</div>
                  </div>

                  {isProject ? (
                    <div className="qty-control" style={{ opacity: 0.6 }}><span>Qty 1</span></div>
                  ) : (
                    <div className="qty-control">
                      <button onClick={() => decreaseCartQty(item.id, item.quantity)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => increaseCartQty(item.id, item.quantity)} disabled={maxedOut}>+</button>
                    </div>
                  )}

                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              );
            })}

            <div style={{ marginTop: '20px' }}>
              {!showAddressBox ? (
                <button className="btn-secondary" style={{ color: '#fff' }} onClick={() => setShowAddressBox(true)}>
                  📍 Change delivery address
                </button>
              ) : (
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    Delivery address for this order
                  </label>
                  <textarea
                    rows={3}
                    placeholder="House #, Street, Area, City, Phone"
                    value={addressOverride}
                    onChange={(e) => setAddressOverride(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px' }}>
                    Leave blank to use your saved address.
                  </p>
                  <button
                    className="btn-secondary"
                    style={{ marginTop: '8px' }}
                    onClick={() => { setShowAddressBox(false); setAddressOverride(''); }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="summary-box">
            <h3>Cart Totals</h3>
            <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>

            <div style={{ margin: '14px 0' }}>
              <strong style={{ fontSize: '0.85rem' }}>Shipment</strong>
              {shippingOptions.map((opt) => (
                <label key={opt.key} style={{ display: 'block', fontSize: '0.85rem', margin: '8px 0', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="shippingOption"
                    checked={selectedShipping === opt.key}
                    onChange={() => setSelectedShipping(opt.key)}
                    style={{ marginRight: '8px' }}
                  />
                  {opt.label}{opt.taxable ? ' (COD 4% tax applies)' : ''}: <strong>{formatPrice(opt.cost)}</strong>
                </label>
              ))}
            </div>

            {taxAmount > 0 && (
              <div className="summary-row"><span>4% Tax (Govt.-mandated)</span><span>{formatPrice(taxAmount)}</span></div>
            )}
            <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>

            {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', marginTop: '10px' }}>{error}</p>}

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              onClick={handleCheckout}
              disabled={!selectedShipping}
            >
              Proceed to Checkout
            </button>
            <button
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px', color: '#fff' }}
              onClick={handleWhatsAppOrder}
              disabled={!selectedShipping || placingWhatsApp}
            >
  {placingWhatsApp ? 'Placing order...' : '💬 Order via WhatsApp'}
</button>
          </div>
        </div>
      )}
    </div>
  );
}
