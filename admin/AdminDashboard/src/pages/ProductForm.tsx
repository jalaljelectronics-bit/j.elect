// src/pages/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Product } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  // Form Fields State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState('');
  const [rating, setRating] = useState('0');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/categories`);
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  // Pre-populate data if in Edit Mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}/api/products/${id}`);
          const product = response.data;
          
          setName(product.name);
          setDescription(product.description);
          setPrice(product.price.toString());
          setCategoryId(product.categoryId.toString());
          setImageUrl(product.imageUrl);
          setStock(product.stock.toString());
          setRating((product.averageRating || 0).toString());
        } catch (err) {
          console.error('Failed to fetch product:', err);
          setError('Failed to load product details');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [isEditMode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Frontend Validations
    if (!name.trim() || !description.trim() || !price || !categoryId || !imageUrl || !stock) {
      setError('Please fill out all required fields.');
      return;
    }

    if (isNaN(Number(price)) || Number(price) <= 0) {
      setError('Price must be a valid positive number.');
      return;
    }

    if (isNaN(Number(stock)) || Number(stock) < 0) {
      setError('Stock must be a valid number.');
      return;
    }

    const numericRating = Number(rating);
    if (numericRating < 0 || numericRating > 5) {
      setError('Rating must be between 0 and 5.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      categoryId: Number(categoryId),
      imageUrl: imageUrl.trim(),
      stock: Number(stock),
      averageRating: numericRating
    };

    try {
      setLoading(true);

      if (isEditMode && id) {
        // Update existing product
        await axios.put(`${API_URL}/api/products/${id}`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        alert('Product updated successfully!');
      } else {
        // Create new product
        await axios.post(`${API_URL}/api/products`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        alert('Product added successfully!');
      }

      navigate('/admin/products');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save product';
      setError(errorMessage);
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card" style={{ maxWidth: '700px', backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#1e293b' }}>
        {isEditMode ? '✏️ Edit Product Details' : '➕ Add New Catalog Product'}
      </h2>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Product Name */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Product Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ProVision Premium"
            disabled={loading}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category Selection Dropdown */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Category *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loading || categories.length === 0}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Price & Stock Flex Block */}
        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Price (Rs) *</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1299"
              disabled={loading}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Stock (Units) *</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="50"
              disabled={loading}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Image URL Input */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Image URL *</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={loading}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* Rating Field */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Rating (0-5) ⭐</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* Product Description */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Product Description *</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a comprehensive breakdown of product features..."
            disabled={loading}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            disabled={loading}
            style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '0.375rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.6 : 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '0.625rem 1.25rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Product')}
          </button>
        </div>
      </form>
    </div>
  );
};