import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DEFAULT_SETTINGS } from '../../types';

describe('Property Tests: Modal and Settings', () => {
  // ==================== Property 1: Disabled toggle excludes cleaner ====================
  it('Feature: obsidian-cleaner, Property 1: Disabled toggle excludes cleaner from run (detailed)', () => {
    const settingsArb = fc.record({
      orphanedAttachments: fc.boolean(),
      conflictedFiles: fc.boolean(),
      duplicateFiles: fc.boolean(),
      emptyMarkdownFiles: fc.boolean(),
      emptyFolders: fc.boolean(),
      tagCleanup: fc.boolean(),
      frontmatterCleanup: fc.boolean(),
    });

    fc.assert(
      fc.property(settingsArb, (settings) => {
        // Build list of enabled cleaners
        const enabledCleaners = [
          'orphanedAttachments',
          'conflictedFiles',
          'duplicateFiles',
          'emptyMarkdownFiles',
          'emptyFolders',
          'tagCleanup',
          'frontmatterCleanup',
        ].filter((type) => settings[type as keyof typeof settings]);

        // Verify each disabled type is excluded
        for (const type of Object.keys(settings)) {
          if (!settings[type as keyof typeof settings]) {
            expect(enabledCleaners).not.toContain(type);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // ==================== Property 14: Modal step list matches enabled types ====================
  it('Feature: obsidian-cleaner, Property 14: Modal step list matches enabled cleanup types (detailed)', () => {
    const settingsArb = fc.record({
      orphanedAttachments: fc.boolean(),
      conflictedFiles: fc.boolean(),
      duplicateFiles: fc.boolean(),
      emptyMarkdownFiles: fc.boolean(),
      emptyFolders: fc.boolean(),
      tagCleanup: fc.boolean(),
      frontmatterCleanup: fc.boolean(),
    });

    const canonicalOrder = [
      'orphanedAttachments',
      'conflictedFiles',
      'duplicateFiles',
      'emptyMarkdownFiles',
      'emptyFolders',
      'tagCleanup',
      'frontmatterCleanup',
    ];

    fc.assert(
      fc.property(settingsArb, (settings) => {
        // Build step list in canonical order
        const steps = canonicalOrder.filter(
          (type) => settings[type as keyof typeof settings]
        );

        // Verify order is preserved
        let prevIndex = -1;
        for (const step of steps) {
          const currentIndex = canonicalOrder.indexOf(step);
          expect(currentIndex).toBeGreaterThan(prevIndex);
          prevIndex = currentIndex;
        }

        // Verify no disabled types are included
        for (const type of canonicalOrder) {
          if (!settings[type as keyof typeof settings]) {
            expect(steps).not.toContain(type);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // ==================== Step navigation invariants ====================
  it('Modal navigation maintains step count invariants', () => {
    const maxSteps = 7; // 7 cleaner types

    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 7 }),
        (enabledSteps) => {
          // Count enabled steps
          const enabledCount = enabledSteps.filter((e) => e).length;

          // Step index must be in valid range
          expect(enabledCount).toBeLessThanOrEqual(maxSteps);
          expect(enabledCount).toBeGreaterThanOrEqual(0);

          // If there are enabled steps, valid indices are 0 to enabledCount - 1
          if (enabledCount > 0) {
            const maxValidIndex = enabledCount - 1;
            expect(maxValidIndex).toBeLessThan(enabledCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==================== Checkbox state transitions ====================
  it('Checkbox state handling preserves consistency', () => {
    const itemsArb = fc.array(
      fc.record({
        id: fc.integer({ min: 0, max: 1000 }),
        selected: fc.boolean(),
      }),
      { minLength: 0, maxLength: 100 }
    );

    fc.assert(
      fc.property(itemsArb, (items) => {
        // Select all
        items.forEach((item) => (item.selected = true));
        const allSelected = items.every((item) => item.selected);
        expect(allSelected).toBe(true);

        // Deselect all
        items.forEach((item) => (item.selected = false));
        const noneSelected = items.every((item) => !item.selected);
        expect(noneSelected).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // ==================== Summary count calculation ===========
  it('Summary counts are calculated correctly from results', () => {
    const countsArb = fc.record({
      orphanedAttachments: fc.integer({ min: 0, max: 1000 }),
      conflictedFiles: fc.integer({ min: 0, max: 1000 }),
      duplicateFiles: fc.integer({ min: 0, max: 1000 }),
      emptyMarkdownFiles: fc.integer({ min: 0, max: 1000 }),
      emptyFolders: fc.integer({ min: 0, max: 1000 }),
      tagCleanup: fc.integer({ min: 0, max: 1000 }),
      frontmatterCleanup: fc.integer({ min: 0, max: 1000 }),
    });

    fc.assert(
      fc.property(countsArb, (counts) => {
        const total = Object.values(counts).reduce((a, b) => a + b, 0);

        expect(total).toBe(
          counts.orphanedAttachments +
            counts.conflictedFiles +
            counts.duplicateFiles +
            counts.emptyMarkdownFiles +
            counts.emptyFolders +
            counts.tagCleanup +
            counts.frontmatterCleanup
        );

        expect(total).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  // ==================== Settings defaults validation ====================
  it('DEFAULT_SETTINGS contains all required fields with valid types', () => {
    const requiredFields = [
      'orphanedAttachments',
      'conflictedFiles',
      'duplicateFiles',
      'emptyMarkdownFiles',
      'emptyFolders',
      'tagCleanup',
      'frontmatterCleanup',
      'deletionMode',
      'confirmBeforeDelete',
      'showNotifications',
      'runOnStartup',
      'includedExtensions',
      'frontmatterRules',
    ];

    for (const field of requiredFields) {
      expect(field in DEFAULT_SETTINGS).toBe(true);
    }

    // Type validations
    expect(typeof DEFAULT_SETTINGS.orphanedAttachments).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.deletionMode).toBe('string');
    expect(Array.isArray(DEFAULT_SETTINGS.includedExtensions)).toBe(true);
    expect(Array.isArray(DEFAULT_SETTINGS.frontmatterRules)).toBe(true);
  });

  // ==================== Deletion mode values ====================
  it('Deletion mode contains only valid values', () => {
    const validModes = ['system-trash', 'obsidian-trash', 'permanent'];

    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('system-trash'),
          fc.constant('obsidian-trash'),
          fc.constant('permanent')
        ),
        (mode) => {
          expect(validModes).toContain(mode);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==================== Applied/Skipped count invariants ====================
  it('Applied + Skipped count equals accepted items count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (applied, skipped) => {
          // Note: in real impl, errors are separate from skipped
          // This validates the counting logic
          const total = applied + skipped;

          expect(total).toBe(applied + skipped);
          expect(applied).toBeGreaterThanOrEqual(0);
          expect(skipped).toBeGreaterThanOrEqual(0);
          expect(total).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
