// autoFormatMarkdown.js
// Detects tab-separated tabular text pasted into a content field and
// converts it into a proper markdown table at render time.

function splitRow(line) {
  // Tab-separated data (e.g. pasted from Sheets/Excel) — keep empty cells as real columns
  if (line.includes('\t')) {
    return line.split('\t').map((c) => c.trim());
  }
  // Fallback: multi-space separated plain text — safe to drop stray empties here
  return line.split(/ {2,}/).map((c) => c.trim()).filter(Boolean);
}

function looksLikeTableBlock(lines) {
  if (lines.length < 2) return false;
  if (lines[0].includes('|')) return false; // already markdown

  const splitCounts = lines.map((l) => splitRow(l).length);
  const consistent = splitCounts.filter((c) => c === splitCounts[0]).length;
  return splitCounts[0] >= 2 && consistent / lines.length >= 0.7;
}

function toMarkdownTable(lines) {
  const rows = lines.map(splitRow);
  const colCount = Math.max(...rows.map((r) => r.length));
  const pad = (row) => {
    while (row.length < colCount) row.push('');
    return row;
  };
  const header = pad(rows[0]);
  const sep = header.map(() => '---');
  const body = rows.slice(1).map(pad);
  const toRow = (cells) => `| ${cells.join(' | ')} |`;
  return [toRow(header), toRow(sep), ...body.map(toRow)].join('\n');
}

export function autoFormatMarkdown(text) {
  if (!text || !text.trim()) return text;

  const lines = text.split('\n');
  const outputBlocks = [];
  let buffer = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    if (looksLikeTableBlock(buffer)) {
      outputBlocks.push(toMarkdownTable(buffer));
    } else {
      outputBlocks.push(buffer.join('\n'));
    }
    buffer = [];
  };

  for (const line of lines) {
    const isTabular = /\t| {2,}/.test(line) && line.trim() !== '';
    if (isTabular) {
      buffer.push(line);
    } else {
      flushBuffer();
      outputBlocks.push(line);
    }
  }
  flushBuffer();

  return outputBlocks.join('\n');
}