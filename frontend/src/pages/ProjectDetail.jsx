import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProjectById, getProjects } from '../api/projectService';
import { useCart } from '../context/CartContext';
import ProjectCard from '../components/ProjectCard';
import { resolveProductLink, isExternalLink, usableLinks } from '../utils/productLink';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [notFound, setNotFound] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setQty(1);
    setNotFound(false);
    setProject(null);

    getProjectById(id)
      .then((res) => {
        const found = res.project;
        if (!found) {
          setNotFound(true);
          return;
        }
        setProject(found);

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
      });
  }, [id]);

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

  const imgSrc = typeof project.imageUrl === 'string' && project.imageUrl.startsWith('http') ? project.imageUrl : null;
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
            <span>{project.price ? `Rs ${project.price}` : 'Project'}</span>
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
                View on GitHub →
              </a>
            </div>
          )}

          <div className="qty-select-detail">
            <button
              className="btn-primary"
              onClick={() => {
                addToCart(project.id, 'project', 1);
                navigate('/checkout');
              }}
            >
              Buy Now
            </button>
            <button className="btn-ghost" onClick={() => addToCart(project.id, 'project', 1)}>🛒 Add to Cart</button>
          </div>

          <Link to="/contact" className="btn-ghost" style={{ display: 'inline-flex', marginTop: '14px' }}>
            Request Source Code →
          </Link>
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
                  <img src={section.imageUrl} alt={section.title} style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                )}
                <p style={{ color: 'var(--text-sub)', lineHeight: 1.6 }}>{section.description}</p>
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
