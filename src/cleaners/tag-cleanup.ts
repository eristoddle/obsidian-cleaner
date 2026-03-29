import { App, MetadataCache, Vault } from 'obsidian';
import { Cleaner, CleanupItem, CleanupType, ApplyResult, ObsidianCleanerSettings } from '../types';
import { levenshtein } from '../utils/levenshtein';
import { parseFrontmatterTags, replaceTagInContent } from '../utils/frontmatter';

export interface TagMergePayload {
	sourceTag: string;   // tag to replace
	targetTag: string;   // tag to keep
	affectedFiles: string[]; // paths of files containing sourceTag
}

/**
 * Gathers all tags from frontmatter and inline occurrences across all markdown files.
 * Returns a Map of tag → count of files containing that tag.
 */
export function collectAllTags(vault: Vault, metadataCache: MetadataCache): Map<string, number> {
	const tagCounts = new Map<string, number>();

	for (const file of vault.getMarkdownFiles()) {
		const cache = metadataCache.getFileCache(file);
		const tags = parseFrontmatterTags(cache);

		// Use a Set to count each tag only once per file
		const uniqueTags = new Set(tags);
		for (const tag of uniqueTags) {
			tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
		}
	}

	return tagCounts;
}

/**
 * Returns pairs [a, b] where levenshtein(a, b) <= 2 OR a + 's' === b OR b + 's' === a.
 * Avoids duplicate pairs and skips pairs where a === b.
 */
export function findSimilarTagPairs(tags: string[]): Array<[string, string]> {
	const pairs: Array<[string, string]> = [];

	for (let i = 0; i < tags.length; i++) {
		for (let j = i + 1; j < tags.length; j++) {
			const a = tags[i];
			const b = tags[j];

			if (a === b) continue;

			const isPlural = a + 's' === b || b + 's' === a;
			const isSimilar = levenshtein(a, b) <= 2;

			if (isPlural || isSimilar) {
				pairs.push([a, b]);
			}
		}
	}

	return pairs;
}

export class TagCleanupCleaner implements Cleaner {
	readonly id: CleanupType = 'tagCleanup';
	readonly label = 'Tag Cleanup';

	constructor(private app: App, private settings: ObsidianCleanerSettings) {}

	async scan(): Promise<{ items: CleanupItem[] }> {
		const tagCounts = collectAllTags(this.app.vault, this.app.metadataCache);
		const tags = Array.from(tagCounts.keys());
		const pairs = findSimilarTagPairs(tags);

		const items: CleanupItem[] = [];

		for (const [tagA, tagB] of pairs) {
			const countA = tagCounts.get(tagA) ?? 0;
			const countB = tagCounts.get(tagB) ?? 0;

			// Collect files containing tagA
			const affectedFiles: string[] = [];
			for (const file of this.app.vault.getMarkdownFiles()) {
				const cache = this.app.metadataCache.getFileCache(file);
				const fileTags = parseFrontmatterTags(cache);
				if (fileTags.includes(tagA)) {
					affectedFiles.push(file.path);
				}
			}

			const payload: TagMergePayload = {
				sourceTag: tagA,
				targetTag: tagB,
				affectedFiles,
			};

			items.push({
				type: this.id,
				label: `"${tagA}" → "${tagB}" (${countA} notes)`,
				detail: `Similar to: ${tagB} (${countB} notes)`,
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
			const { sourceTag, targetTag, affectedFiles } = item.payload as TagMergePayload;

			for (const filePath of affectedFiles) {
				try {
					const file = this.app.vault.getAbstractFileByPath(filePath);
					if (!file) {
						skipped++;
						continue;
					}

					const content = await this.app.vault.read(file as import('obsidian').TFile);
					const updated = replaceTagInContent(content, sourceTag, targetTag);
					await this.app.vault.modify(file as import('obsidian').TFile, updated);
					applied++;
				} catch (e) {
					const msg = `Failed to update tag in ${filePath}: ${e}`;
					console.error(msg);
					errors.push(msg);
				}
			}
		}

		return { applied, skipped, errors };
	}
}
