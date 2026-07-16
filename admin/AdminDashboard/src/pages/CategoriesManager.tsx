// src/pages/CategoriesManager.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Category {
  id: number;
  name: string;
  imageUrl?: string | null;
}

export const CategoriesManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // ----- Inline edit state -----
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // ----- Load categories + product counts from the real backend -----
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/api/categories`);
      setCategories(response.data);

      // Get how many products are linked to each category. The products
      // endpoint supports ?category=<id>, so we ask for the count per
      // category rather than trying to guess it from a static file.
      const countsEntries = await Promise.all(
        response.data.map(async (cat: Category) => {
          try {
            const res = await axios.get(`${API_URL}/api/products`, {
              params: { category: cat.id, limit: 1 }
            });
            return [cat.id, res.data.totalProducts ?? 0] as const;
          } catch {
            return [cat.id, 0] as const;
          }
        })
      );
      setProductCounts(Object.fromEntries(countsEntries));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ----- Add a new category (persists to the database) -----
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert('Please enter a valid category name.');
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        `${API_URL}/api/categories`,
        { name: newCatName.trim(), imageUrl: newCatImageUrl.trim() || null },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setNewCatName('');
      setNewCatImageUrl('');
      await fetchCategories();
      alert('Category added successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add category';
      alert(`Error: ${errorMessage}`);
      console.error('Error adding category:', err);
    } finally {
      setSaving(false);
    }
  };

  // ----- Delete a category (persists to the database) -----
  const handleDeleteCategory = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" category?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCategories(prev => prev.filter(cat => cat.id !== id));
      alert('Category deleted!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete category';
      alert(`Error: ${errorMessage}`);
      console.error('Error deleting category:', err);
    }
  };

  // ----- Start editing a category -----
  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditImageUrl(cat.imageUrl || '');
  };

  // ----- Cancel editing -----
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditImageUrl('');
  };

  // ----- Save an edited category (persists to the database) -----
  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      alert('Please enter a valid category name.');
      return;
    }

    try {
      setEditSaving(true);
      await axios.put(
        `${API_URL}/api/categories/${id}`,
        { name: editName.trim(), imageUrl: editImageUrl.trim() || null },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setEditingId(null);
      setEditName('');
      setEditImageUrl('');
      await fetchCategories();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update category';
      alert(`Error: ${errorMessage}`);
      console.error('Error updating category:', err);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div>
      {/* Page Heading Area */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Category Management</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
          These are the real categories stored in the database — the same list shown in the "Category" dropdown when adding a product.
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
          ⚠️ {error}
        </div>
      )}

      {/* 🔝 TOP SECTION: Create New Category Form */}
      <div className="form-card" style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', color: '#0f172a', fontWeight: '600' }}>✨ Create New Category</h3>
        <form onSubmit={handleAddCategory} className="filter-bar" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1, minWidth: '240px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Category Name</label>
            <input
              type="text"
              placeholder="e.g. Office Stationery"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              disabled={saving}
              style={{ padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.925rem', height: '42px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1.5, minWidth: '260px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Category Image URL</label>
            <input
              type="text"
              placeholder="Paste image address (https://...)"
              value={newCatImageUrl}
              onChange={(e) => setNewCatImageUrl(e.target.value)}
              disabled={saving}
              style={{ padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.925rem', height: '42px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{ padding: '0rem 1.5rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', height: '42px', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {saving ? 'Saving...' : '🚀 Save New Category'}
          </button>
        </form>
      </div>

      {/* 📊 TOTAL COUNT BADGE */}
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
        {loading ? 'Loading…' : `${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`}
      </div>

      {/* Existing Categories Table */}
      <div className="table-wrap" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', width: '90px' }}>Image</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Category Name</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>ID</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Linked Products</th>
              <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  No categories yet. Add one above.
                </td>
              </tr>
            )}
            {categories.map(cat => {
              const itemsCount = productCounts[cat.id] ?? 0;
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '1rem' }}>
                      {editImageUrl ? (
                        <img
                          src={editImageUrl}
                          alt={editName}
                          style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        <div style={{ width: '60px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>No Img</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }} colSpan={1}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={editSaving}
                        placeholder="Category name"
                        style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        type="text"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        disabled={editSaving}
                        placeholder="Image URL (https://...)"
                        style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', marginTop: '0.5rem' }}
                      />
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontFamily: 'monospace' }}>{cat.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: itemsCount > 0 ? '#e0f2fe' : '#f1f5f9',
                        color: itemsCount > 0 ? '#0369a1' : '#64748b'
                      }}>
                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={editSaving}
                        style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: '600', cursor: editSaving ? 'not-allowed' : 'pointer', marginRight: '0.5rem', opacity: editSaving ? 0.6 : 1 }}
                      >
                        {editSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={editSaving}
                        style={{ backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '0.375rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: '600', cursor: editSaving ? 'not-allowed' : 'pointer' }}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={cat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                      />
                    ) : (
                      <div style={{ width: '60px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>No Img</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{cat.name}</td>
                  <td style={{ padding: '1rem', color: '#64748b', fontFamily: 'monospace' }}>{cat.id}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: itemsCount > 0 ? '#e0f2fe' : '#f1f5f9',
                      color: itemsCount > 0 ? '#0369a1' : '#64748b'
                    }}>
                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => handleStartEdit(cat)}
                      style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', marginRight: '0.5rem' }}
                      title="Edit Category"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      title="Delete Category"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
