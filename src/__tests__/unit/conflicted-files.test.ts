import { describe, it, expect } from 'vitest';
import { isConflictedFile } from '../../cleaners/conflicted-files';

describe('Unit: Conflicted Files Cleaner', () => {
  describe('isConflictedFile', () => {
    it('identifies file with standard conflicted pattern', () => {
      const name = "My Note (Alice's conflicted copy).md";
      expect(isConflictedFile(name)).toBe(true);
    });

    it('identifies file with conflicted pattern with date', () => {
      const name = "Document (Bob's conflicted copy 2024-01-15).md";
      expect(isConflictedFile(name)).toBe(true);
    });

    it('handles case-insensitive conflicted copy', () => {
      const name = "File (User's CONFLICTED COPY).md";
      expect(isConflictedFile(name)).toBe(true);
    });

    it('handles mixed case in conflicted copy', () => {
      const name = "Note (Author's Conflicted Copy).md";
      expect(isConflictedFile(name)).toBe(true);
    });

    it('rejects regular markdown file', () => {
      const name = 'Normal.md';
      expect(isConflictedFile(name)).toBe(false);
    });

    it('rejects file with similar but not exact pattern', () => {
      const name = "File (Alice's conflicted).md";
      expect(isConflictedFile(name)).toBe(false);
    });

    it('rejects file with parentheses but not conflicted pattern', () => {
      const name = "File (v1).md";
      expect(isConflictedFile(name)).toBe(false);
    });

    it('handles apostrophe variations', () => {
      expect(isConflictedFile("Note (User's conflicted copy).md")).toBe(true);
      expect(isConflictedFile('Note (User\'s conflicted copy).md')).toBe(true);
    });

    it('requires .md extension', () => {
      const name = "Note (User's conflicted copy).txt";
      expect(isConflictedFile(name)).toBe(false);
    });

    it('handles multiple names in conflict pattern', () => {
      const name = "Note (John and Jane's conflicted copy).md";
      expect(isConflictedFile(name)).toBe(true);
    });

    it('handles empty parentheses content safely', () => {
      // Shouldn't match because there's no "conflicted copy" text
      const name = 'Note ().md';
      expect(isConflictedFile(name)).toBe(false);
    });
  });
});
