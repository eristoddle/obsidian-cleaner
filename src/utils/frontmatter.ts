import { CachedMetadata } from 'obsidian';
import { FrontmatterRule } from '../types';

/**
 * Returns all tags from a file's cached metadata.
 * Combines frontmatter tags and inline tag objects, normalizes to lowercase without leading `#`.
 */
export function parseFrontmatterTags(cache: CachedMetadata | null): string[] {
	if (!cache) return [];

	const tags: string[] = [];

	// Frontmatter tags: can be a string or array of strings
	const fmTags = cache.frontmatter?.tags;
	if (fmTags) {
		const arr = Array.isArray(fmTags) ? fmTags : [fmTags];
		for (const t of arr) {
			if (typeof t === 'string') {
				tags.push(t.replace(/^#/, '').toLowerCase());
			}
		}
	}

	// Inline tags from cache.tags (TagCache objects with .tag property)
	if (cache.tags) {
		for (const tagCache of cache.tags) {
			tags.push(tagCache.tag.replace(/^#/, '').toLowerCase());
		}
	}

	return tags;
}

/**
 * Replaces all occurrences of sourceTag with targetTag in raw file content.
 * Handles both frontmatter YAML array entries and inline #tag occurrences.
 * sourceTag and targetTag should be without the `#` prefix.
 */
export function replaceTagInContent(content: string, sourceTag: string, targetTag: string): string {
	// Replace in frontmatter YAML array: `- sourceTag` -> `- targetTag`
	const fmTagPattern = new RegExp(`^(\\s*-\\s+)${escapeRegex(sourceTag)}(\\s*)$`, 'gm');
	let result = content.replace(fmTagPattern, `$1${targetTag}$2`);

	// Replace inline #tag with word boundary after
	const inlinePattern = new RegExp(`#${escapeRegex(sourceTag)}(?=\\s|$|[^\\w/-])`, 'g');
	result = result.replace(inlinePattern, `#${targetTag}`);

	return result;
}

/**
 * Returns true if the frontmatter matches the given FrontmatterRule.
 * - rule.value undefined: key must exist in frontmatter
 * - rule.value string: frontmatter[key] must equal value
 * - rule.value array: value must include frontmatter[key]
 */
export function matchesRule(
	frontmatter: Record<string, unknown> | null | undefined,
	rule: FrontmatterRule
): boolean {
	if (!frontmatter) return false;

	if (!(rule.key in frontmatter)) return false;

	if (rule.value === undefined) {
		return true;
	}

	const actual = frontmatter[rule.key];

	if (Array.isArray(rule.value)) {
		return rule.value.includes(actual as string);
	}

	return actual === rule.value;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
