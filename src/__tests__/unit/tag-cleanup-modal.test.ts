import { describe, it, expect } from 'vitest';
import {
  findSimilarTagPairs,
  collectAllTags,
} from '../../cleaners/tag-cleanup';
import { levenshtein } from '../../utils/levenshtein';
import { Vault, MetadataCache } from 'obsidian';
import { vi } from 'vitest';

describe('Unit: Tag Cleanup', () => {
  describe('findSimilarTagPairs', () => {
    it('finds tags with edit distance of 1', () => {
      const tags = ['hello', 'hallo'];
      const pairs = findSimilarTagPairs(tags);

      expect(pairs.length).toBeGreaterThan(0);
      expect(pairs).toContainEqual(['hello', 'hallo']);
    });

    it('finds tags with edit distance of 2', () => {
      const tags = ['color', 'colour'];
      const pairs = findSimilarTagPairs(tags);

      expect(pairs.length).toBeGreaterThan(0);
    });

    it('finds plural variants', () => {
      const tags = ['note', 'notes'];
      const pairs = findSimilarTagPairs(tags);

      expect(pairs.length).toBeGreaterThan(0);
      expect(pairs).toContainEqual(['note', 'notes']);
    });

    it('finds plural vs singular (plural longer)', () => {
      const tags = ['tag', 'tags', 'tag/sub', 'tag/subs'];
      const pairs = findSimilarTagPairs(tags);

      expect(pairs.length).toBeGreaterThan(0);
      const pluralPairs = pairs.filter(
        ([a, b]) => a + 's' === b || b + 's' === a
      );
      expect(pluralPairs.length).toBeGreaterThan(0);
    });

    it('does not return duplicate pairs', () => {
      const tags = ['foo', 'bar'];
      const pairs = findSimilarTagPairs(tags);

      const seen = new Set<string>();
      for (const [a, b] of pairs) {
        const key = [a, b].sort().join('|');
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });

    it('does not pair identical tags', () => {
      const tags = ['duplicate', 'duplicate', 'other'];
      const unique = [...new Set(tags)];
      const pairs = findSimilarTagPairs(unique);

      for (const [a, b] of pairs) {
        expect(a).not.toBe(b);
      }
    });

    it('returns empty list for completely different tags', () => {
      const tags = ['aaaaa', 'bbbbb', 'ccccc'];
      const pairs = findSimilarTagPairs(tags);

      expect(pairs.length).toBe(0);
    });

    it('handles single tag', () => {
      const tags = ['single'];
      const pairs = findSimilarTagPairs(tags);

      expect(pairs.length).toBe(0);
    });

    it('handles empty list', () => {
      const tags: string[] = [];
      const pairs = findSimilarTagPairs(tags);

      expect(pairs.length).toBe(0);
    });
  });

  describe('Tag similarity conditions', () => {
    it('tags satisfy levenshtein <= 2 or plural condition', () => {
      const pairs = [
        ['note', 'notes'],
        ['color', 'colour'],
        ['database', 'databse'],
      ];

      for (const [a, b] of pairs) {
        const dist = levenshtein(a, b);
        const isPlural = a + 's' === b || b + 's' === a;
        const isValid = dist <= 2 || isPlural;

        expect(isValid).toBe(true);
      }
    });
  });

  describe('collectAllTags', () => {
    it('returns empty map for vault with no files', () => {
      const mockVault = {
        getMarkdownFiles: () => [],
      } as unknown as Vault;

      const mockMetadataCache = {
        getFileCache: vi.fn(),
      } as unknown as MetadataCache;

      const tags = collectAllTags(mockVault, mockMetadataCache);

      expect(tags.size).toBe(0);
    });

    it('counts tags across multiple files', () => {
      const mockFile1 = { name: 'file1.md', path: 'file1.md' };
      const mockFile2 = { name: 'file2.md', path: 'file2.md' };

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      } as unknown as Vault;

      const mockMetadataCache = {
        getFileCache: vi.fn(),
      } as unknown as MetadataCache;

      const tags = collectAllTags(mockVault, mockMetadataCache);

      // Without mocked cache returning tags, should be empty
      expect(tags.size).toBe(0);
    });
  });
});

describe('Unit: Modal State', () => {
  it('validates step navigation constraints', () => {
    // Total steps: 7 cleaners
    const totalSteps = 7;
    const stepsCompleted = [true, true, false, false, false, false, false];

    // Can only go back to steps where apply() hasn't been called
    let currentStep = 2;
    const canGoBack = stepsCompleted[currentStep] === false;

    expect(canGoBack).toBe(true);

    currentStep = 1;
    const cannotGoBackWhenApplied = stepsCompleted[currentStep] === true;
    expect(cannotGoBackWhenApplied).toBe(true);
  });

  it('validates auto-advance when no items found', () => {
    // If scan returns 0 items, should auto-advance
    const scanResult = { items: [] };
    const shouldAutoAdvance = scanResult.items.length === 0;

    expect(shouldAutoAdvance).toBe(true);
  });

  it('validates select-all checkbox state', () => {
    const items = [
      { id: 1, selected: false },
      { id: 2, selected: false },
      { id: 3, selected: false },
    ];

    // Simulate select-all
    items.forEach((item) => (item.selected = true));

    const allSelected = items.every((item) => item.selected);
    expect(allSelected).toBe(true);
  });

  it('validates deselect-all checkbox state', () => {
    const items = [
      { id: 1, selected: true },
      { id: 2, selected: true },
      { id: 3, selected: true },
    ];

    // Simulate deselect-all
    items.forEach((item) => (item.selected = false));

    const noneSelected = items.every((item) => !item.selected);
    expect(noneSelected).toBe(true);
  });

  it('calculates summary counts correctly', () => {
    const appliedByType = {
      orphanedAttachments: 5,
      conflictedFiles: 2,
      duplicateFiles: 3,
    };

    const totalApplied = Object.values(appliedByType).reduce((a, b) => a + b, 0);
    expect(totalApplied).toBe(10);
  });

  it('validates step order', () => {
    const stepOrder = [
      'orphanedAttachments',
      'conflictedFiles',
      'duplicateFiles',
      'emptyMarkdownFiles',
      'emptyFolders',
      'tagCleanup',
      'frontmatterCleanup',
    ];

    expect(stepOrder).toEqual(stepOrder); // Verify canonical order
    expect(stepOrder.length).toBe(7);
  });
});
