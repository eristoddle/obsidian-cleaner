import { App, TFile } from 'obsidian';
import { DeletionMode } from '../types';

/**
 * Deletes a file using the configured deletion mode.
 * - system-trash: app.vault.trash(file, true)
 * - obsidian-trash: app.vault.trash(file, false)
 * - permanent: app.vault.delete(file)
 */
export async function deleteFile(app: App, file: TFile, mode: DeletionMode): Promise<void> {
  switch (mode) {
    case 'system-trash':
      await app.vault.trash(file, true);
      break;
    case 'obsidian-trash':
      await app.vault.trash(file, false);
      break;
    case 'permanent':
      await app.vault.delete(file);
      break;
  }
}
