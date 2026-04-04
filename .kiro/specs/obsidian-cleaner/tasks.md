# Tasks

## Task List

- [x] 1. Plugin rename and project restructure
  - [x] 1.1 Update `manifest.json`: set `id` to `obsidian-cleaner`, `name` to `Obsidian Cleaner`
  - [x] 1.2 Update `package.json`: set `name` to `obsidian-cleaner`, bump dependency versions (typescript 5.x, esbuild 0.20.x, @types/node ^20)
  - [x] 1.3 Create `src/` directory structure: `types.ts`, `settings.ts`, `utils/levenshtein.ts`, `utils/frontmatter.ts`, `cleaners/`, `modal/`
  - [x] 1.4 Rename plugin class to `ObsidianCleanerPlugin` in `main.ts` and update all string references to "Obsidian Cleaner"
  - [x] 1.5 Add `LICENSE` file (MIT)
  - [x] 1.6 Update `README.md` with new name, all features, settings documentation, and community plugin installation instructions

- [x] 2. Core types and settings
  - [x] 2.1 Create `src/types.ts` with `DeletionMode`, `CleanupType`, `FrontmatterRule`, `ObsidianCleanerSettings`, `DEFAULT_SETTINGS`, `CleanupItem`, `ApplyResult`, and `Cleaner` interface
  - [x] 2.2 Create `src/settings.ts` with `ObsidianCleanerSettingTab` class rendering all toggles (one per cleanup type), deletion mode dropdown, frontmatter rules editor, run-on-startup toggle, show-notifications toggle, confirm-before-delete toggle, and included extensions field
  - [x] 2.3 Implement frontmatter rules add/edit/remove UI in settings tab

- [x] 3. Utility modules
  - [x] 3.1 Create `src/utils/levenshtein.ts` with pure `levenshtein(a, b): number` function (dynamic programming)
  - [x] 3.2 Create `src/utils/frontmatter.ts` with helpers: parse frontmatter tags from cached metadata, replace tag in raw file content (frontmatter + inline), check `FrontmatterRule` match against frontmatter object

- [x] 4. Deletion helper
  - [x] 4.1 Create `src/utils/delete.ts` with `deleteFile(app, file, mode: DeletionMode): Promise<void>` that dispatches to the correct vault API based on mode

- [x] 5. Orphaned attachments cleaner
  - [x] 5.1 Create `src/cleaners/orphaned-attachments.ts` implementing `Cleaner` interface
  - [x] 5.2 Implement `scan()`: check `app.vault.config.attachmentFolderPath`, return empty + notice if not configured; otherwise filter vault files to attachment folder + includedExtensions, then exclude referenced files
  - [x] 5.3 Implement `isFileReferenced(file, markdownContents[])` checking filename and basename against all markdown content strings
  - [x] 5.4 Implement `apply(accepted)` using configured `DeletionMode`

- [x] 6. Conflicted files cleaner
  - [x] 6.1 Create `src/cleaners/conflicted-files.ts` implementing `Cleaner` interface
  - [x] 6.2 Implement `isConflictedFile(name)` regex matching `<base> (<any>'s conflicted copy<optional date>).md` case-insensitively
  - [x] 6.3 Implement `scan()`: find all conflicted files, pair each with its non-conflicted counterpart if it exists
  - [x] 6.4 Implement `apply(accepted)` handling three cases: overwrite original with conflicted content, delete conflicted only, or skip

- [x] 7. Duplicate files cleaner
  - [x] 7.1 Create `src/cleaners/duplicate-files.ts` implementing `Cleaner` interface
  - [x] 7.2 Implement `isDuplicateFile(name, folder)` checking `<base name> <N>.md` pattern and existence of `<base name>.md` in same folder
  - [x] 7.3 Implement `scan()`: find and group all duplicates by base name, never including the original in the delete candidates
  - [x] 7.4 Implement `apply(accepted)` removing accepted duplicates, asserting original is never in the accepted set

- [x] 8. Empty markdown files cleaner
  - [x] 8.1 Create `src/cleaners/empty-markdown.ts` implementing `Cleaner` interface
  - [x] 8.2 Implement `scan()`: return all `.md` files where `file.stat.size === 0`
  - [x] 8.3 Implement `apply(accepted)` using configured `DeletionMode`

- [x] 9. Empty folders cleaner
  - [x] 9.1 Create `src/cleaners/empty-folders.ts` implementing `Cleaner` interface
  - [x] 9.2 Implement recursive `isEmptyFolder(folder, vault)` check
  - [x] 9.3 Implement `scan()`: collect all empty folders, excluding vault root and `.obsidian`
  - [x] 9.4 Implement `apply(accepted)` using `app.vault.adapter.rmdir(path, false)`

- [x] 10. Tag cleanup cleaner
  - [x] 10.1 Create `src/cleaners/tag-cleanup.ts` implementing `Cleaner` interface
  - [x] 10.2 Implement `collectAllTags(vault, metadataCache)`: gather all tags from frontmatter and inline occurrences across all markdown files
  - [x] 10.3 Implement `findSimilarTagPairs(tags[])`: return pairs where `levenshtein(a,b) <= 2` or one is the other + trailing `s`
  - [x] 10.4 Implement `scan()`: collect tags, find similar pairs, return as `CleanupItem` list with note counts
  - [x] 10.5 Implement `apply(accepted)`: for each accepted merge, update every file containing the source tag using frontmatter utility

- [x] 11. Frontmatter cleanup cleaner
  - [x] 11.1 Create `src/cleaners/frontmatter-cleanup.ts` implementing `Cleaner` interface
  - [x] 11.2 Implement `scan()`: for each `FrontmatterRule` in settings, find all markdown files whose frontmatter matches the rule
  - [x] 11.3 Implement `apply(accepted)` using configured `DeletionMode`

- [x] 12. Step-by-step cleanup modal
  - [x] 12.1 Create `src/modal/cleanup-modal.ts` extending Obsidian `Modal`
  - [x] 12.2 Implement step sequencing: build ordered list of enabled cleaners, track current step index
  - [x] 12.3 Implement per-step rendering: call `scan()` for current step, render results with checkboxes, step indicator, "Select All" / "Deselect All" controls
  - [x] 12.4 Implement auto-advance when `scan()` returns zero items
  - [x] 12.5 Implement "Apply & Next" button: call `apply(accepted)`, advance to next step
  - [x] 12.6 Implement "Skip" button: advance without calling `apply()`
  - [x] 12.7 Implement "Back" button: decrement step index only if `apply()` has not been called for the current step
  - [x] 12.8 Implement summary step: display counts of applied and skipped items grouped by cleanup type
  - [x] 12.9 Create `src/modal/step-renderer.ts` with stateless helpers for rendering a step's item list and controls

- [x] 13. Auto-run and notifications
  - [x] 13.1 Implement `AutoRunner` in `main.ts` or `src/auto-runner.ts`: runs all enabled cleaners sequentially without opening the modal, collects results, displays a summary `Notice`
  - [x] 13.2 In `ObsidianCleanerPlugin.onload()`: if `runOnStartup` is true, schedule cleanup after a short delay using `setTimeout` wrapped in `this.registerInterval` or a one-shot approach
  - [x] 13.3 When `runOnStartup && confirmBeforeDelete`, open `CleanupModal`; when `runOnStartup && !confirmBeforeDelete`, run `AutoRunner`
  - [x] 13.4 Implement summary `Notice` after auto-run showing items removed per cleanup type (when `showNotifications` is true)
  - [x] 13.5 Display "vault is clean" `Notice` when no items found across all enabled types (when `showNotifications` is true)

- [x] 14. Wire up main plugin entry point
  - [x] 14.1 Refactor `main.ts` to import and instantiate all cleaners, pass settings to each
  - [x] 14.2 Register ribbon icon with tooltip "Obsidian Cleaner" triggering `runCleanup()`
  - [x] 14.3 Register command `obsidian-cleaner:run` with name "Run Obsidian Cleaner"
  - [x] 14.4 Register settings tab using `ObsidianCleanerSettingTab`
  - [x] 14.5 Ensure all event listeners use `this.registerEvent` per Requirement 15.6

- [x] 15. Tests
  - [x] 15.1 Set up test infrastructure: add `vitest` and `fast-check` to `devDependencies`, configure `vitest.config.ts`
  - [x] 15.2 Write unit tests for `DEFAULT_SETTINGS` defaults, `manifest.json` required fields, `LICENSE` existence, and `package.json` dependency versions
  - [x] 15.3 Write unit tests for conflicted file resolution actions (overwrite, delete, skip)
  - [x] 15.4 Write unit tests for modal state: Select All, Deselect All, summary counts, back navigation
  - [x] 15.5 Write property test for Property 1: disabled toggle excludes cleaner from run
  - [x] 15.6 Write property test for Property 2: settings round-trip serialization
  - [x] 15.7 Write property test for Property 3: deletion mode dispatches correct vault API
  - [x] 15.8 Write property test for Property 4: orphaned scan respects folder and extension filters
  - [x] 15.9 Write property test for Property 5: file reference detection
  - [x] 15.10 Write property test for Property 6: conflicted file pattern detection
  - [x] 15.11 Write property test for Property 7: duplicate file detection and grouping
  - [x] 15.12 Write property test for Property 8: empty markdown file detection
  - [x] 15.13 Write property test for Property 9: empty folder detection is recursive
  - [x] 15.14 Write property test for Property 10: protected folders excluded from empty folder candidates
  - [x] 15.15 Write property test for Property 11: tag similarity detection (Levenshtein + pluralisation)
  - [x] 15.16 Write property test for Property 12: tag merge completeness
  - [x] 15.17 Write property test for Property 13: frontmatter rule matching
  - [x] 15.18 Write property test for Property 14: modal step list matches enabled cleanup types
