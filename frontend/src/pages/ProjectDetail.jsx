import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProjectById, getProjects, createProjectQuery } from '../api/projectService';
import ProjectCard from '../components/ProjectCard';
import MarkdownContent from '../components/MarkdownContent';
import { resolveProductLink, isExternalLink, usableLinks } from '../utils/productLink';
import { CONTACT_PHONE_DISPLAY, CONTACT_WHATSAPP } from '../config/contact';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';

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

// Tell the prerenderer the page is done — fired once per mount, whether
// the fetch succeeds or the project isn't found, so a bad ID never hangs
// the prerender build. Shares a flag with the fallback timer in
// main.jsx so the event only ever fires once.
const signalPrerenderReady = () => {
  if (typeof document !== 'undefined' && !window.__prerenderReadyFired) {
    window.__prerenderReadyFired = true;
    document.dispatchEvent(new Event('prerender-ready'));
  }
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [related, setRelated] = useState([]);
  const [notFound, setNotFound] = useState(false);

  const [queryForm, setQueryForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', message: '' });
  const [querySubmitting, setQuerySubmitting] = useState(false);
  const [querySent, setQuerySent] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setProject(null);
    setQuerySent(false);
    setQueryForm({ clientName: '', clientEmail: '', clientPhone: '', message: '' });

    getProjectById(id)
      .then((res) => {
        const found = res.project;
        if (!found) {
          setNotFound(true);
          setSeoTags({ title: 'Project Not Found – J Electronics', noindex: true });
          signalPrerenderReady();
          return;
        }
        setProject(found);

        const imgSrc = typeof found.imageUrl === 'string' && found.imageUrl.startsWith('http')
          ? optimizeCloudinaryUrl(found.imageUrl, { width: 800, height: 800 })
          : null;
        setSeoTags({
          title: `${found.title} – J Electronics`,
          description: found.introDescription || `${found.title} — a project from J Electronics.`,
          canonical: `https://www.jelectronics.store/project/${found.id}`,
          ogImage: imgSrc,
        });
        signalPrerenderReady();

        return getProjects({ category: found.category }).then((relRes) => {
          const sameCategory = (relRes.projects || []).filter(
            (p) => String(p.id) !== String(id)
          );
          setRelated(sameCategory.slice(0, 4));
        });
      })
      .catch((err) => {
        console.error('Failed to load project:', err);
        setNotFound(true);
        setSeoTags({ title: 'Project Not Found – J Electronics', noindex: true });
        signalPrerenderReady();
      });
  }, [id]);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();

    if (!queryForm.clientName.trim() || !queryForm.clientEmail.trim() || !queryForm.message.trim()) {
      alert('Please fill in your name, email, and message.');
      return;
    }

    setQuerySubmitting(true);
    try {
      await createProjectQuery(project.id, queryForm);
      setQuerySent(true);
      setQueryForm({ clientName: '', clientEmail: '', clientPhone: '', message: '' });
    } catch (err) {
      console.error(err);
      alert('Could not send your message. Please try again or contact us directly.');
    } finally {
      setQuerySubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Project not found.</p>
          <Link className="btn-primary" to="/projects" style={{ marginTop: '16px', display: 'inline-flex' }}>Back to Projects</Link>
        </div>
      </div>
    );
  }

  if (!project) return <div className="container" style={{ padding: '80px 0' }} />;

  const imgSrc = typeof project.imageUrl === 'string' && project.imageUrl.startsWith('http')
    ? optimizeCloudinaryUrl(project.imageUrl, { width: 800, height: 800 })
    : null;
  const productLinks = usableLinks(project.linkedProducts);
  const badgeLabel = project.isNewArrival ? '🆕 New' : project.isFeatured ? '⭐ Featured' : null;

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="breadcrumb">
        <Link to="/">Home</Link> / <Link to="/projects">Projects</Link>
        {project.category && (
          <> / <Link to={`/projects?category=${project.category}`}>{project.category}</Link></>
        )} / {project.title}
      </div>

      <div className="detail-layout" style={{ marginTop: '20px' }}>
        <div className="detail-img">
          {imgSrc ? (
            <img src={imgSrc} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '6rem', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🛠️
            </span>
          )}
          {badgeLabel && (
            <span className="badge-new" style={{ position: 'absolute', top: 16, left: 16 }}>
              {badgeLabel}
            </span>
          )}
        </div>

        <div>
          {project.category && <div className="qv-cat">{project.category}</div>}
          <div className="detail-name">{project.title}</div>

          <div className="detail-price" style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span>{project.price ? `Rs ${project.price}` : 'Contact for pricing'}</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '0.95rem', color: 'var(--gray-mid)' }}>
              · {project.status}
            </span>
          </div>

          <p style={{ color: 'var(--text-sub)', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {project.introDescription || 'No description available.'}
          </p>

          {project.githubUrl && (
            <div style={{ margin: '8px 0' }}>
              <a href={project.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)', fontSize: '0.9rem' }}>
                View Code on GitHub →
              </a>
            </div>
          )}

          <a href="#project-query-form" className="btn-primary" style={{ display: 'inline-flex', marginTop: '10px' }}>
            Contact Us About This Project
          </a>
        </div>
      </div>

      {Array.isArray(project.sections) && project.sections.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Working Process</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {project.sections.map((section, i) => (
              <div key={section.id || i} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ margin: '0 0 8px' }}>{section.title || `Section ${i + 1}`}</h3>
                {section.imageUrl && (
                  <img
                    src={optimizeCloudinaryUrl(section.imageUrl, { width: 700, height: 260 })}
                    alt={section.title}
                    style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                  />
                )}
                <MarkdownContent content={section.description} linkedProducts={project.linkedProducts} />
              </div>
            ))}
          </div>
        </section>
      )}

      {productLinks.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Products Used In This Project</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {productLinks.map((link) => {
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
        </section>
      )}

      <section className="section" id="project-query-form">
        <div className="section-head"><h2>Questions, Custom Pricing, or Requests</h2></div>
        <p style={{ color: 'var(--text-sub)', marginBottom: '16px', maxWidth: '520px' }}>
          Want this project customized, a quote for your budget, help understanding a feature,
          or anything else related to it? Send us a message.
        </p>

        {querySent ? (
          <div className="empty-state">Thanks! We've received your message and will get back to you soon.</div>
        ) : (
          <form onSubmit={handleQuerySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px' }}>
            <input
              type="text"
              placeholder="Your Name"
              value={queryForm.clientName}
              onChange={(e) => setQueryForm({ ...queryForm, clientName: e.target.value })}
              style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
            />
            <input
              type="email"
              placeholder="Your Email"
              value={queryForm.clientEmail}
              onChange={(e) => setQueryForm({ ...queryForm, clientEmail: e.target.value })}
              style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
            />
            <input
              type="text"
              placeholder="Phone (optional)"
              value={queryForm.clientPhone}
              onChange={(e) => setQueryForm({ ...queryForm, clientPhone: e.target.value })}
              style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
            />
            <textarea
              rows={4}
              placeholder="What would you like to ask or request about this project?"
              value={queryForm.message}
              onChange={(e) => setQueryForm({ ...queryForm, message: e.target.value })}
              style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <button type="submit" className="btn-primary" disabled={querySubmitting} style={{ alignSelf: 'flex-start' }}>
              {querySubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '14px', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
          Prefer to talk? Call or WhatsApp us at{' '}
          <a href={CONTACT_WHATSAPP} target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)', fontWeight: 600 }}>
            {CONTACT_PHONE_DISPLAY}
          </a>
        </p>
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Similar Projects</h2></div>
          <div className="project-grid-3col">
            {related.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}