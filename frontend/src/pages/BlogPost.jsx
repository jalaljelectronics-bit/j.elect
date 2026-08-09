import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBlog } from '../api/blogService';
import { resolveProductLink, isExternalLink, usableLinks } from '../utils/productLink';
import MarkdownContent from '../components/MarkdownContent';

// Directly write SEO tags to document.head — bypasses react-helmet-async
// entirely. Helmet batches its actual DOM writes internally (it appeared
// to rely on requestAnimationFrame-based scheduling), which wasn't
// reliably flushing inside Puppeteer during prerendering: page body
// content rendered correctly, but <title>/<meta>/<link> updates never
// landed in the captured HTML. Plain DOM writes in a useEffect have no
// such batching — they run as soon as the effect fires, guaranteed.
function setSeoTags({ title, description, canonical, ogImage, noindex }) {
  if (typeof document === 'undefined') return;

  document.title = title;

  const setMeta = (name, content) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setPropertyMeta = (property, content) => {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  if (description) setMeta('description', description);
  if (noindex) setMeta('robots', 'noindex');

  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);
  }

  if (description || canonical) {
    setPropertyMeta('og:type', 'article');
    setPropertyMeta('og:title', title);
    if (description) setPropertyMeta('og:description', description);
    if (canonical) setPropertyMeta('og:url', canonical);
    if (ogImage) setPropertyMeta('og:image', ogImage);
  }
}

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Short plain-text excerpt for <meta name="description">.
const makeExcerpt = (content = '', max = 160) => {
  const text = content.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};

// Tell the prerenderer the page is done — fired once per mount, whether
// the fetch succeeds or the post isn't found, so a bad ID never hangs
// the prerender build. Shares a flag with the fallback timer in
// main.jsx so the event only ever fires once.
const signalPrerenderReady = () => {
  if (typeof document !== 'undefined' && !window.__prerenderReadyFired) {
    window.__prerenderReadyFired = true;
    document.dispatchEvent(new Event('prerender-ready'));
  }
};

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getBlog(id)
      .then((data) => {
        if (!active) return;
        setPost(data);
        setSeoTags({
          title: `${data.title} – J Electronics`,
          description: makeExcerpt(data.content),
          canonical: `https://www.jelectronics.store/blog/${data.id}`,
          ogImage: data.imageUrl,
        });
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setNotFound(true);
          setSeoTags({ title: 'Post Not Found – J Electronics', noindex: true });
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          signalPrerenderReady();
        }
      });
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

  const links = usableLinks(post.linkedProducts);

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

      <div className="form-card" style={{ fontSize: '1rem' }}>
        <MarkdownContent content={post.content} linkedProducts={post.linkedProducts} />
      </div>

      {links.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: '12px' }}>Featured Products</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {links.map((link) => {
              const href = resolveProductLink(link);
              const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', textDecoration: 'none', color: 'inherit' };
              return isExternalLink(href) ? (
                <a key={link.id} href={href} target="_blank" rel="noreferrer" style={rowStyle}>
                  <span style={{ fontWeight: 600 }}>🔗 {link.label}</span>
                  <span style={{ color: 'var(--cyan)', fontSize: '0.85rem' }}>View product →</span>
                </a>
              ) : (
                <Link key={link.id} to={href} style={rowStyle}>
                  <span style={{ fontWeight: 600 }}>🔗 {link.label}</span>
                  <span style={{ color: 'var(--cyan)', fontSize: '0.85rem' }}>View product →</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Link className="btn-primary" to="/blog" style={{ display: 'inline-flex' }}>← Back to Blog</Link>
      </div>
    </div>
  );
}