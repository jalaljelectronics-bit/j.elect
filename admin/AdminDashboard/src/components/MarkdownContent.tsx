import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { injectProductLinks } from '../utils/injectProductLinks';
import { LinkedProduct } from './LinkedProductsEditor';
import { autoFormatMarkdown } from '../utils/autoFormatMarkdown';

const components = {
  table: (props: any) => (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', border: '1px solid #94a3b8' }} {...props} />
    </div>
  ),
  thead: (props: any) => <thead {...props} />,
  th: (props: any) => (
    <th style={{
      border: '1px solid #94a3b8',
      padding: '8px 12px',
      textAlign: 'left',
      fontWeight: 700,
      color: '#ffffff',
      backgroundColor: '#1e3a5f'
    }} {...props} />
  ),
  td: (props: any) => (
    <td style={{
      border: '1px solid #94a3b8',
      padding: '6px 12px',
      color: '#1e293b',
      verticalAlign: 'top'
    }} {...props} />
  ),
  code: (props: any) => (
    <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '0.85em' }} {...props} />
  ),
  pre: (props: any) => (
    <pre style={{ backgroundColor: '#0f172a', color: '#e2e8f0', padding: '14px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.5 }} {...props} />
  ),
  ul: (props: any) => <ul style={{ paddingLeft: '1.25rem', margin: '8px 0', lineHeight: 1.6 }} {...props} />,
  ol: (props: any) => <ol style={{ paddingLeft: '1.25rem', margin: '8px 0', lineHeight: 1.6 }} {...props} />,
  p: (props: any) => <p style={{ margin: '8px 0', lineHeight: 1.6, color: '#475569' }} {...props} />,
};

interface Props {
  content: string;
  linkedProducts?: LinkedProduct[];
}

export default function MarkdownContent({ content, linkedProducts = [] }: Props) {
  if (!content) return null;
  const formatted = autoFormatMarkdown(content);
  const processed = injectProductLinks(formatted, linkedProducts);
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {processed}
    </ReactMarkdown>
  );
}