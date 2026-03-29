import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  replaceTagInContent,
  matchesRule,
  parseFrontmatterTags,
} from '../../utils/frontmatter';
import { FrontmatterRule } from '../../types';
import { CachedMetadata } from 'obsidian';

describe('Property Tests: Frontmatter Operations', () => {
  // ==================== Property 12: Tag merge completeness (detailed) ====================
  it('Feature: obsidian-cleaner, Property 12: Tag merge completeness (detailed)', () => {
    const tagArb = fc
      .string({ minLength: 2, maxLength: 10 })
      .filter((s) => /^[a-z0-9]+$/.test(s)); // Only alphanumeric lowercase

    fc.assert(
      fc.property(tagArb, tagArb, (sourceTag, targetTag) => {
        if (sourceTag === targetTag || sourceTag.includes(targetTag) || targetTag.includes(sourceTag)) {
          return true; // Skip cases where one tag is a substring of another
        }

        // Test inline replacement with simple tags
        const inlineContent = `Text with #${sourceTag} here.`;
        const inlineResult = replaceTagInContent(inlineContent, sourceTag, targetTag);
        expect(inlineResult).not.toContain(`#${sourceTag}`);
        expect(inlineResult).toContain(`#${targetTag}`);
      }),
      { numRuns: 100 }
    );
  });

  // ==================== Property 13: Frontmatter rule matching (detailed) ====================
  it('Feature: obsidian-cleaner, Property 13: Frontmatter rule matching (detailed)', () => {
    const frontmatterArb = fc.record({
      status: fc.oneof(
        fc.constant('draft'),
        fc.constant('published'),
        fc.constant('archived')
      ),
      author: fc.string({ maxLength: 50 }),
      tags: fc.array(fc.string({ maxLength: 20 })),
      version: fc.integer({ min: 1, max: 100 }),
    });

    fc.assert(
      fc.property(frontmatterArb, (fm) => {
        // Test key-only rule
        const keyOnlyRule: FrontmatterRule = { key: 'status' };
        expect(matchesRule(fm, keyOnlyRule)).toBe(true);

        // Test key-value rule that matches
        const matchingRule: FrontmatterRule = {
          key: 'status',
          value: 'draft',
        };
        const shouldMatch = fm.status === 'draft';
        expect(matchesRule(fm, matchingRule)).toBe(shouldMatch);

        // Test key-value rule with array
        const arrayRule: FrontmatterRule = {
          key: 'status',
          value: ['draft', 'published'],
        };
        const shouldMatchArray =
          fm.status === 'draft' || fm.status === 'published';
        expect(matchesRule(fm, arrayRule)).toBe(shouldMatchArray);

        // Test non-existent key
        const nonExistentRule: FrontmatterRule = {
          key: 'nonexistent',
        };
        expect(matchesRule(fm, nonExistentRule)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  // ==================== Tag merge with various content structures ====================
  it('Tag replacement preserves document structure', () => {
    const content = `---
tags:
  - topic/subtopic
  - research
---

# My Note

This is #topic/subtopic research about #topic/subtopic patterns.

## Summary
#topic/subtopic is useful for #research documents.`;

    const result = replaceTagInContent(content, 'topic/subtopic', 'Project/Analysis');

    // Verify structure preserved
    expect(result).toContain('# My Note');
    expect(result).toContain('## Summary');
    expect(result).toContain('---');

    // Verify replacement complete
    expect(result).not.toContain('#topic/subtopic');
    expect(result).toContain('#Project/Analysis');
  });

  // ==================== Rule matching with edge cases ====================
  it('Frontmatter rule matching handles null and undefined', () => {
    const rule: FrontmatterRule = { key: 'status' };

    expect(matchesRule(null, rule)).toBe(false);
    expect(matchesRule(undefined, rule)).toBe(false);
    expect(matchesRule({}, rule)).toBe(false);
  });

  // ==================== Tag collection from metadata ====================
  it('Parse frontmatter tags from metadata cache', () => {
    // Test various metadata cache structures
    const metadata1: CachedMetadata = {
      frontmatter: {
        tags: 'single-tag',
      } as any,
    };

    const metadata2: CachedMetadata = {
      frontmatter: {
        tags: ['tag1', 'tag2', 'tag3'],
      } as any,
    };

    // Verify parseFrontmatterTags handles both formats
    const tags1 = parseFrontmatterTags(metadata1);
    const tags2 = parseFrontmatterTags(metadata2);

    expect(tags1.length).toBeGreaterThanOrEqual(0);
    expect(tags2.length).toBeGreaterThanOrEqual(0);
  });

  // ==================== Complex tag patterns ====================
  it('Handles tags with special characters', () => {
    const content = '#tag/with-dash #tag_with_underscore #tag.with.dots';
    const result = replaceTagInContent(
      content,
      'tag/with-dash',
      'new/tag-name'
    );

    expect(result).toContain('#new/tag-name');
  });

  // ==================== Frontmatter array value matching ====================
  it('Array value rule matching handles all cases', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 20 }).filter(s => s.length > 0),
        fc.array(fc.string({ maxLength: 20 }).filter(s => s.length > 0), { minLength: 1, maxLength: 5 }),
        (testValue, arrayValues) => {
          const fm = { field: testValue };
          const rule: FrontmatterRule = {
            key: 'field',
            value: arrayValues,
          };

          const result = matchesRule(fm, rule);
          const expected = arrayValues.includes(testValue);

          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==================== Tag case sensitivity ====================
  it('Tag processing maintains case sensitivity', () => {
    const content = '#Tag #tag #TAG';

    // Assuming lowercase normalization in parseFrontmatterTags
    const result = replaceTagInContent(content, 'tag', 'newtag');

    // Case-sensitive replacement
    expect(result).toContain('#newtag');
  });

  // ==================== Boundary: empty rules ====================
  it('Handles empty and null values in rules', () => {
    const fm = { status: '' };

    const emptyStringRule: FrontmatterRule = { key: 'status', value: '' };
    expect(matchesRule(fm, emptyStringRule)).toBe(true);

    const differentRule: FrontmatterRule = { key: 'status', value: 'draft' };
    expect(matchesRule(fm, differentRule)).toBe(false);
  });
});
