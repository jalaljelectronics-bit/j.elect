// src/components/MarkdownContent.jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { injectProductLinks } from '../utils/injectProductLinks';

const components = {
  table: (props) => (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', border: '1px solid #475569' }} {...props} />
    </div>
  ),
  thead: (props) => <thead {...props} />,
  th: (props) => (
    <th style={{
      border: '1px solid #475569',
      padding: '8px 12px',
      textAlign: 'left',
      fontWeight: 700,
      color: '#ffffff',
      backgroundColor: '#1e3a5f'
    }} {...props} />
  ),
  td: (props) => (
    <td style={{
      border: '1px solid #475569',
      padding: '6px 12px',
      color: '#e2e8f0',
      verticalAlign: 'top'
    }} {...props} />
  ),
  code: (props) => (
    <code style={{ backgroundColor: '#1e293b', color: '#e2e8f0', padding: '2px 5px', borderRadius: '4px', fontSize: '0.85em' }} {...props} />
  ),
  pre: (props) => (
    <pre style={{ backgroundColor: '#0f172a', color: '#e2e8f0', padding: '14px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.5 }} {...props} />
  ),
  ul: (props) => <ul style={{ paddingLeft: '1.25rem', margin: '8px 0', lineHeight: 1.6, color: '#cbd5e1' }} {...props} />,
  ol: (props) => <ol style={{ paddingLeft: '1.25rem', margin: '8px 0', lineHeight: 1.6, color: '#cbd5e1' }} {...props} />,
  li: (props) => <li style={{ color: '#cbd5e1' }} {...props} />,
  p: (props) => <p style={{ margin: '8px 0', lineHeight: 1.6, color: '#cbd5e1' }} {...props} />,
  h1: (props) => <h1 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '10px' }} {...props} />,
  h2: (props) => <h2 style={{ color: '#f8fafc', marginTop: '18px', marginBottom: '8px' }} {...props} />,
  h3: (props) => <h3 style={{ color: '#f1f5f9', marginTop: '16px', marginBottom: '6px' }} {...props} />,
  strong: (props) => <strong style={{ color: '#f8fafc' }} {...props} />,
  a: (props) => <a style={{ color: '#60a5fa', textDecoration: 'underline' }} {...props} />,
  blockquote: (props) => (
    <blockquote style={{
      borderLeft: '3px solid #475569',
      paddingLeft: '12px',
      margin: '8px 0',
      color: '#94a3b8',
      fontStyle: 'italic'
    }} {...props} />
  ),
};

export default function MarkdownContent({ content, linkedProducts = [] }) {
  if (!content) return null;
  const processed = injectProductLinks(content, linkedProducts);
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {processed}
    </ReactMarkdown>
  );
}