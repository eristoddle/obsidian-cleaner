import { describe, it, expect } from 'vitest';
import { levenshtein } from '../../utils/levenshtein';
import {
  replaceTagInContent,
  matchesRule,
} from '../../utils/frontmatter';
import { FrontmatterRule } from '../../types';

describe('Unit: Levenshtein Distance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('hello', 'hello')).toBe(0);
  });

  it('returns string length when comparing with empty string', () => {
    expect(levenshtein('hello', '')).toBe(5);
    expect(levenshtein('', 'world')).toBe(5);
  });

  it('calculates single substitution', () => {
    expect(levenshtein('cat', 'hat')).toBe(1);
  });

  it('calculates single insertion', () => {
    expect(levenshtein('cat', 'cart')).toBe(1);
  });

  it('calculates single deletion', () => {
    expect(levenshtein('cart', 'cat')).toBe(1);
  });

  it('calculates multiple operations', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('handles case sensitivity', () => {
    expect(levenshtein('Hello', 'hello')).toBe(1);
  });

  it('is symmetric', () => {
    expect(levenshtein('abc', 'def')).toBe(levenshtein('def', 'abc'));
  });
});

describe('Unit: Frontmatter Utilities', () => {
  describe('replaceTagInContent', () => {
    it('replaces tag in frontmatter YAML array', () => {
      const content = 'tags:\n  - oldtag\n  - other\nContent here';
      const result = replaceTagInContent(content, 'oldtag', 'newtag');
      expect(result).toContain('newtag');
      expect(result).not.toContain('oldtag');
    });

    it('replaces inline tags', () => {
      const content = 'This is #oldtag and more text.';
      const result = replaceTagInContent(content, 'oldtag', 'newtag');
      expect(result).toContain('#newtag');
      expect(result).not.toContain('#oldtag');
    });

    it('preserves content structure', () => {
      const content = 'Before #oldtag after.';
      const result = replaceTagInContent(content, 'oldtag', 'newtag');
      expect(result).toContain('Before');
      expect(result).toContain('after');
    });

    it('handles multiple occurrences', () => {
      const content = '#oldtag is cool, #oldtag is nice.';
      const result = replaceTagInContent(content, 'oldtag', 'newtag');
      expect(result).not.toContain('oldtag');
      expect((result.match(/#newtag/g) || []).length).toBe(2);
    });

    it('preserves word boundaries after tag', () => {
      const content = '#oldtag and #oldtag here';
      const result = replaceTagInContent(content, 'oldtag', 'newtag');
      expect(result).toContain('#newtag');
      expect(result).not.toContain('#oldtag');
    });
  });

  describe('matchesRule', () => {
    it('matches rule with only key specified', () => {
      const frontmatter = { status: 'draft', title: 'Test' };
      const rule: FrontmatterRule = { key: 'status' };
      expect(matchesRule(frontmatter, rule)).toBe(true);
    });

    it('rejects when key does not exist', () => {
      const frontmatter = { title: 'Test' };
      const rule: FrontmatterRule = { key: 'status' };
      expect(matchesRule(frontmatter, rule)).toBe(false);
    });

    it('matches rule with string value', () => {
      const frontmatter = { status: 'draft' };
      const rule: FrontmatterRule = { key: 'status', value: 'draft' };
      expect(matchesRule(frontmatter, rule)).toBe(true);
    });

    it('rejects rule with non-matching string value', () => {
      const frontmatter = { status: 'published' };
      const rule: FrontmatterRule = { key: 'status', value: 'draft' };
      expect(matchesRule(frontmatter, rule)).toBe(false);
    });

    it('matches rule with value in array', () => {
      const frontmatter = { type: 'note' };
      const rule: FrontmatterRule = {
        key: 'type',
        value: ['note', 'draft', 'archived'],
      };
      expect(matchesRule(frontmatter, rule)).toBe(true);
    });

    it('rejects rule with value not in array', () => {
      const frontmatter = { type: 'other' };
      const rule: FrontmatterRule = {
        key: 'type',
        value: ['note', 'draft'],
      };
      expect(matchesRule(frontmatter, rule)).toBe(false);
    });

    it('handles null frontmatter', () => {
      const rule: FrontmatterRule = { key: 'status' };
      expect(matchesRule(null, rule)).toBe(false);
    });

    it('handles undefined frontmatter', () => {
      const rule: FrontmatterRule = { key: 'status' };
      expect(matchesRule(undefined, rule)).toBe(false);
    });
  });
});
