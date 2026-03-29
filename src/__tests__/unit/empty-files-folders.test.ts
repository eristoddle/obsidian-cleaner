import { describe, it, expect } from 'vitest';
import { isEmptyMarkdown } from '../../cleaners/empty-markdown';
import { isEmptyFolder } from '../../cleaners/empty-folders';
import { TFile, TFolder, Vault } from 'obsidian';

describe('Unit: Empty Markdown Files', () => {
  it('identifies file with zero size', () => {
    const mockFile = new TFile();
    mockFile.stat = { size: 0, ctime: 0, mtime: 0 };

    expect(isEmptyMarkdown(mockFile)).toBe(true);
  });

  it('rejects file with non-zero size', () => {
    const mockFile = new TFile();
    mockFile.stat = { size: 100, ctime: 0, mtime: 0 };

    expect(isEmptyMarkdown(mockFile)).toBe(false);
  });

  it('rejects file with 1 byte', () => {
    const mockFile = new TFile();
    mockFile.stat = { size: 1, ctime: 0, mtime: 0 };

    expect(isEmptyMarkdown(mockFile)).toBe(false);
  });

  it('identifies truly empty files at boundary', () => {
    const files = [
      { stat: { size: 0, ctime: 0, mtime: 0 } },
      { stat: { size: 1, ctime: 0, mtime: 0 } },
      { stat: { size: 2, ctime: 0, mtime: 0 } },
    ];

    expect(isEmptyMarkdown(files[0] as TFile)).toBe(true);
    expect(isEmptyMarkdown(files[1] as TFile)).toBe(false);
    expect(isEmptyMarkdown(files[2] as TFile)).toBe(false);
  });
});

describe('Unit: Empty Folders', () => {
  it('identifies folder with no children', () => {
    const mockFolder = new TFolder();
    mockFolder.children = [];

    const mockVault = new Vault();

    expect(isEmptyFolder(mockFolder, mockVault)).toBe(true);
  });

  it('identifies folder with only empty subfolders', () => {
    const emptySubfolder = new TFolder();
    emptySubfolder.children = [];

    const mockFolder = new TFolder();
    mockFolder.children = [emptySubfolder];

    const mockVault = new Vault();

    expect(isEmptyFolder(mockFolder, mockVault)).toBe(true);
  });

  it('rejects folder with files', () => {
    const mockFile = new TFile();

    const mockFolder = new TFolder();
    mockFolder.children = [mockFile];

    const mockVault = new Vault();

    expect(isEmptyFolder(mockFolder, mockVault)).toBe(false);
  });

  it('handles nested empty folders', () => {
    const level3 = new TFolder();
    level3.children = [];

    const level2 = new TFolder();
    level2.children = [level3];

    const level1 = new TFolder();
    level1.children = [level2];

    const mockVault = new Vault();

    expect(isEmptyFolder(level1, mockVault)).toBe(true);
  });

  it('rejects folder with file at any depth', () => {
    const mockFile = new TFile();

    const level2 = new TFolder();
    level2.children = [mockFile];

    const level1 = new TFolder();
    level1.children = [level2];

    const mockVault = new Vault();

    expect(isEmptyFolder(level1, mockVault)).toBe(false);
  });
});

