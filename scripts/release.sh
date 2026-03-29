#!/bin/bash
# Release script for Obsidian Cleaner plugin
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 1.1.0

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: ./scripts/release.sh <version>"
  echo "   Example: ./scripts/release.sh 1.1.0"
  exit 1
fi

VERSION=$1
TAG="v$VERSION"

echo "🚀 Preparing release for version $VERSION..."

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Invalid version format. Use semantic versioning: X.Y.Z"
  exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Git working directory is not clean. Please commit or stash changes."
  exit 1
fi

# Update version in package.json
echo "📝 Updating package.json version to $VERSION..."
npm --no-git-tag-version version "$VERSION" > /dev/null

# Run the version script to update manifest.json and versions.json
echo "📝 Syncing version across manifest.json and versions.json..."
npm run version > /dev/null 2>&1 || true

# Commit version changes
git add package.json package-lock.json manifest.json versions.json
git commit -m "chore: bump version to $VERSION"

# Create and push tag
echo "🏷️  Creating git tag $TAG..."
git tag "$TAG" -m "Release version $VERSION"

# Push commit and tag
echo "📤 Pushing to remote..."
git push origin main --no-verify
git push origin "$TAG" --no-verify

echo ""
echo "✅ Release prepared successfully!"
echo "📍 Tag: $TAG"
echo "🔗 GitHub Actions will automatically build and create a release."
echo "💡 Monitor progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*:\|\.git//g')/actions"
