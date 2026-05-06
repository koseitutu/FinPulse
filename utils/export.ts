import { Platform, Share } from 'react-native';
import type { Account, Category, Transaction } from '@/store/types';
import { formatDate } from './finance';

const escapeCsv = (v: string) => {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
};

export const buildCSV = (
  txs: Transaction[],
  categories: Category[],
  accounts?: Account[]
) => {
  const header = ['Date', 'Merchant', 'Type', 'Category', 'Subcategory', 'Account', 'Amount', 'Currency', 'Notes'];
  const rows = txs.map((t) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    const sub = t.subcategoryId ? categories.find((c) => c.id === t.subcategoryId) : null;
    const acct = accounts?.find((a) => a.id === t.accountId);
    return [
      formatDate(t.date),
      t.merchant ?? '',
      t.type,
      cat?.name ?? '',
      sub?.name ?? '',
      acct?.name ?? '',
      (t.type === 'expense' ? '-' : '') + t.amount.toFixed(2),
      t.currency,
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
  a.style.display = 'none';
  g.document.body.appendChild(a);
  a.click();
  // Delay cleanup so the browser can initiate the download before we revoke
  setTimeout(() => {
    a.remove();
    g.URL.revokeObjectURL(url);
  }, 150);
};

export const shareText = async (title: string, message: string) => {
  try {
    await Share.share({ title, message });
  } catch {
    // ignore
  }
};
