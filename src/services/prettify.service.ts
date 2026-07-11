import { api } from './api';

// ── Types ──────────────────────────────────────────────────────
export interface ExcelPrettifyResult {
  type: 'spreadsheet';
  language: string;
  direction: 'rtl' | 'ltr';
  sheets: Array<{ name: string; headers: string[]; rows: string[][] }>;
  metadata?: { detectedType: string; patterns: string[] };
}

export type PrettifyBlock = 
  | { type: 'heading', level: number, text: string }
  | { type: 'paragraph', text: string }
  | { type: 'code', language?: string | null, text: string }
  | { type: 'quote', text: string }
  | { type: 'bullet_list_item', text: string }
  | { type: 'numbered_list_item', text: string }
  | { type: 'mcq_option', letter: string, text: string }
  | { type: 'table', headers: string[], rows: string[][] }
  | { type: 'divider' };

export interface DocumentPrettifyResult {
  type: 'document';
  language: string;
  direction: 'rtl' | 'ltr';
  blocks: PrettifyBlock[];
  metadata?: { detectedType: string; patterns: string[] };
}

export type PrettifyResult = ExcelPrettifyResult | DocumentPrettifyResult;

export interface PrettifyLimitError {
  error: 'PRETTIFY_LIMIT_EXCEEDED';
  fileType: string;
  limit: Record<string, number>;
  actual: Record<string, number>;
  message: string;
  suggestion: string;
}

export const isPrettifyLimitError = (data: unknown): data is PrettifyLimitError =>
  typeof data === 'object' && data !== null &&
  (data as PrettifyLimitError).error === 'PRETTIFY_LIMIT_EXCEEDED';

// ── Service ────────────────────────────────────────────────────
export const prettifyService = {
  prettifyDocument: async (documentId: string, force = false): Promise<PrettifyResult> => {
    const response = await api.post(
      `/prettify/${documentId}${force ? '?force=true' : ''}`,
      {}
    );
    return response.data.data;
  },
};
