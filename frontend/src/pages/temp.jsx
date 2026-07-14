import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBlog } from '../api/blogService';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Split the stored content string into paragraphs for readable rendering.
const toParagraphs = (content = '') =>
  content.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getBlog(id)
      .then((data) => { if (active) setPost(data); })
      .catch((err) => {
        console.error(err);
        if (active) setNotFound(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <p style={{ color: 'var(--text-sub)' }}>Loading article…</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Post not found.</p>
          <Link className="btn-primary" to="/blog" style={{ marginTop: '16px', display: 'inline-flex' }}>Back to Blog</Link>
        </div>
      </div>
    );
  }

  const paragraphs = toParagraphs(post.content);
  const links = Array.isArray(post.linkedProducts) ? post.linkedProducts : [];

  return (
    <div className="container" style={{ paddingBottom: '80px', maxWidth: '820px' }}>
      <div className="breadcrumb" style={{ marginTop: '20px' }}>
        <Link to="/">Home</Link> / <Link to="/blog">Blog</Link> / {post.title}
      </div>

      {post.imageUrl && (
        <div style={{ margin: '24px 0', borderRadius: '14px', overflow: 'hidden' }}>
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        {!post.imageUrl && <div style={{ fontSize: '4rem', marginBottom: '10px' }}>📝</div>}
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', marginBottom: '10px' }}>{post.title}</h1>
        <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>📅 {formatDate(post.createdAt)} · 👤 {post.author}</div>
      </div>

      <div className="form-card" style={{ lineHeight: 1.75, fontSize: '1rem', color: 'var(--text-sub)' }}>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ marginBottom: i === paragraphs.length - 1 ? 0 : '18px' }}>{para}</p>
        ))}
      </div>

      {links.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: '12px' }}>Featured Products</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {links.map((link) => (
              <Link
                key={link.id}
                to={link.url}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', textDecoration: 'none', color: 'inherit' }}
              >
                <span style={{ fontWeight: 600 }}>🔗 {link.label}</span>
                <span style={{ color: 'var(--cyan)', fontSize: '0.85rem' }}>View product →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Link className="btn-primary" to="/blog" style={{ display: 'inline-flex' }}>← Back to Blog</Link>
      </div>
    </div>
  );
}
