import { App, Notice } from 'obsidian';
import { Cleaner, ApplyResult, CleanupType, ObsidianCleanerSettings } from './types';

interface RunSummary {
  type: CleanupType;
  label: string;
  applied: number;
  skipped: number;
  errors: number;
}

export class AutoRunner {
  constructor(private app: App, private settings: ObsidianCleanerSettings) {}

  async runAll(cleaners: Cleaner[]): Promise<RunSummary[]> {
    const summaries: RunSummary[] = [];

    for (const cleaner of cleaners) {
      try {
        const { items } = await cleaner.scan();
        if (items.length === 0) continue;

        const result: ApplyResult = await cleaner.apply(items);
        summaries.push({
          type: cleaner.id,
          label: cleaner.label,
          applied: result.applied,
          skipped: result.skipped,
          errors: result.errors.length,
        });
      } catch (e) {
        console.error(`AutoRunner: error in ${cleaner.label}:`, e);
        summaries.push({
          type: cleaner.id,
          label: cleaner.label,
          applied: 0,
          skipped: 0,
          errors: 1,
        });
      }
    }

    return summaries;
  }

  showSummaryNotice(summaries: RunSummary[]): void {
    if (!this.settings.showNotifications) return;

    const totalApplied = summaries.reduce((sum, s) => sum + s.applied, 0);

    if (totalApplied === 0 && summaries.every(s => s.errors === 0)) {
      new Notice('Obsidian Cleaner: Vault is clean ✓');
      return;
    }

    const lines = summaries
      .filter(s => s.applied > 0 || s.errors > 0)
      .map(s => {
        let line = `${s.label}: ${s.applied} removed`;
        if (s.errors > 0) line += `, ${s.errors} errors`;
        return line;
      });

    new Notice(`Obsidian Cleaner:\n${lines.join('\n')}`, 6000);
  }
}
