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

export function convertToMarkdown(json: DocumentPrettifyResult): string {
  const isRtl = json.direction === 'rtl';
  
  // Pre-pass for numbered list items to generate correct numbering
  const listNumbers: number[] = [];
  let currentNum = 0;
  (json.blocks || []).forEach((block) => {
    if (block.type === 'heading' || block.type === 'divider' || block.type === 'table') {
      currentNum = 0;
    } else if (block.type === 'numbered_list_item') {
      currentNum++;
    }
    listNumbers.push(currentNum);
  });

  const body = (json.blocks || []).map((block, bi) => {
    if (block.type === 'heading') {
      const prefix = '#'.repeat(Math.min(block.level, 6));
      return `${prefix} ${htmlToMarkdown(block.text)}\n\n`;
    }
    
    if (block.type === 'paragraph') {
      return `${htmlToMarkdown(block.text)}\n\n`;
    }
    
    if (block.type === 'quote') {
      return `> ${htmlToMarkdown(block.text)}\n\n`;
    }
    
    if (block.type === 'code') {
      return `\`\`\`${block.language || ''}\n${block.text}\n\`\`\`\n\n`;
    }
    
    if (block.type === 'bullet_list_item') {
      return `- ${htmlToMarkdown(block.text)}\n`;
    }
    
    if (block.type === 'numbered_list_item') {
      const num = listNumbers[bi];
      return `${num}. ${htmlToMarkdown(block.text)}\n`;
    }
    
    if (block.type === 'mcq_option') {
      return `${block.letter}) ${htmlToMarkdown(block.text)}\n`;
    }
    
    if (block.type === 'table') {
      const mdTable = `| ${block.headers.join(' | ')} |\n| ${block.headers.map(() => '---').join(' | ')} |\n${block.rows.map(row => `| ${row.join(' | ')} |`).join('\n')}`;
      return `${mdTable}\n\n`;
    }
    
    if (block.type === 'divider') {
      return `---\n\n`;
    }

    return '';
  }).join('');

  // Clean up consecutive newlines (more than 2)
  return body.replace(/\n{3,}/g, '\n\n');
}
