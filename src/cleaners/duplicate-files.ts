import { App, TFile } from 'obsidian';
import { Cleaner, CleanupItem, CleanupType, ApplyResult, ObsidianCleanerSettings } from '../types';
import { deleteFile } from '../utils/delete';

// Matches: <base name> <N>.md where N is one or more digits
// e.g. "Note 1.md", "My Note 23.md"
const DUPLICATE_PATTERN = /^(.+) (\d+)\.md$/;

/**
 * Returns true if the filename matches the pattern `<base name> <N>.md`
 * where N is one or more digits.
 */
export function isDuplicateFile(name: string): boolean {
  return DUPLICATE_PATTERN.test(name);
}

/**
 * Extracts the base name from a duplicate filename.
 * e.g. "Note 1.md" → "Note", "My Note 23.md" → "My Note"
 * Returns null if the name does not match the duplicate pattern.
 */
export function extractDuplicateBaseName(name: string): string | null {
  const match = name.match(DUPLICATE_PATTERN);
  return match ? match[1] : null;
}

export class DuplicateFilesCleaner implements Cleaner {
  readonly id: CleanupType = 'duplicateFiles';
  readonly label = 'Duplicate Files';

  constructor(private app: App, private settings: ObsidianCleanerSettings) {}

  async scan(): Promise<{ items: CleanupItem[] }> {
    const allFiles = this.app.vault.getMarkdownFiles();
    const items: CleanupItem[] = [];

    for (const file of allFiles) {
      if (!isDuplicateFile(file.name)) continue;

      const baseName = extractDuplicateBaseName(file.name);
      if (!baseName) continue;

      const folder = file.parent?.path ?? '';
      const originalPath = folder ? `${folder}/${baseName}.md` : `${baseName}.md`;
      const original = this.app.vault.getAbstractFileByPath(originalPath);

      // Only flag as duplicate if the original <base name>.md exists in the same folder
      if (!(original instanceof TFile)) continue;

      items.push({
        type: this.id,
        label: `${file.name} (duplicate of ${original.path})`,
        detail: `Last modified: ${new Date(file.stat.mtime).toLocaleString()}`,
        payload: file,
      });
    }

    return { items };
  }

  async apply(accepted: CleanupItem[]): Promise<ApplyResult> {
    let applied = 0;
    const errors: string[] = [];

    for (const item of accepted) {
      const file = item.payload as TFile;

      // Safety assertion: the accepted file must itself be a duplicate (not an original).
      // An original would not match the duplicate pattern.
      if (!isDuplicateFile(file.name)) {
        const msg = `Refusing to delete ${file.path}: file is not a duplicate (original file guard)`;
        console.error(msg);
        errors.push(msg);
        continue;
      }

      try {
        await deleteFile(this.app, file, this.settings.deletionMode);
        applied++;
      } catch (e) {
        const msg = `Failed to delete ${file.path}: ${e}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    return {
      applied,
      skipped: accepted.length - applied - errors.length,
      errors,
    };
  }
}
