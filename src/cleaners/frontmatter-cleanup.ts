import { App, TFile } from 'obsidian';
import { Cleaner, CleanupItem, CleanupType, ApplyResult, ObsidianCleanerSettings } from '../types';
import { matchesRule } from '../utils/frontmatter';
import { deleteFile } from '../utils/delete';

export class FrontmatterCleanupCleaner implements Cleaner {
	readonly id: CleanupType = 'frontmatterCleanup';
	readonly label = 'Frontmatter Cleanup';

	constructor(private app: App, private settings: ObsidianCleanerSettings) {}

	async scan(): Promise<{ items: CleanupItem[] }> {
		const items: CleanupItem[] = [];
		const seen = new Set<string>();

		for (const rule of this.settings.frontmatterRules) {
			for (const file of this.app.vault.getMarkdownFiles()) {
				if (seen.has(file.path)) continue;

				const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
				if (!matchesRule(frontmatter, rule)) continue;

				seen.add(file.path);

				const valueStr = rule.value
					? `, value="${Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}"`
					: '';

				items.push({
					type: this.id,
					label: file.path,
					detail: `Matches rule: key="${rule.key}"${valueStr}`,
					payload: file,
				});
			}
		}

		return { items };
	}

	async apply(accepted: CleanupItem[]): Promise<ApplyResult> {
		let applied = 0;
		let skipped = 0;
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
				skipped++;
			}
		}

		return { applied, skipped, errors };
	}
}
