// frontend/src/utils/injectProductLinks.ts
import { resolveProductLink, usableLinks } from './productLink';

interface LinkedProductLike {
  label?: string;
  url?: string;
  productId?: string;
  id?: string;
}

const isSeparatorRow = (cells: string[]): boolean =>
  cells.length > 0 && cells.every((c: string) => /^:?-{1,}:?$/.test(c));

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

export function injectProductLinks(markdown: string, linkedProducts: LinkedProductLike[]): string {
  if (!markdown) return markdown;

  try {
    const usable: LinkedProductLike[] = usableLinks(linkedProducts);
    if (!usable.length) return markdown;

    const lines: string[] = markdown.split('\n');
    let linkColIndex = -1;
    let expectedColCount = -1;
    let sawSeparatorForCurrentTable = false;

    const result = lines.map((line: string) => {
      const trimmed = line.trim();
      const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1;

      if (!isTableRow) {
        // Left the table — reset all table-tracking state.
        linkColIndex = -1;
        expectedColCount = -1;
        sawSeparatorForCurrentTable = false;
        return line;
      }

      const cells: string[] = trimmed.slice(1, -1).split('|').map((c: string) => c.trim());

      // Separator row: NEVER modify it. Just record column count and move on.
      if (isSeparatorRow(cells)) {
        sawSeparatorForCurrentTable = true;
        expectedColCount = cells.length;
        return line;
      }

      // Header row (comes before the separator row).
      if (!sawSeparatorForCurrentTable) {
        const idx = cells.findIndex((c: string) => /^link$/i.test(c));
        if (idx !== -1) {
          linkColIndex = idx;
          expectedColCount = cells.length;
        }
        return line;
      }

      // Data row — only touch it if column count matches the header exactly
      // and there's a designated, currently-empty Link column.
      if (
        linkColIndex >= 0 &&
        expectedColCount > 0 &&
        cells.length === expectedColCount &&
        cells[linkColIndex] === ''
      ) {
        const componentName = cells[0];
        let best: LinkedProductLike | null = null;
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
          const href = resolveProductLink(best);
          cells[linkColIndex] = `[View Product](${href})`;
          return `| ${cells.join(' | ')} |`;
        }
      }

      return line;
    });

    return result.join('\n');
  } catch (err) {
    // Any unexpected shape in the markdown — bail out safely rather than
    // risk corrupting the table structure.
    console.error('injectProductLinks failed, rendering original markdown:', err);
    return markdown;
  }
}