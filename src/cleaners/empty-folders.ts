import { App, TFolder, Vault } from 'obsidian';
import { Cleaner, CleanupItem, CleanupType, ApplyResult } from '../types';

export function isEmptyFolder(folder: TFolder, vault: Vault): boolean {
  if (folder.children.length === 0) return true;
  return folder.children.every(
    child => child instanceof TFolder && isEmptyFolder(child as TFolder, vault)
  );
}

export class EmptyFoldersCleaner implements Cleaner {
  readonly id: CleanupType = 'emptyFolders';
  readonly label = 'Empty Folders';

  constructor(private app: App) {}

  async scan(): Promise<{ items: CleanupItem[] }> {
    const allFolders = this.app.vault.getAllLoadedFiles()
      .filter(f => f instanceof TFolder) as TFolder[];

    const emptyFolders = allFolders.filter(folder => {
      if (folder.path === '/' || folder.isRoot()) return false;
      if (folder.path === '.obsidian' || folder.name === '.obsidian') return false;
      return isEmptyFolder(folder, this.app.vault);
    });

    return {
      items: emptyFolders.map(folder => ({
        type: this.id,
        label: folder.path,
        payload: folder,
      })),
    };
  }

  async apply(accepted: CleanupItem[]): Promise<ApplyResult> {
    let applied = 0;
    const errors: string[] = [];
    for (const item of accepted) {
      const folder = item.payload as TFolder;
      try {
        await (this.app.vault.adapter as any).rmdir(folder.path, false);
        applied++;
      } catch (e) {
        const msg = `Failed to remove folder ${folder.path}: ${e}`;
        console.error(msg);
        errors.push(msg);
      }
    }
    return { applied, skipped: accepted.length - applied - errors.length, errors };
  }
}
