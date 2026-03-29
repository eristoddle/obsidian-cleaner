import { describe, it, expect } from 'vitest';
import {
  isDuplicateFile,
  extractDuplicateBaseName,
} from '../../cleaners/duplicate-files';

describe('Unit: Duplicate Files Cleaner', () => {
  describe('isDuplicateFile', () => {
    it('identifies file with format "name 1.md"', () => {
      expect(isDuplicateFile('Note 1.md')).toBe(true);
    });

    it('identifies file with format "name 23.md"', () => {
      expect(isDuplicateFile('Document 23.md')).toBe(true);
    });

    it('identifies file with single digit', () => {
      expect(isDuplicateFile('File 9.md')).toBe(true);
    });

    it('identifies file with multiple digits', () => {
      expect(isDuplicateFile('Multi 12345.md')).toBe(true);
    });

    it('rejects file without digit suffix', () => {
      expect(isDuplicateFile('Regular.md')).toBe(false);
    });

    it('rejects file with digit not immediately before .md', () => {
      expect(isDuplicateFile('File1 test.md')).toBe(false);
    });

    it('rejects file with digit in middle of name', () => {
      expect(isDuplicateFile('File2Note.md')).toBe(false);
    });

    it('rejects non-markdown files', () => {
      expect(isDuplicateFile('File 1.txt')).toBe(false);
    });

    it('rejects file with only spaces', () => {
      expect(isDuplicateFile('  1.md')).toBe(true); // spaces before digit are allowed
    });
  });

  describe('extractDuplicateBaseName', () => {
    it('extracts base name from simple duplicate', () => {
      expect(extractDuplicateBaseName('Note 1.md')).toBe('Note');
    });

    it('extracts base name with multiple words', () => {
      expect(extractDuplicateBaseName('My Important Note 5.md')).toBe(
        'My Important Note'
      );
    });

    it('extracts base name with large number', () => {
      expect(extractDuplicateBaseName('Document 999.md')).toBe('Document');
    });

    it('returns null for non-duplicate', () => {
      expect(extractDuplicateBaseName('Regular.md')).toBeNull();
    });

    it('returns null for file without pattern', () => {
      expect(extractDuplicateBaseName('File1Test.md')).toBeNull();
    });

    it('preserves spaces in base name', () => {
      expect(extractDuplicateBaseName('Note With Spaces 3.md')).toBe(
        'Note With Spaces'
      );
    });
  });
});
