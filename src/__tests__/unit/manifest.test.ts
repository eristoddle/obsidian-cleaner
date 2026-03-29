import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';

// Get the workspace root
const getWorkspaceRoot = () => {
  const testFile = __filename;
  const testDir = __dirname;
  // Navigate from src/__tests__/unit/ to root
  return resolve(testDir, '../../..');
};

describe('Unit: Manifest and Package Configuration', () => {
  let workspaceRoot: string;

  beforeAll(() => {
    workspaceRoot = getWorkspaceRoot();
  });

  it('manifest.json has correct id', () => {
    const manifestPath = join(workspaceRoot, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    expect(manifest.id).toBe('obsidian-cleaner');
  });

  it('manifest.json has correct name', () => {
    const manifestPath = join(workspaceRoot, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    expect(manifest.name).toBe('Obsidian Cleaner');
  });

  it('manifest.json has all required fields', () => {
    const manifestPath = join(workspaceRoot, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    expect(manifest).toHaveProperty('id');
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('version');
    expect(manifest).toHaveProperty('minAppVersion');
    expect(manifest).toHaveProperty('description');
    expect(manifest).toHaveProperty('author');
    expect(manifest).toHaveProperty('isDesktopOnly');
  });

  it('LICENSE file exists', () => {
    const licensePath = join(workspaceRoot, 'LICENSE');
    const license = readFileSync(licensePath, 'utf8');
    expect(license.length).toBeGreaterThan(0);
    expect(license).toContain('MIT');
  });

  it('package.json name is obsidian-cleaner', () => {
    const packagePath = join(workspaceRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    expect(pkg.name).toBe('obsidian-cleaner');
  });

  it('package.json has correct dependency versions', () => {
    const packagePath = join(workspaceRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    const deps = pkg.devDependencies;

    expect(deps.typescript).toBeDefined();
    const typescriptVersion = parseInt(deps.typescript.replace(/[^0-9]/g, ''));
    expect(typescriptVersion).toBeGreaterThanOrEqual(5);

    expect(deps.esbuild).toBeDefined();
    const esbuildVersion = parseFloat(
      deps.esbuild.replace(/[^0-9.]/g, '').split('.').slice(0, 2).join('.')
    );
    expect(esbuildVersion).toBeGreaterThanOrEqual(0.2);

    expect(deps['@types/node']).toBe('^20.0.0');
  });

  it('package.json has test scripts', () => {
    const packagePath = join(workspaceRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    expect(pkg.scripts.test).toBeDefined();
  });

  it('package.json includes vitest and fast-check', () => {
    const packagePath = join(workspaceRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    expect(pkg.devDependencies.vitest).toBeDefined();
    expect(pkg.devDependencies['fast-check']).toBeDefined();
  });
});
