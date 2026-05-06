import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { BackupData } from '@/store/useAppStore';

export const CURRENT_BACKUP_SCHEMA: BackupData['schemaVersion'] = 1;

/**
 * Build the JSON payload for a full FinPulse backup.
 */
export const buildBackupJSON = (data: Omit<BackupData, 'schemaVersion' | 'app' | 'exportedAt'>) => {
  const payload: BackupData = {
    schemaVersion: CURRENT_BACKUP_SCHEMA,
    app: 'finpulse',
    exportedAt: new Date().toISOString(),
    ...data,
  };
  return JSON.stringify(payload, null, 2);
};

/**
 * Parse and validate a backup file's JSON contents. Throws on invalid input.
 */
export const parseBackupJSON = (text: string): BackupData => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Backup file is empty or malformed.');
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.app !== 'finpulse') {
    throw new Error('This file was not created by FinPulse.');
  }
  if (typeof obj.schemaVersion !== 'number') {
    throw new Error('Backup is missing a schema version.');
  }
  if (obj.schemaVersion !== CURRENT_BACKUP_SCHEMA) {
    throw new Error(`Unsupported backup version ${obj.schemaVersion}.`);
  }
  return parsed as BackupData;
};

/**
 * Trigger a browser download for the given filename and text contents.
 * Web-only — returns false on native.
 */
const downloadWeb = (filename: string, content: string, mime: string) => {
  if (Platform.OS !== 'web') return false;
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
  return true;
};

/**
 * Save a text file to the user's device. On web triggers a browser download.
 * On native writes to the cache directory and opens the native share sheet
 * (via expo-sharing) so the user can save the file to Drive / iCloud / email / etc.
 */
export const saveTextFile = async (
  filename: string,
  content: string,
  mime: string
): Promise<{ ok: true; uri?: string } | { ok: false; error: string }> => {
  try {
    if (Platform.OS === 'web') {
      downloadWeb(filename, content, mime);
      return { ok: true };
    }

    // Write file content to cache directory
    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(content);

    // Use expo-sharing to open the native share sheet with the actual file
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { ok: false, error: 'Sharing is not available on this device.' };
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: mime,
      dialogTitle: filename,
      UTI: mime === 'text/csv' ? 'public.comma-separated-values-text' : 'public.json',
    });

    return { ok: true, uri: file.uri };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // User dismissing the share sheet throws on some platforms — not an error
    if (msg.includes('dismissed') || msg.includes('cancel')) {
      return { ok: true, uri: undefined };
    }
    return { ok: false, error: msg };
  }
};

export const backupFilename = (ext: 'json' | 'csv' = 'json') => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `finpulse_backup_${yyyy}-${mm}-${dd}.${ext}`;
};
