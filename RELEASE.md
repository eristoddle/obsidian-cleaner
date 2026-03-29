# Release Guide

This document explains how to create and publish releases for the Obsidian Cleaner plugin on GitHub.

## Release Process

### 1. Update Version in package.json

Update the `version` field in `package.json` to your new version (following semantic versioning):

```bash
npm version minor|major|patch
```

Or manually edit `package.json` and update the version field.

### 2. Update manifest.json (Optional)

Update the `minAppVersion` if needed in `manifest.json`.

### 3. Create a Git Tag

Create a git tag matching the version:

```bash
git tag v1.0.0
git push origin v1.0.0
```

**Important**: The tag must start with `v` followed by the version number (e.g., `v1.0.0`, `v1.1.0`).

### 4. Automated Release Creation

Once you push the tag, GitHub Actions will automatically:
1. ✅ Build the plugin with `npm run build`
2. ✅ Create a GitHub release
3. ✅ Attach the following files as release assets:
   - `main.js` - Compiled plugin code
   - `manifest.json` - Plugin manifest
   - `styles.css` - Plugin styles (if it exists)

## Tag Convention

- Format: `vX.Y.Z` (e.g., `v1.0.0`, `v1.2.3`)
- Must start with `v` followed by semantic versioning (major.minor.patch)
- Example progression: `v1.0.0` → `v1.0.1` → `v1.1.0` → `v2.0.0`

## npm Scripts

The package.json includes a `version` script that automatically updates metadata:

```bash
npm run version
```

This script:
- Runs `version-bump.mjs` to sync version across files
- Updates `manifest.json` with the new version
- Updates `versions.json` with version compatibility info
- Auto-stages these files for commit

## Manual Release (If Needed)

If you need to manually create a release without using GitHub Actions:

1. Build: `npm run build`
2. Create Release: Use GitHub's web interface or CLI to create a release
3. Upload the `main.js` and `manifest.json` files

## Troubleshooting

### Release workflow didn't trigger

- Ensure the tag starts with `v` exactly as: `v1.0.0`
- Check that the tag is pushed to the remote: `git push origin v1.0.0`
- Verify the workflow file is in `.github/workflows/release.yml`

### Build failed

- Run `npm run build` locally to debug
- Check that Node.js version is compatible (v18 or higher recommended)
- Verify all dependencies are installed: `npm ci`

### Files not attached to release

- Ensure `main.js` and `manifest.json` exist after build
- Check the workflow logs in GitHub Actions for errors
