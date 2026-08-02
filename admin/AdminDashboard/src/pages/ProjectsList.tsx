// src/pages/ProjectsList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProjects,
  deleteProject as deleteProjectApi,
  getProjectQueries,
  updateQueryStatus,
  ProjectQuery
} from '../api/projectService';
import MarkdownContent from  '../components/MarkdownContent';

interface ContentSection {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
}

export interface Project {
  id: number;
  title: string;
  category: 'Commercial' | 'University';
  status: string;
  price: number;
  imageUrl?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  githubUrl?: string;
  introDescription?: string;
  introImageUrl?: string;
  sections: ContentSection[];
  createdAt: string;
}

export const ProjectsList: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Commercial' | 'University'>('All');
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const [queryingProject, setQueryingProject] = useState<Project | null>(null);
  const [queries, setQueries] = useState<ProjectQuery[]>([]);
  const [queriesLoading, setQueriesLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [activeFilter]);

const fetchProjects = async () => {
  setLoading(true);
  try {
    const filters: any = { limit: 100 };
    if (activeFilter !== 'All') filters.category = activeFilter;

    const res = await getProjects(filters);
    setProjects(res.projects || []);
  } catch (error) {
    console.error('Error fetching projects:', error);
  } finally {
    setLoading(false);
  }
};
  const handleDeleteProject = async (id: number) => {
    if (window.confirm(`Permanently remove this project?`)) {
      try {
        await deleteProjectApi(id);
        alert('Project deleted!');
        fetchProjects();
      } catch (error) {
        alert('Error deleting project');
        console.error(error);
      }
    }
  };

  const openQueries = async (project: Project) => {
    setQueryingProject(project);
    setQueriesLoading(true);
    try {
      const res = await getProjectQueries(project.id);
      setQueries(res.queries || []);
    } catch (error) {
      console.error('Error fetching queries:', error);
      setQueries([]);
    } finally {
      setQueriesLoading(false);
    }
  };

  const closeQueries = () => {
    setQueryingProject(null);
    setQueries([]);
  };

  const handleStatusChange = async (queryId: number, status: ProjectQuery['status']) => {
    const previous = queries;
    setQueries(prev => prev.map(q => (q.id === queryId ? { ...q, status } : q)));
    try {
      await updateQueryStatus(queryId, status);
    } catch (error) {
      alert('Error updating status');
      console.error(error);
      setQueries(previous);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading projects...</div>;

  return (
    <div>
      {/* Header Area */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Project Portfolio</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Track client deliverables, audit capstone developments, and log production timelines.</p>
        </div>
        <button
          onClick={() => navigate('/admin/projects/new')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: '600', cursor: 'pointer' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Project
        </button>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {(['All', 'Commercial', 'University'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            style={{
              padding: '0.5rem 1.25rem', border: 'none', background: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
              color: activeFilter === tab ? '#3b82f6' : '#64748b',
              borderBottom: activeFilter === tab ? '3px solid #3b82f6' : '3px solid transparent',
              marginBottom: '-11px', transition: 'all 0.2s'
            }}
          >
            {tab === 'All' ? 'All Frameworks' : tab === 'Commercial' ? 'Commercial Core' : 'University Lab'}
          </button>
        ))}
      </div>

      {/* Count Badge */}
      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#475569', fontWeight: '600', backgroundColor: '#e2e8f0', padding: '0.4rem 0.75rem', borderRadius: '0.25rem', display: 'inline-block' }}>
        {projects.length} {projects.length === 1 ? 'project entry listed' : 'project entries listed'}
      </div>

      {/* Content Table */}
      <div className="table-wrap" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '110px' }}>Image</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Project Title</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '150px' }}>Category</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '150px' }}>Status</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '150px' }}>Price</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', textAlign: 'right', width: '250px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => setViewingProject(p)}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="preview" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }} />
                  ) : (
                    <div style={{ width: '60px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>No Img</div>
                  )}
                </td>

                <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }} onClick={() => setViewingProject(p)}>
                  {p.title}
                </td>

                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: p.category === 'Commercial' ? '#e0f2fe' : '#f3e8ff', color: p.category === 'Commercial' ? '#0369a1' : '#6b21a8' }}>
                    {p.category}
                  </span>
                </td>

                <td style={{ padding: '1rem', color: '#475569' }}>
                  {p.status || '—'}
                </td>

                <td style={{ padding: '1rem', color: '#0f172a' }}>
                  {p.price ? `Rs ${p.price}` : '—'}
                </td>

                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={() => openQueries(p)} style={{ padding: '0.375rem 0.75rem', backgroundColor: '#fef9c3', color: '#a16207', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                      Queries
                    </button>
                    <button onClick={() => setViewingProject(p)} style={{ padding: '0.375rem 0.75rem', backgroundColor: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                      View
                    </button>
                    <button onClick={() => navigate(`/admin/projects/edit/${p.id}`)} style={{ padding: '0.375rem 0.75rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteProject(p.id)} title="Delete Project" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No projects logged within this classification layer.</div>
        )}
      </div>

      {/* ============ DETAIL VIEW MODAL ============ */}
      {viewingProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-card" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', width: '100%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            {viewingProject.imageUrl && (
              <div style={{ position: 'relative' }}>
                <img src={viewingProject.imageUrl} alt={viewingProject.title} style={{ width: '100%', height: '220px', objectFit: 'cover', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem', display: 'block' }} />
                <button onClick={() => setViewingProject(null)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', border: 'none', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: '1.25rem', width: '32px', height: '32px', borderRadius: '9999px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
              </div>
            )}

            <div className="modal-pad" style={{ padding: '2rem' }}>
              <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.5rem', color: '#0f172a' }}>{viewingProject.title}</h2>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#e0f2fe', color: '#0369a1' }}>{viewingProject.category}</span>
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#fef9c3', color: '#a16207' }}>{viewingProject.status}</span>
                {viewingProject.price ? <span style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#64748b' }}>Rs {viewingProject.price}</span> : null}
                {viewingProject.isFeatured && <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#dcfce7', color: '#166534' }}>Featured</span>}
                {viewingProject.isNewArrival && <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b' }}>New Arrival</span>}
              </div>

              {viewingProject.githubUrl && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <a href={viewingProject.githubUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.875rem' }}>
                    {viewingProject.githubUrl}
                  </a>
                </div>
              )}

              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: '0 0 0.75rem 0' }}>Intro Description</h3>
                <p style={{ color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{viewingProject.introDescription || 'No description added yet.'}</p>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: '0 0 0.75rem 0' }}>Sections</h3>
                {Array.isArray(viewingProject.sections) && viewingProject.sections.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {viewingProject.sections.map((section, i) => (
                      <div key={section.id || i} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: '600' }}>
                          {section.title || `Section ${i + 1}`}
                        </h4>
                        {section.imageUrl && (
                          <img src={section.imageUrl} alt={section.title} style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '0.375rem', marginBottom: '0.5rem' }} />
                        )}
                        <MarkdownContent content={section.description} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No sections added yet. Use Edit to add them.</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setViewingProject(null)} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '0.375rem', color: '#1e293b', fontWeight: '600', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ QUERIES MODAL ============ */}
      {queryingProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '0.5rem', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Queries — {queryingProject.title}</h2>
              <button onClick={closeQueries} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>&times;</button>
            </div>

            {queriesLoading ? (
              <p style={{ color: '#64748b' }}>Loading queries...</p>
            ) : queries.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No queries submitted for this project yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {queries.map(q => (
                  <div key={q.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{q.clientName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {q.clientEmail}{q.clientPhone ? ` · ${q.clientPhone}` : ''}
                        </div>
                      </div>
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q.id, e.target.value as ProjectQuery['status'])}
                        style={{
                          padding: '0.3rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                          backgroundColor: q.status === 'Unread' ? '#fee2e2' : q.status === 'Read' ? '#fef9c3' : '#dcfce7',
                          color: q.status === 'Unread' ? '#991b1b' : q.status === 'Read' ? '#a16207' : '#166534'
                        }}
                      >
                        <option value="Unread">Unread</option>
                        <option value="Read">Read</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    <p style={{ margin: '0.5rem 0 0.25rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{q.message}</p>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>{new Date(q.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={closeQueries} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '0.375rem', color: '#1e293b', fontWeight: '600', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};