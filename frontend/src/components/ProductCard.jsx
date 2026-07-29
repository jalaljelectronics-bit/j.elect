import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../data/catalog';
import { useCart } from '../context/CartContext';

const WHATSAPP_NUMBER = '923000000000';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi! I want to buy: ${product.name} (${formatPrice(product.price)})`
  )}`;

  const goToProduct = () => navigate(`/product/${product.id}`);

  const imgSrc =
    product.imageUrl ||
    (typeof product.image === 'string' &&
    product.image.startsWith('http')
      ? product.image
      : null);

  return (
    <div
      className="product-card"
      onClick={goToProduct}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      {product.badge && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: product.badge.includes('%')
              ? '#EF4444'
              : 'var(--cyan)',
            color: product.badge.includes('%') ? '#fff' : '#000',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px',
            zIndex: 1,
          }}
        >
          {product.badge}
        </div>
      )}

      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          background: 'var(--bg3)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: '3.4rem' }}>
            {product.emoji || product.image || '📦'}
          </span>
        )}
      </div>

      <div style={{ padding: '12px 4px 4px' }}>
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '4px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.4em',
            lineHeight: 1.2,
          }}
        >
          {product.name}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '0.95rem',
              color: 'var(--cyan)',
              fontWeight: 700,
            }}
          >
            {product.originalPrice && (
              <span
                style={{
                  color: 'var(--gray-mid)',
                  textDecoration: 'line-through',
                  fontWeight: 400,
                  fontSize: '0.78rem',
                  marginRight: '6px',
                }}
              >
                {formatPrice(product.originalPrice)}
              </span>
            )}

            {formatPrice(product.price)}
          </span>

          {product.category?.name && (
            <span
              style={{
                color: 'var(--gray-mid)',
                fontSize: '0.75rem',
              }}
            >
              {product.category.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-primary"
            style={{
              flex: 1,
              padding: '9px',
              fontSize: '0.8rem',
            }}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product.id, 'product', 1);
              navigate('/checkout');
            }}
          >
            Buy Now
          </button>

          <button
            className="btn-ghost"
            style={{
              flex: 1,
              padding: '9px',
              fontSize: '0.8rem',
            }}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product.id, 'product', 1);
            }}
          >
            🛒 Add to Cart
          </button>
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="btn-ghost"
          style={{
            display: 'flex',
            marginTop: '8px',
            padding: '9px',
            fontSize: '0.8rem',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            textDecoration: 'none',
          }}
        >
          <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
  <path d="M16.04 2.67C8.63 2.67 2.63 8.67 2.63 16.08c0 2.5.68 4.83 1.85 6.85L2 30l7.24-2.42a13.36 13.36 0 0 0 6.8 1.85h.01c7.4 0 13.4-6 13.4-13.41 0-3.58-1.4-6.94-3.93-9.47a13.31 13.31 0 0 0-9.48-3.93zm0 24.55h-.01a11.13 11.13 0 0 1-5.68-1.56l-.41-.24-4.24 1.42 1.42-4.13-.27-.42a11.1 11.1 0 0 1-1.7-5.9c0-6.14 5-11.13 11.15-11.13 2.98 0 5.78 1.16 7.88 3.27a11.05 11.05 0 0 1 3.26 7.87c0 6.14-5 11.13-11.14 11.13z"/>
  <path d="M22.4 19.14c-.34-.17-2.02-1-2.33-1.1-.31-.12-.54-.17-.77.17-.23.34-.88 1.1-1.08 1.32-.2.23-.4.26-.74.09-.34-.17-1.44-.53-2.74-1.69-1.01-.9-1.7-2.02-1.9-2.36-.2-.34-.02-.53.15-.7.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.77-1.86-1.06-2.55-.28-.66-.56-.57-.77-.58l-.66-.01c-.23 0-.6.09-.91.43-.31.34-1.19 1.16-1.19 2.84 0 1.68 1.22 3.3 1.39 3.53.17.23 2.39 3.65 5.8 5.12.81.35 1.44.56 1.94.72.81.26 1.55.22 2.13.13.65-.1 2.02-.83 2.3-1.63.29-.8.29-1.48.2-1.63-.09-.15-.31-.23-.65-.4z"/>
</svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}