import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  inputStyle: React.CSSProperties;
  placeholder?: string;
}

const ImageField: React.FC<ImageFieldProps> = ({ label, value, onChange, inputStyle, placeholder }) => {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      onChange(res.data.url);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>{label}</label>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={() => setMode('url')}
            style={{
              padding: '0.2rem 0.55rem', borderRadius: '0.3rem', border: '1px solid #d1d5db',
              backgroundColor: mode === 'url' ? '#3b82f6' : '#fff',
              color: mode === 'url' ? '#fff' : '#4b5563', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem',
            }}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            style={{
              padding: '0.2rem 0.55rem', borderRadius: '0.3rem', border: '1px solid #d1d5db',
              backgroundColor: mode === 'upload' ? '#3b82f6' : '#fff',
              color: mode === 'upload' ? '#fff' : '#4b5563', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem',
            }}
          >
            Upload
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'https://...'}
          style={inputStyle}
        />
      ) : (
        <div>
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
          {uploading && <p style={{ fontSize: '0.78rem', color: '#3b82f6', marginTop: '0.375rem' }}>Uploading...</p>}
        </div>
      )}

      {value && (
        <img
          src={value}
          alt="preview"
          style={{ marginTop: '0.5rem', maxHeight: '110px', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}
        />
      )}
    </div>
  );
};

export default ImageField;