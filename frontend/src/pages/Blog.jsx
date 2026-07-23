import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBlogs } from '../api/blogService';

// Build a short plain-text excerpt from the article body.
const makeExcerpt = (content = '', max = 160) => {
  const text = content.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Set this to your image URL when you decide, e.g. '/blog-banner.jpg'.
const BANNER_IMAGE = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDN8fGNvbnRhY3R8ZW58MHx8MHx8fDA%3D';

export default function Blog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getBlogs()
      .then((data) => {
        if (!active) return;
        // Only surface published articles to the public.
        const published = (data.posts || []).filter((p) => p.status === 'Published');
        setPosts(published);
      })
      .catch((err) => {
        console.error(err);
        if (active) setError('Could not load blog posts right now.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="page-wrap">
      <div
        className={`page-banner align-left${BANNER_IMAGE ? '' : ' no-image'}`}
        style={BANNER_IMAGE ? { '--banner-image': `url(${BANNER_IMAGE})` } : undefined}
      >
        {BANNER_IMAGE && <div className="page-banner-media" />}
        <div className="page-banner-veil" />
        <div className="page-banner-inner">
          <div className="page-banner-content">
            <span className="page-banner-eyebrow">Blog</span>
            <h1 className="page-banner-title">The J.Electronics Blog</h1>
            <p className="page-banner-subtitle">Tutorials, build guides, and tips from makers and engineers — for makers and engineers.</p>
            <div className="page-banner-crumbs">
              <Link to="/">Home</Link>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">Blog</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '80px', paddingTop: '32px' }}>
        {loading && <p style={{ color: 'var(--text-sub)' }}>Loading articles…</p>}
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p style={{ color: 'var(--text-sub)' }}>No articles published yet. Check back soon.</p>
        )}

        <div className="blog-grid">
          {posts.map((post) => (
            <div
              className="blog-card"
              key={post.id}
              onClick={() => navigate(`/blog/${post.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="blog-img" style={{ overflow: 'hidden', padding: 0 }}>
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>📝</span>
                )}
              </div>
              <div className="blog-body">
                <div className="blog-meta">📅 {formatDate(post.createdAt)} · 👤 {post.author}</div>
                <div className="blog-title">{post.title}</div>
                <p className="blog-excerpt">{makeExcerpt(post.content)}</p>
                <button
                  className="blog-read"
                  onClick={(e) => { e.stopPropagation(); navigate(`/blog/${post.id}`); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Read More →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}