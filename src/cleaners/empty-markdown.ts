import { App, TFile } from 'obsidian';
import { Cleaner, CleanupItem, CleanupType, ApplyResult, ObsidianCleanerSettings } from '../types';
import { deleteFile } from '../utils/delete';

export function isEmptyMarkdown(file: TFile): boolean {
  return file.stat.size === 0;
}

export class EmptyMarkdownCleaner implements Cleaner {
  readonly id: CleanupType = 'emptyMarkdownFiles';
  readonly label = 'Empty Markdown Files';

  constructor(private app: App, private settings: ObsidianCleanerSettings) {}

  async scan(): Promise<{ items: CleanupItem[] }> {
    const emptyFiles = this.app.vault.getMarkdownFiles().filter(f => f.stat.size === 0);
    return {
      items: emptyFiles.map(file => ({
        type: this.id,
        label: file.path,
        payload: file,
      })),
    };
  }

  async apply(accepted: CleanupItem[]): Promise<ApplyResult> {
    let applied = 0;
    const errors: string[] = [];
    for (const item of accepted) {
      const file = item.payload as TFile;
      try {
        await deleteFile(this.app, file, this.settings.deletionMode);
        applied++;
      } catch (e) {
        const msg = `Failed to delete ${file.path}: ${e}`;
        console.error(msg);
        errors.push(msg);
      }
    }
    return { applied, skipped: accepted.length - applied - errors.length, errors };
  }
}
