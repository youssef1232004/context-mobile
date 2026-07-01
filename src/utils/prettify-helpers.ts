import { DocumentPrettifyResult } from '../services/prettify.service';

export const PRETTIFY_LIMITS = {
  Excel: { maxCells: 750, maxColumns: 20 },
  Word: { maxChars: 15000 },
  TextSnippet: { maxChars: 8000 },
} as const;

export interface CapacityInfo {
  label: string;
  percentage: number;
  isOverLimit: boolean;
}

export function computeCapacity(fileType: string, extractedText?: string): CapacityInfo | null {
  if (!extractedText) return null;

  if (fileType === 'Excel') {
    const lines = extractedText.split('\n').filter((l) => {
      const t = l.trim();
      return t && !t.startsWith('--- Sheet:');
    });
    if (lines.length === 0) return null;
    const columns = lines[0].split(',').length;
    const rows = lines.length;
    const cells = rows * columns;
    const pct = Math.round((cells / PRETTIFY_LIMITS.Excel.maxCells) * 100);
    return {
      label: `${rows} rows × ${columns} cols (${cells.toLocaleString()} cells) / ${PRETTIFY_LIMITS.Excel.maxCells} limit`,
      percentage: pct,
      isOverLimit: cells > PRETTIFY_LIMITS.Excel.maxCells || columns > PRETTIFY_LIMITS.Excel.maxColumns,
    };
  }

  if (fileType === 'Word') {
    const chars = extractedText.length;
    const pct = Math.round((chars / PRETTIFY_LIMITS.Word.maxChars) * 100);
    return {
      label: `${chars.toLocaleString()} chars / ${PRETTIFY_LIMITS.Word.maxChars.toLocaleString()} limit`,
      percentage: pct,
      isOverLimit: chars > PRETTIFY_LIMITS.Word.maxChars,
    };
  }

  if (fileType === 'TextSnippet') {
    const chars = extractedText.length;
    const pct = Math.round((chars / PRETTIFY_LIMITS.TextSnippet.maxChars) * 100);
    return {
      label: `${chars.toLocaleString()} chars / ${PRETTIFY_LIMITS.TextSnippet.maxChars.toLocaleString()} limit`,
      percentage: pct,
      isOverLimit: chars > PRETTIFY_LIMITS.TextSnippet.maxChars,
    };
  }

  return null;
}

export function stripHtml(text: string): string {
  if (!text) return '';
  return text.replace(/<\/?[^>]+(>|$)/g, '');
}

export function htmlToMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?b>/gi, '**')
    .replace(/<\/?strong>/gi, '**')
    .replace(/<\/?i>/gi, '*')
    .replace(/<\/?em>/gi, '*')
    .replace(/<\/?[^>]+(>|$)/g, '');
}

export function getListItems(
  section: DocumentPrettifyResult['sections'][number]
): { items: string[]; type: 'bullet' | 'numbered' } | null {
  if (section.numberedItems && section.numberedItems.length > 0) {
    return { items: section.numberedItems, type: 'numbered' };
  }
  if (section.bulletItems && section.bulletItems.length > 0) {
    return { items: section.bulletItems, type: 'bullet' };
  }
  if (section.items && section.items.length > 0) {
    return { items: section.items, type: 'bullet' };
  }
  return null;
}

export function convertToMarkdown(json: DocumentPrettifyResult): string {
  const isRtl = json.direction === 'rtl';

  const body = json.sections
    .map((section) => {
      const prefix = '#'.repeat(section.level);
      let md = `${prefix} ${htmlToMarkdown(section.heading)}\n\n`;

      if (section.content) {
        md += `${htmlToMarkdown(section.content)}\n\n`;
      }

      const listData = getListItems(section);
      if (listData) {
        if (listData.type === 'numbered') {
          md +=
            listData.items
              .map((item, i) => `${i + 1}. ${htmlToMarkdown(item)}`)
              .join('\n') + '\n\n';
        } else {
          md += listData.items.map((item) => `- ${htmlToMarkdown(item)}`).join('\n') + '\n\n';
        }
      }

      return md;
    })
    .join('');

  return body;
}
