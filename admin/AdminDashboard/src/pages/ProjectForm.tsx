// src/pages/ProjectForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjectById, createProject, updateProject, ContentSection } from '../api/projectService';
import LinkedProductsEditor, {
  LinkedProduct,
  cleanLinks,
  validateLinks
} from '../components/LinkedProductsEditor';

const makeSectionId = () => `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const blankSection = (): ContentSection => ({
  id: makeSectionId(),
  title: '',
  imageUrl: '',
  description: ''
});

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxSizing: 'border-box', fontSize: '0.95rem'
};

const sectionCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem'
};

export const ProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<'Commercial' | 'University'>('Commercial');
  const [status, setStatus] = useState<'In Progress' | 'Completed' | 'On Hold'>('In Progress');
  const [price, setPrice] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [introDescription, setIntroDescription] = useState('');
  const [introImageUrl, setIntroImageUrl] = useState('');
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);

  // Pre-populate data if in Edit Mode — real backend fetch
  useEffect(() => {
    if (isEditMode && id) {
      getProjectById(Number(id))
        .then((res) => {
          const p = res.project;
          setTitle(p.title || '');
          setImageUrl(p.imageUrl || '');
          setCategory(p.category || 'Commercial');
          setStatus(p.status || 'In Progress');
          setPrice(p.price != null ? String(p.price) : '');
          setIsFeatured(Boolean(p.isFeatured));
          setIsNewArrival(Boolean(p.isNewArrival));
          setGithubUrl(p.githubUrl || '');
          setIntroDescription(p.introDescription || '');
          setIntroImageUrl(p.introImageUrl || '');
          setSections(Array.isArray(p.sections) ? p.sections : []);
          setLinkedProducts(Array.isArray(p.linkedProducts) ? p.linkedProducts : []);
        })
        .catch((err) => {
          console.error(err);
          alert('Could not load project.');
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, id]);

  const addSection = () => setSections(prev => [...prev, blankSection()]);
  const removeSection = (sectionId: string) => setSections(prev => prev.filter(s => s.id !== sectionId));
  const updateSection = (sectionId: string, patch: Partial<ContentSection>) =>
    setSections(prev => prev.map(s => (s.id === sectionId ? { ...s, ...patch } : s)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a project title.');
      return;
    }

    if (price !== '' && (isNaN(Number(price)) || Number(price) < 0)) {
      alert('Price must be a valid positive number in Rupees.');
      return;
    }

    const linkError = validateLinks(linkedProducts);
    if (linkError) {
      alert(linkError);
      return;
    }

    const payload = {
      title: title.trim(),
      category,
      status,
      price: Number(price) || 0,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500',
      isFeatured,
      isNewArrival,
      githubUrl: githubUrl.trim(),
      introDescription: introDescription.trim(),
      introImageUrl: introImageUrl.trim(),
      sections: sections
        .filter(s => s.title.trim() || s.imageUrl.trim() || s.description.trim())
        .map(s => ({ ...s, title: s.title.trim(), imageUrl: s.imageUrl.trim(), description: s.description.trim() })),
      linkedProducts: cleanLinks(linkedProducts)
    };

    setSubmitting(true);
    try {
      if (isEditMode && id) {
        await updateProject(Number(id), payload);
        alert('Project updated!');
      } else {
        await createProject(payload);
        alert('Project entry logged successfully!');
      }
      navigate('/admin/projects');
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Error saving project.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading project...</div>;

  return (
    <div className="form-card" style={{ maxWidth: '760px', backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#1e293b' }}>
        {isEditMode ? 'Edit Project Details' : 'Log New Project Entry'}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Project Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Flight Booking Portal" style={inputStyle} />
        </div>

        {/* Price (Rupees) */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Price (Rs)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: '600', pointerEvents: 'none' }}>Rs</span>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="149999"
              style={{ ...inputStyle, paddingLeft: '1.75rem' }}
            />
          </div>
        </div>

        {/* Cover image + Category */}
        <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Cover Image URL</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste image address (https://...)" style={inputStyle} />
          </div>
          <div style={{ width: '220px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Classification Group</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as 'Commercial' | 'University')} style={{ ...inputStyle, backgroundColor: '#fff', cursor: 'pointer' }}>
              <option value="Commercial">Commercial Project</option>
              <option value="University">University Project</option>
            </select>
          </div>
        </div>

        {/* GitHub */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>GitHub Repository URL</label>
          <input type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username/repo" style={inputStyle} />
        </div>

        {/* Intro block */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <label style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '0.75rem' }}>Intro Detail</label>
          <div style={sectionCardStyle}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.375rem' }}>Intro Image URL</label>
              <input type="text" value={introImageUrl} onChange={(e) => setIntroImageUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.375rem' }}>Intro Description</label>
              <textarea rows={3} value={introDescription} onChange={(e) => setIntroDescription(e.target.value)} placeholder="Describe the project overall, what it is, what was built..." style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Dynamic sections */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Additional Sections <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(working process, features, etc.)</span></label>
            <button type="button" onClick={addSection} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Section
            </button>
          </div>

          {sections.length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0, fontSize: '0.875rem' }}>No sections added yet. Click "Add Section" to add title, image, and description blocks.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sections.map((section, idx) => (
                <div key={section.id} style={sectionCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>Section {idx + 1}</span>
                    <button type="button" onClick={() => removeSection(section.id)} title="Remove section" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.375rem' }}>Section Title</label>
                    <input type="text" value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} placeholder="e.g. Wireframing & Planning" style={inputStyle} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.375rem' }}>Section Image URL</label>
                    <input type="text" value={section.imageUrl} onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })} placeholder="https://..." style={inputStyle} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.375rem' }}>Section Description</label>
                    <textarea rows={2} value={section.description} onChange={(e) => updateSection(section.id, { description: e.target.value })} placeholder="Describe this part of the process..." style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked products */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <LinkedProductsEditor
            value={linkedProducts}
            onChange={setLinkedProducts}
            helperText="(products used in or related to this project — visitors can click through to buy them)"
          />
        </div>

        {/* Status */}
        {isEditMode && (
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.375rem', color: '#4b5563' }}>Pipeline Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'In Progress' | 'Completed' | 'On Hold')} style={{ ...inputStyle, backgroundColor: '#fff', cursor: 'pointer' }}>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        )}

        {/* Flags */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#4b5563' }}>Project Flags</label>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#334155', fontSize: '0.925rem' }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }} />
              Featured Project
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#334155', fontSize: '0.925rem' }}>
              <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }} />
              New Arrival
            </label>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <button type="button" onClick={() => navigate('/admin/projects')} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600' }}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Saving...' : isEditMode ? 'Save Modifications' : 'Add Project'}
          </button>
        </div>
      </form>
    </div>
  );
};
