import { Platform, Share } from 'react-native';
import type { Category, Transaction } from '@/store/types';
import { formatDate } from './finance';

const escapeCsv = (v: string) => {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
};

export const buildCSV = (txs: Transaction[], categories: Category[]) => {
  const header = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Subcategory', 'Merchant', 'Notes'];
  const rows = txs.map((t) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    const sub = t.subcategoryId ? categories.find((c) => c.id === t.subcategoryId) : null;
    return [
      formatDate(t.date),
      t.type,
      t.amount.toFixed(2),
      t.currency,
      cat?.name ?? '',
      sub?.name ?? '',
      t.merchant ?? '',
      t.notes ?? '',
    ].map((v) => escapeCsv(String(v)));
  });
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

export const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (field !== '' || row.length > 0) {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
        }
        if (ch === '\r' && text[i + 1] === '\n') i++;
      } else {
        field += ch;
      }
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

export const downloadWeb = (filename: string, content: string, mime: string) => {
  if (Platform.OS !== 'web') return;
  const g = globalThis as unknown as {
    Blob: new (parts: BlobPart[], options?: { type: string }) => Blob;
    URL: { createObjectURL: (b: Blob) => string; revokeObjectURL: (u: string) => void };
    document: Document;
  };
  const blob = new g.Blob([content], { type: mime });
  const url = g.URL.createObjectURL(blob);
  const a = g.document.createElement('a');
  a.href = url;
  a.download = filename;
  g.document.body.appendChild(a);
  a.click();
  a.remove();
  g.URL.revokeObjectURL(url);
};

export const shareText = async (title: string, message: string) => {
  try {
    await Share.share({ title, message });
  } catch {
    // ignore
  }
};
