import { App, TFile } from 'obsidian';
import { Cleaner, CleanupItem, CleanupType, ApplyResult, ObsidianCleanerSettings } from '../types';
import { deleteFile } from '../utils/delete';

export interface ConflictedPayload {
  conflicted: TFile;
  original: TFile | null;
  action: 'use-conflicted' | 'use-original' | 'skip';
}

// Matches: <base name> (<any text>'s conflicted copy<optional date>).md
// Case-insensitive on "conflicted copy"
const CONFLICTED_PATTERN = /^(.+) \([^)]*'s conflicted copy[^)]*\)\.md$/i;

export function isConflictedFile(name: string): boolean {
  return CONFLICTED_PATTERN.test(name);
}

function extractBaseName(name: string): string | null {
  const match = name.match(CONFLICTED_PATTERN);
  return match ? match[1] : null;
}

export class ConflictedFilesCleaner implements Cleaner {
  readonly id: CleanupType = 'conflictedFiles';
  readonly label = 'Conflicted Files';

  constructor(private app: App, private settings: ObsidianCleanerSettings) {}

  async scan(): Promise<{ items: CleanupItem[] }> {
    const allFiles = this.app.vault.getMarkdownFiles();
    const items: CleanupItem[] = [];

    for (const file of allFiles) {
      if (!isConflictedFile(file.name)) continue;

      const baseName = extractBaseName(file.name);
      if (!baseName) continue;

      const folder = file.parent?.path ?? '';
      const originalPath = folder ? `${folder}/${baseName}.md` : `${baseName}.md`;
      const original = this.app.vault.getAbstractFileByPath(originalPath);
      const originalFile = original instanceof TFile ? original : null;

      const payload: ConflictedPayload = {
        conflicted: file,
        original: originalFile,
        action: 'use-original',
      };

      items.push({
        type: this.id,
        label: file.path,
        detail: originalFile
          ? `Conflicts with: ${originalFile.path}`
          : `No original found for: ${originalPath}`,
        payload,
      });
    }

    return { items };
  }

  async apply(accepted: CleanupItem[]): Promise<ApplyResult> {
    let applied = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of accepted) {
      const payload = item.payload as ConflictedPayload;
      const { conflicted, original, action } = payload;

      try {
        if (action === 'skip') {
          skipped++;
          continue;
        }

        if (action === 'use-conflicted') {
          if (original) {
            // Overwrite original with conflicted content, then delete conflicted
            const content = await this.app.vault.read(conflicted);
            await this.app.vault.modify(original, content);
            await deleteFile(this.app, conflicted, this.settings.deletionMode);
          } else {
            // No original exists — rename conflicted file to the base name
            const baseName = extractBaseName(conflicted.name);
            if (baseName) {
              const folder = conflicted.parent?.path ?? '';
              const newPath = folder ? `${folder}/${baseName}.md` : `${baseName}.md`;
              await this.app.fileManager.renameFile(conflicted, newPath);
            } else {
              await deleteFile(this.app, conflicted, this.settings.deletionMode);
            }
          }
          applied++;
        } else {
          // use-original: delete the conflicted file
          await deleteFile(this.app, conflicted, this.settings.deletionMode);
          applied++;
        }
      } catch (e) {
        const msg = `Failed to process ${conflicted.path}: ${e}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    return { applied, skipped, errors };
  }
}
