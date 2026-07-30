// src/pages/BlogForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BlogPost,
  BlogStatus,
  getBlog,
  createBlog,
  updateBlog
} from '../api/blogService';
import LinkedProductsEditor, {
  LinkedProduct,
  cleanLinks,
  validateLinks
} from '../components/LinkedProductsEditor';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box', fontSize: '0.95rem'
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563'
};

export const BlogForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const numericId = id ? Number(id) : null;

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<BlogStatus>('Draft');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);

  // SEO meta tag fields
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Tracks whether the pasted image URL actually loads, so we can give feedback.
  const [imgStatus, setImgStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  // Pre-populate data if in Edit Mode — now a real API fetch.
  useEffect(() => {
    if (!isEditMode || numericId == null) return;

    let active = true;
    setLoading(true);
    getBlog(numericId)
      .then((post: BlogPost) => {
        if (!active) return;
        setTitle(post.title);
        setUrl(post.url);
        setStatus(post.status);
        setDescription(post.description);
        setImageUrl(post.imageUrl);
        setLinkedProducts(post.linkedProducts.map(link => ({ ...link })));
        setMetaTitle(post.metaTitle ?? '');
        setMetaDescription(post.metaDescription ?? '');
      })
      .catch((err) => {
        console.error(err);
        alert('Could not load this blog post.');
        navigate('/admin/blogs');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [isEditMode, numericId, navigate]);

  // Reset the preview state whenever the URL changes.
  useEffect(() => {
    const trimmed = imageUrl.trim();
    setImgStatus(trimmed ? 'loading' : 'idle');
  }, [imageUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert('Please fill out the article title and description.');
      return;
    }

    const trimmedImage = imageUrl.trim();
    if (trimmedImage && !trimmedImage.startsWith('http')) {
      alert('The cover image must be a full URL starting with http(s)://');
      return;
    }

    if (metaTitle.trim().length > 60) {
      alert('Meta title should be 60 characters or fewer for best SEO results.');
      return;
    }
    if (metaDescription.trim().length > 160) {
      alert('Meta description should be 160 characters or fewer for best SEO results.');
      return;
    }

    const linkError = validateLinks(linkedProducts);
    if (linkError) {
      alert(linkError);
      return;
    }

    const cleanedLinks = cleanLinks(linkedProducts);

    const payload = {
      title: title.trim(),
      url: url.trim(),
      status,
      description: description.trim(),
      imageUrl: trimmedImage,
      author: 'Admin',
      linkedProducts: cleanedLinks,
      // fall back to the article title/description if left blank
      metaTitle: metaTitle.trim() || title.trim(),
      metaDescription: metaDescription.trim() || description.trim().slice(0, 160)
    };

    try {
      setSaving(true);
      if (isEditMode && numericId != null) {
        await updateBlog(numericId, payload);
        alert('Article updated!');
      } else {
        await createBlog(payload);
        alert('Article published successfully!');
      }
      navigate('/admin/blogs');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Something went wrong while saving the article.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem', color: '#64748b' }}>
        Loading article…
      </div>
    );
  }

  const trimmedImage = imageUrl.trim();

  return (
    <div className="form-card" style={{ maxWidth: '760px', backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#1e293b' }}>
        {isEditMode ? '✏️ Edit Blog Article' : '✍️ Compose New Article'}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Title */}
        <div>
          <label style={labelStyle}>Article Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introducing the ProVision Max" style={inputStyle} />
        </div>

        {/* URL + Status */}
        <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '260px' }}>
            <label style={labelStyle}>Article URL</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/blog/introducing-the-provision-max" style={inputStyle} />
          </div>
          <div style={{ width: '180px' }}>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as BlogStatus)} style={{ ...inputStyle, backgroundColor: '#fff', cursor: 'pointer' }}>
              <option value="Draft">📝 Draft</option>
              <option value="Published">🚀 Published</option>
            </select>
          </div>
        </div>

        {/* Cover image */}
        <div>
          <label style={labelStyle}>Cover Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image address (https://...)"
            style={inputStyle}
          />

          {/* Live preview */}
          {trimmedImage !== '' && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{
                width: '100%', maxWidth: '360px', aspectRatio: '16 / 9', borderRadius: '0.5rem',
                border: '1px solid #e2e8f0', overflow: 'hidden', backgroundColor: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <img
                  src={trimmedImage}
                  alt="Cover preview"
                  onLoad={() => setImgStatus('ok')}
                  onError={() => setImgStatus('error')}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    display: imgStatus === 'error' ? 'none' : 'block'
                  }}
                />
                {imgStatus === 'error' && (
                  <span style={{ fontSize: '0.85rem', color: '#ef4444', padding: '0 1rem', textAlign: 'center' }}>
                    ⚠️ Couldn't load this image. Check that it's a direct image link ending in .jpg/.png/.webp and that the site allows hotlinking.
                  </span>
                )}
              </div>
              {imgStatus === 'ok' && (
                <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.375rem' }}>✓ Image loaded</div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description *</label>
          <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write the article summary or full content..." style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />
        </div>

        {/* SEO / Meta Tags */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1.25rem', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: '#1e293b' }}>🔍 SEO / Meta Tags</h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
            Controls how this article appears in Google search results and link previews. Leave blank to fall back to the title/description above.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={title || 'e.g. Introducing the ProVision Max | YourStore'}
              style={inputStyle}
              maxLength={100}
            />
            <div style={{
              fontSize: '0.75rem',
              marginTop: '0.25rem',
              color: metaTitle.trim().length > 60 ? '#ef4444' : '#94a3b8'
            }}>
              {metaTitle.trim().length}/60 characters
            </div>
          </div>

          <div>
            <label style={labelStyle}>Meta Description</label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={description ? description.slice(0, 160) : 'A short summary shown under the title in search results...'}
              style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
              maxLength={200}
            />
            <div style={{
              fontSize: '0.75rem',
              marginTop: '0.25rem',
              color: metaDescription.trim().length > 160 ? '#ef4444' : '#94a3b8'
            }}>
              {metaDescription.trim().length}/160 characters
            </div>
          </div>
        </div>

        {/* Linked products */}
        <div>
          <LinkedProductsEditor
            value={linkedProducts}
            onChange={setLinkedProducts}
            helperText="(readers can click through to view these products on the site)"
          />
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <button type="button" disabled={saving} onClick={() => navigate('/admin/blogs')} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600', opacity: saving ? 0.6 : 1 }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : isEditMode ? 'Save Modifications' : 'Publish Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};