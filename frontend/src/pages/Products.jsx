import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProjects } from '../api/projectService';
import ProjectCard from '../components/ProjectCard';

const CATEGORIES = ['Commercial', 'University'];

export default function Projects() {
  const [params, setParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeCategory = params.get('category') || '';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getProjects({
      category: activeCategory || undefined,
      page,
      limit: 12,
    })
      .then((data) => {
        setProjects(data.projects || []);
        setTotalPages(data.totalPages || 1);
        setTotalProjects(data.totalProjects || 0);
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
        setError('Could not load projects. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [activeCategory, page]);

  const updateParams = (overrides) => {
    const next = {
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(page > 1 ? { page: String(page) } : {}),
      ...overrides,
    };
    if (!('page' in overrides)) delete next.page;
    Object.keys(next).forEach((k) => (next[k] === '' || next[k] == null) && delete next[k]);
    setParams(next);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Project Kits</h1>
        <p>Browse commercial builds and university lab projects.</p>
      </div>

      <div className="shop-layout" style={{ paddingBottom: '80px' }}>
        <aside className="sidebar">
          <h4>Categories</h4>
          <div
            className={`sidebar-cat${!activeCategory ? ' active' : ''}`}
            onClick={() => updateParams({})}
          >
            <span>All Projects</span>
          </div>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`sidebar-cat${activeCategory === cat ? ' active' : ''}`}
              onClick={() => updateParams({ category: cat })}
            >
              <span>{cat}</span>
            </div>
          ))}
        </aside>

        <div>
          <div className="toolbar">
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-mid)' }}>
              {loading ? 'Loading…' : `${totalProjects} project${totalProjects !== 1 ? 's' : ''} found`}
            </span>
          </div>

          {error && <div className="empty-state">{error}</div>}

          {!error && !loading && projects.length === 0 ? (
            <div className="empty-state">No projects match your filters.</div>
          ) : (
            <div className="product-grid">
              {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px' }}>
              <button
                className="btn-ghost"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                Previous
              </button>
              <span style={{ alignSelf: 'center', fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
              <button
                className="btn-ghost"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
