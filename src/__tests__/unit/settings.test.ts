import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '../../types';

describe('Unit: Settings', () => {
  it('DEFAULT_SETTINGS contains all required fields', () => {
    expect(DEFAULT_SETTINGS).toHaveProperty('orphanedAttachments');
    expect(DEFAULT_SETTINGS).toHaveProperty('conflictedFiles');
    expect(DEFAULT_SETTINGS).toHaveProperty('duplicateFiles');
    expect(DEFAULT_SETTINGS).toHaveProperty('emptyMarkdownFiles');
    expect(DEFAULT_SETTINGS).toHaveProperty('emptyFolders');
    expect(DEFAULT_SETTINGS).toHaveProperty('tagCleanup');
    expect(DEFAULT_SETTINGS).toHaveProperty('frontmatterCleanup');
    expect(DEFAULT_SETTINGS).toHaveProperty('deletionMode');
    expect(DEFAULT_SETTINGS).toHaveProperty('confirmBeforeDelete');
    expect(DEFAULT_SETTINGS).toHaveProperty('showNotifications');
    expect(DEFAULT_SETTINGS).toHaveProperty('runOnStartup');
    expect(DEFAULT_SETTINGS).toHaveProperty('includedExtensions');
    expect(DEFAULT_SETTINGS).toHaveProperty('frontmatterRules');
  });

  it('DEFAULT_SETTINGS has correct types', () => {
    expect(typeof DEFAULT_SETTINGS.orphanedAttachments).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.conflictedFiles).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.duplicateFiles).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.emptyMarkdownFiles).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.emptyFolders).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.tagCleanup).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.frontmatterCleanup).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.deletionMode).toBe('string');
    expect(typeof DEFAULT_SETTINGS.confirmBeforeDelete).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.showNotifications).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.runOnStartup).toBe('boolean');
    expect(Array.isArray(DEFAULT_SETTINGS.includedExtensions)).toBe(true);
    expect(Array.isArray(DEFAULT_SETTINGS.frontmatterRules)).toBe(true);
  });

  it('DEFAULT_SETTINGS has sensible defaults', () => {
    expect(DEFAULT_SETTINGS.orphanedAttachments).toBe(true);
    expect(DEFAULT_SETTINGS.conflictedFiles).toBe(true);
    expect(DEFAULT_SETTINGS.duplicateFiles).toBe(true);
    expect(DEFAULT_SETTINGS.emptyMarkdownFiles).toBe(true);
    expect(DEFAULT_SETTINGS.emptyFolders).toBe(true);
    expect(DEFAULT_SETTINGS.tagCleanup).toBe(false);
    expect(DEFAULT_SETTINGS.frontmatterCleanup).toBe(false);
    expect(DEFAULT_SETTINGS.deletionMode).toBe('obsidian-trash');
    expect(DEFAULT_SETTINGS.confirmBeforeDelete).toBe(true);
    expect(DEFAULT_SETTINGS.showNotifications).toBe(true);
    expect(DEFAULT_SETTINGS.runOnStartup).toBe(false);
  });

  it('DEFAULT_SETTINGS has common attachment extensions', () => {
    const extensions = DEFAULT_SETTINGS.includedExtensions;
    expect(extensions).toContain('png');
    expect(extensions).toContain('jpg');
    expect(extensions).toContain('pdf');
    expect(extensions.length).toBeGreaterThan(0);
  });

  it('DEFAULT_SETTINGS frontmatterRules starts empty', () => {
    expect(DEFAULT_SETTINGS.frontmatterRules).toEqual([]);
  });

  it('deletionMode accepts valid values', () => {
    const validModes = ['system-trash', 'obsidian-trash', 'permanent'];
    expect(validModes).toContain(DEFAULT_SETTINGS.deletionMode);
  });
});
