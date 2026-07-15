// src/pages/BlogsManager.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlogs, deleteBlog, BlogPost } from '../api/blogService';

// Re-export the shared blog types/helper from their canonical home (blogService)
// so any file still importing them from here keeps working.
export type { BlogPost, LinkedProduct, BlogStatus } from '../api/blogService';
export { makeLinkId } from '../api/blogService';

export const BlogsManager: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = () => {
    setLoading(true);
    getBlogs()
      .then(setPosts)
      .catch((err) => {
        console.error(err);
        setError('Could not load blog articles. Is the backend running?');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDeletePost = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete blog article #${id}?`)) return;
    try {
      await deleteBlog(id);
      setPosts(prev => prev.filter(post => post.id !== id));
      if (viewingPost?.id === id) setViewingPost(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete this article.');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Blog Articles Manager</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Draft corporate press releases, announce inventory updates, and publish consumer resources.</p>
        </div>
        <button
          onClick={() => navigate('/admin/blogs/new')}
          style={{ padding: '0.625rem 1.25rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: '600', cursor: 'pointer' }}
        >
          ✍️ Add Article
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '0.375rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* 📊 Count badge */}
      <div style={{
        marginBottom: '1rem',
        fontSize: '0.925rem',
        color: '#475569',
        fontWeight: '600',
        backgroundColor: '#e2e8f0',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        display: 'inline-block'
      }}>
        {loading ? 'Loading…' : `${posts.length} ${posts.length === 1 ? 'article' : 'articles'}`}
      </div>

      {/* Content Table Block */}
      <div className="table-wrap" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '100px' }}>Post ID</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '110px' }}>Image</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '300px' }}>Title & Excerpt</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Date Logged</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '130px' }}>Linked Products</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '120px' }}>Status</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#64748b', fontFamily: 'monospace' }}>{post.id}</td>

                <td style={{ padding: '1rem' }}>
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="preview" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }} />
                  ) : (
                    <div style={{ width: '60px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>No Img</div>
                  )}
                </td>

                <td style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => setViewingPost(post)}>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{post.title}</div>
                  <div style={{
                    fontSize: '0.825rem',
                    color: '#64748b',
                    marginTop: '0.25rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  } as React.CSSProperties}>
                    {post.description}
                  </div>
                </td>

                <td style={{ padding: '1rem', color: '#64748b' }}>{post.publishDate}</td>

                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    backgroundColor: post.linkedProducts.length > 0 ? '#e0f2fe' : '#f1f5f9',
                    color: post.linkedProducts.length > 0 ? '#0369a1' : '#64748b'
                  }}>
                    {post.linkedProducts.length} {post.linkedProducts.length === 1 ? 'link' : 'links'}
                  </span>
                </td>

                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    backgroundColor: post.status === 'Published' ? '#dcfce7' : '#f1f5f9',
                    color: post.status === 'Published' ? '#16a34a' : '#475569'
                  }}>
                    {post.status === 'Published' ? '🚀 Published' : '📝 Draft'}
                  </span>
                </td>

                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={() => setViewingPost(post)} style={{ padding: '0.375rem 0.75rem', backgroundColor: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                      View
                    </button>
                    <button onClick={() => navigate(`/admin/blogs/edit/${post.id}`)} style={{ padding: '0.375rem 0.75rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDeletePost(post.id)} title="Delete Article" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
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

        {!loading && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No blog articles logged yet.</div>
        )}
      </div>

      {/* ============ DETAIL VIEW MODAL ============ */}
      {viewingPost && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-card" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            {viewingPost.imageUrl && (
              <div style={{ position: 'relative' }}>
                <img src={viewingPost.imageUrl} alt={viewingPost.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem', display: 'block' }} />
                <button onClick={() => setViewingPost(null)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', border: 'none', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: '1.25rem', width: '32px', height: '32px', borderRadius: '9999px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
              </div>
            )}

            <div className="modal-pad" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.85rem', marginBottom: '0.25rem' }}>#{viewingPost.id}</div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>{viewingPost.title}</h2>
                </div>
                {!viewingPost.imageUrl && (
                  <button onClick={() => setViewingPost(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                <span style={{ padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: viewingPost.status === 'Published' ? '#dcfce7' : '#f1f5f9', color: viewingPost.status === 'Published' ? '#16a34a' : '#475569' }}>
                  {viewingPost.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>By {viewingPost.author} &middot; {viewingPost.publishDate}</span>
              </div>

              {viewingPost.url && (
                <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                  <strong style={{ color: '#475569' }}>Article URL:</strong>{' '}
                  <a href={viewingPost.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>{viewingPost.url}</a>
                </div>
              )}

              <p style={{ color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '1.75rem' }}>{viewingPost.description}</p>

              <div>
                <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: '0 0 0.75rem 0' }}>Linked Products</h3>
                {viewingPost.linkedProducts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {viewingPost.linkedProducts.map(link => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', textDecoration: 'none', color: '#0f172a', fontSize: '0.875rem', backgroundColor: '#f8fafc' }}
                      >
                        <span style={{ fontWeight: '600' }}>🔗 {link.label}</span>
                        <span style={{ color: '#3b82f6', fontSize: '0.8rem' }}>View product &rarr;</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No product links added yet. Use Edit to add them.</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setViewingPost(null)} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '0.375rem', color: '#1e293b', fontWeight: '600', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};