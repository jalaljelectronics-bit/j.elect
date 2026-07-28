// Admin equivalent of frontend/src/utils/injectProductLinks.ts.
// Scans markdown tables and auto-fills empty "Link" column cells by
// matching the row's first cell against linkedProducts labels — used so
// the admin preview matches what visitors will actually see on the site.
import { LinkedProduct } from '../components/LinkedProductsEditor';
import { productPath } from '../api/catalogService';

// Mirrors frontend's resolveProductLink: prefer the real catalog product id;
// otherwise fall back to whatever URL was typed in manually.
function resolveAdminLink(link: LinkedProduct): string {
  if (link.productId) return productPath(link.productId);
  return link.url || '#';
}

// Words that carry no real matching signal — strip them before comparing,
// otherwise things like "in", "for", "100%", "original" pollute the score.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'in', 'for', 'with', 'and', 'or', 'to', 'on', 'at', 'of',
  'original', 'pcs', 'pc', 'set', 'kit', 'new', 'best', 'pakistan'
]);

const tokenize = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));

// Fraction of the component name's meaningful words that also appear
// somewhere in the candidate product's label. Order/extra words in the
// label don't matter — real catalog titles are long and noisy
// ("100% Original Arduino R3 UNO SMD Atmega328P in Pakistan").
const matchScore = (componentName: string, label: string): number => {
  const compWords = tokenize(componentName);
  if (!compWords.length) return 0;
  const labelWords = new Set(tokenize(label));
  const hits = compWords.filter((w) => labelWords.has(w)).length;
  return hits / compWords.length;
};

const MATCH_THRESHOLD = 0.6;

export function injectProductLinks(markdown: string, linkedProducts: LinkedProduct[]): string {
  const usable = (linkedProducts || []).filter((l) => l && (l.productId || l.url || l.label));
  if (!markdown || !usable.length) return markdown;

  const lines: string[] = markdown.split('\n');
  let linkColIndex = -1;

  return lines
    .map((line: string) => {
      const trimmed = line.trim();
      const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');
      if (!isTableRow) {
        linkColIndex = -1;
        return line;
      }

      const cells: string[] = trimmed.slice(1, -1).split('|').map((c: string) => c.trim());

      if (cells.some((c: string) => /^link$/i.test(c))) {
        linkColIndex = cells.findIndex((c: string) => /^link$/i.test(c));
        return line;
      }

      if (cells.every((c: string) => /^:?-+:?$/.test(c))) return line;

      if (linkColIndex >= 0 && cells[linkColIndex] === '') {
        const componentName = cells[0];
        let best: LinkedProduct | null = null;
        let bestScore = 0;

        for (const l of usable) {
          if (!l.label) continue;
          const score = matchScore(componentName, l.label);
          if (score > bestScore) {
            bestScore = score;
            best = l;
          }
        }

        if (best && bestScore >= MATCH_THRESHOLD) {
          const href = resolveAdminLink(best);
          cells[linkColIndex] = `[View Product](${href})`;
          return `| ${cells.join(' | ')} |`;
        }
      }

      return line;
    })
    .join('\n');
}