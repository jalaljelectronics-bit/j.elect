// src/components/MarkdownContent.jsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { injectProductLinks } from '../utils/injectProductLinks';
import { autoFormatMarkdown } from '../utils/autoFormatMarkdown';

// Recursively pulls plain text out of React children (strings, arrays, nested elements)
function extractText(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node?.props?.children) return extractText(node.props.children);
  return '';
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const codeString = extractText(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div style={{ position: 'relative', margin: '14px 0' }}>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy code'}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 9px',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: copied ? '#22d3ee' : '#94a3b8',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid #334155',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'color 0.15s, border-color 0.15s',
          zIndex: 2,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = copied ? '#22d3ee' : '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy
          </>
        )}
      </button>
      <pre style={{ backgroundColor: '#0f172a', color: '#e2e8f0', padding: '14px', paddingTop: '38px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.5 }}>
        {children}
      </pre>
    </div>
  );
}

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
  pre: (props) => <CodeBlock>{props.children}</CodeBlock>,
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
  const formatted = autoFormatMarkdown(content);
  const processed = injectProductLinks(formatted, linkedProducts);
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {processed}
    </ReactMarkdown>
  );
}