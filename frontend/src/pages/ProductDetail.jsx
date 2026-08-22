import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct, getProducts } from '../api/productService';
import { formatPrice } from '../data/catalog';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [notFound, setNotFound] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setQty(1);
    setNotFound(false);
    setProduct(null);

    getProduct(id)
      .then((p) => {
        setProduct(p);
        return getProducts({ category: p.categoryId, limit: 5 });
      })
      .then((data) => {
        setRelated((data?.products || []).filter((x) => String(x.id) !== String(id)).slice(0, 4));
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
        setNotFound(true);
      });
  }, [id]);
  useEffect(() => {
  if (!product) return;

  document.title = `${product.name} | J Electronics`;

  const canonicalUrl = `https://www.jelectronics.store/product/${product.id}`;
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = canonicalUrl;

  let metaDesc = document.querySelector("meta[name='description']");
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = product.description?.slice(0, 155) || `${product.name} — available now at J Electronics.`;
}, [product]);

  if (notFound) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Product not found.</p>
          <Link className="btn-primary" to="/products" style={{ marginTop: '16px', display: 'inline-flex' }}>Back to Shop</Link>
        </div>
      </div>
    );
  }

  if (!product) return <div className="container" style={{ padding: '80px 0' }} />;

  const rating = product.averageRating || 0;
  const entireStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const stars = '★'.repeat(entireStars) + (hasHalfStar ? '☆' : '');
  const outOfStock = (product.stock ?? 0) <= 0;
  const imgSrc = optimizeCloudinaryUrl(product.imageUrl, { width: 800, height: 800 });

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="breadcrumb">
        <Link to="/">Home</Link> / <Link to="/products">Products</Link> / <Link to={`/products?category=${product.categoryId}`}>{product.category?.name}</Link> / {product.name}
      </div>

      <div className="detail-layout" style={{ marginTop: '20px' }}>
        <div className="detail-img-col">
          <div className="detail-img">
            <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {outOfStock && (
              <span className="badge-new" style={{ position: 'absolute', top: 16, left: 16, background: '#c0392b' }}>Out of Stock</span>
            )}
          </div>

          {/* Qty + Buy Now/Add to Cart now live right under the image, so they're
              always visible near the picture instead of getting pushed below a
              long description on the right column (that's where they used to
              be — after product.description — which could push them off-screen
              on products with a lot of specs/text, like this one). */}
          <div className="qty-select-detail">
            <div className="qty-control">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={outOfStock}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={outOfStock}>+</button>
            </div>
            <button
              className="btn-primary"
              disabled={outOfStock}
              onClick={() => {
                addToCart(product.id, 'product', qty);
                navigate('/checkout');
              }}
            >
              {outOfStock ? 'Out of Stock' : 'Buy Now'}
            </button>
            <button className="btn-ghost" disabled={outOfStock} onClick={() => addToCart(product.id, 'product', qty)}>🛒 Add to Cart</button>
          </div>
        </div>

        <div>
          <div className="qv-cat">{product.category?.name}</div>
          <div className="detail-name">{product.name}</div>
          <div className="qv-rating">
            {product.reviewCount > 0 ? (
              <>{stars} <span>({rating.toFixed(1)} · {product.reviewCount.toLocaleString()} reviews)</span></>
            ) : (
              <span>No reviews yet</span>
            )}
          </div>
          <div className="detail-price">{formatPrice(product.price)}</div>
          <p style={{ color: 'var(--text-sub)', lineHeight: 1.6, fontSize: '0.95rem' }}>{product.description}</p>

          {product.stock > 0 && product.stock <= 5 && (
            <p style={{ color: '#c0392b', fontSize: '0.85rem', marginTop: '4px' }}>Only {product.stock} left in stock</p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>You May Also Like</h2></div>
          <div className="product-grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}