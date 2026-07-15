// src/pages/ProductsList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Standalone type matching the real backend product shape
// (the shared Product type in ../types describes the old static-JSON shape,
//  so extending it caused string/number mismatches).
interface ProductWithCategory {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrl: string;
  stock: number;
  averageRating?: number | null;
  category?: { id: number; name: string };
  stockQuantity: number;
  status: 'active' | 'inactive';
}

export const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: any = {};
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      const response = await axios.get(`${API_URL}/api/products`, { params });
      
      // Format products for display
      const formattedProducts = response.data.products.map((prod: any) => ({
        ...prod,
        categoryId: prod.categoryId,
        stockQuantity: prod.stock,
        status: prod.stock > 0 ? 'active' : 'inactive'
      }));
      
      setProducts(formattedProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/categories`);
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  // Filter products client-side
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.categoryId === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Delete product handler
  const handleDeleteProduct = async (id: number, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      alert('Product deleted successfully!');
      // Remove from state immediately
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete product';
      alert(`Error: ${errorMessage}`);
      console.error('Delete error:', err);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        Loading products...
      </div>
    );
  }

  return (
    <div>
      {/* Header Area */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Product Catalog</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Manage your product inventory - changes sync to frontend in real-time</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/new')}
          style={{ padding: '0.625rem 1.25rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: '600', cursor: 'pointer' }}
        >
          ➕ Add Product
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
          ⚠️ {error}
        </div>
      )}

      {/* FILTER BAR SECTION */}
      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {/* Search Bar */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="🔍 Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              fontSize: '0.95rem',
              backgroundColor: '#fff'
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ width: '220px' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              fontSize: '0.95rem',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            <option value="All">📂 All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => fetchProducts()}
          disabled={loading}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            opacity: loading ? 0.6 : 1
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Product Count Badge */}
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
        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
      </div>

      {/* Products Table */}
      <div className="table-wrap" style={{ backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.95rem' }}>
            {searchQuery || selectedCategory !== 'All' 
              ? 'No products match your search criteria.' 
              : 'No products available. Click "Add Product" to create one.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Product Name</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Category</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Price (Rs)</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Stock</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Rating</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{product.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>ID: {product.id}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#475569' }}>
                    {categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '500', color: '#0f172a' }}>Rs{product.price.toFixed(2)}</td>
                  <td style={{ padding: '1rem', color: product.stockQuantity < 10 ? '#ef4444' : '#0f172a' }}>
                    <span style={{ fontWeight: product.stockQuantity < 10 ? '700' : '400' }}>
                      {product.stockQuantity} units
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#0f172a' }}>
                    {product.averageRating ? `⭐ ${product.averageRating.toFixed(1)}` : 'No rating'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      padding: '0.25rem 0.625rem', 
                      fontSize: '0.75rem', 
                      borderRadius: '9999px', 
                      fontWeight: '600',
                      backgroundColor: product.status === 'active' ? '#dcfce7' : '#f1f5f9', 
                      color: product.status === 'active' ? '#15803d' : '#64748b' 
                    }}>
                      {product.status === 'active' ? '● In Stock' : '○ Out of Stock'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => navigate(`/admin/products/edit/${product.id}`)} 
                      style={{ 
                        padding: '0.375rem 0.75rem', 
                        border: 'none', 
                        borderRadius: '0.375rem', 
                        fontSize: '0.875rem', 
                        cursor: 'pointer', 
                        backgroundColor: '#f1f5f9', 
                        color: '#1e293b', 
                        marginRight: '0.5rem', 
                        fontWeight: '500' 
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      style={{ 
                        padding: '0.375rem 0.75rem', 
                        backgroundColor: '#ef4444', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '0.375rem', 
                        fontSize: '0.875rem', 
                        cursor: 'pointer', 
                        fontWeight: '500' 
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
          Syncing with server...
        </div>
      )}
    </div>
  );
};
