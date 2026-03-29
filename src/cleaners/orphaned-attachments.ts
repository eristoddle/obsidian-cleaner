import { App, Notice, TFile } from 'obsidian';
import { Cleaner, CleanupItem, CleanupType, ApplyResult, ObsidianCleanerSettings } from '../types';
import { deleteFile } from '../utils/delete';

export class OrphanedAttachmentsCleaner implements Cleaner {
  readonly id: CleanupType = 'orphanedAttachments';
  readonly label = 'Orphaned Attachments';

  constructor(private app: App, private settings: ObsidianCleanerSettings) {}

  async scan(): Promise<{ items: CleanupItem[] }> {
    // Check attachment folder is configured
    const attachmentFolder = (this.app.vault as any).config?.attachmentFolderPath as string | undefined;
    if (!attachmentFolder) {
      new Notice('Obsidian Cleaner: No attachment folder configured. Set one in Obsidian Settings > Files & Links.');
      return { items: [] };
    }

    // Get all markdown content for reference checking
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const markdownContents: string[] = [];
    for (const mdFile of markdownFiles) {
      try {
        const content = await this.app.vault.cachedRead(mdFile);
        markdownContents.push(content);
      } catch {
        // skip unreadable files
      }
    }

    // Filter vault files to attachment folder + included extensions
    const allFiles = this.app.vault.getFiles();
    const normalizedFolder = attachmentFolder.endsWith('/')
      ? attachmentFolder
      : attachmentFolder + '/';

    const candidates = allFiles.filter(file => {
      const inFolder =
        file.path.startsWith(normalizedFolder) ||
        file.parent?.path === attachmentFolder;
      const extMatch = this.settings.includedExtensions.includes(
        file.extension.toLowerCase()
      );
      return inFolder && extMatch;
    });

    // Exclude referenced files
    const orphaned = candidates.filter(
      file => !this.isFileReferenced(file, markdownContents)
    );

    return {
      items: orphaned.map(file => ({
        type: this.id,
        label: file.path,
        detail: `Size: ${file.stat.size} bytes`,
        payload: file,
      })),
    };
  }

  isFileReferenced(file: TFile, markdownContents: string[]): boolean {
    const fileName = file.name;
    const baseName = file.basename;
    for (const content of markdownContents) {
      if (content.includes(fileName) || content.includes(baseName)) {
        return true;
      }
    }
    return false;
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

    return {
      applied,
      skipped: accepted.length - applied - errors.length,
      errors,
    };
  }
}
