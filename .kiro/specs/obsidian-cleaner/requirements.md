# Requirements Document

## Introduction

Obsidian Cleaner is a major expansion of the existing "Attachment Cleaner" Obsidian plugin. The plugin is renamed from "Attachment Cleaner" (ID: `attachment-cleaner`) to "Obsidian Cleaner" (ID: `obsidian-cleaner`) and gains a comprehensive suite of vault hygiene tools beyond orphaned attachment removal. The expanded plugin provides a step-by-step modal workflow for reviewing and accepting/rejecting each cleanup action, per-feature toggles, configurable deletion behavior, and an optional run-on-startup mode. All dependencies are updated to current versions and the plugin follows Obsidian community plugin submission standards.

---

## Glossary

- **Plugin**: The Obsidian Cleaner plugin (`obsidian-cleaner`).
- **Vault**: The Obsidian vault the Plugin operates on.
- **Attachment_Folder**: The folder designated in Obsidian settings as the default attachment location (`app.vault.config.attachmentFolderPath`).
- **Orphaned_Attachment**: An attachment file inside the Attachment_Folder that is not referenced by any Markdown note in the Vault.
- **Conflicted_File**: A file whose name matches the pattern `<base name> (<author>'s conflicted copy)<optional date>.md` as produced by sync tools such as Dropbox or Syncthing.
- **Duplicate_File**: A Markdown file whose name matches the pattern `<base name> <N>.md` where N is a positive integer and a file named `<base name>.md` also exists in the same folder.
- **Empty_Markdown_File**: A Markdown file (`.md`) whose size on disk is exactly 0 bytes.
- **Empty_Folder**: A folder that contains no files and no sub-folders, evaluated recursively after other cleanup steps.
- **Tag**: An Obsidian tag appearing in note frontmatter (`tags:` field) or inline (`#tag`).
- **Frontmatter**: The YAML block at the top of a Markdown file delimited by `---`.
- **Cleanup_Modal**: The step-by-step modal UI that walks the user through each enabled cleanup type.
- **Deletion_Mode**: The configured method for removing files: `system-trash`, `obsidian-trash`, or `permanent`.
- **Cleaner_Settings**: The persisted settings object for the Plugin.

---

## Requirements

### Requirement 1: Plugin Rename and Identity

**User Story:** As a developer maintaining the plugin, I want all references updated from "Attachment Cleaner" to "Obsidian Cleaner" so that the plugin identity is consistent across code, manifest, documentation, and the Obsidian UI.

#### Acceptance Criteria

1. THE Plugin SHALL use the plugin ID `obsidian-cleaner` in `manifest.json`.
2. THE Plugin SHALL use the display name `Obsidian Cleaner` in `manifest.json`, settings UI, ribbon tooltip, and command palette entries.
3. THE Plugin SHALL export a class named `ObsidianCleanerPlugin` as the default export of `main.ts`.
4. THE Plugin SHALL update `package.json` `name` field to `obsidian-cleaner`.
5. THE Plugin SHALL update `README.md` to reflect the new name, all new features, and community plugin installation instructions.

---

### Requirement 2: Dependency Updates

**User Story:** As a developer, I want all `package.json` dependencies updated to current stable versions so that the plugin builds with modern tooling and avoids known vulnerabilities.

#### Acceptance Criteria

1. THE Plugin SHALL declare `typescript` at version `5.x` or later in `devDependencies`.
2. THE Plugin SHALL declare `esbuild` at version `0.20.x` or later in `devDependencies`.
3. THE Plugin SHALL declare `@types/node` at version `^20` or later in `devDependencies`.
4. THE Plugin SHALL declare `obsidian` at `latest` in `devDependencies`.
5. THE Plugin SHALL produce a successful `npm run build` with no TypeScript errors after the dependency update.

---

### Requirement 3: Per-Feature Toggles

**User Story:** As a user, I want to enable or disable each cleanup type individually so that I can run only the cleanup operations relevant to my workflow.

#### Acceptance Criteria

1. THE Cleaner_Settings SHALL contain a boolean toggle for each of the following cleanup types: `orphanedAttachments`, `conflictedFiles`, `duplicateFiles`, `emptyMarkdownFiles`, `emptyFolders`, `tagCleanup`, `frontmatterCleanup`.
2. WHEN a cleanup type toggle is disabled, THE Plugin SHALL skip that cleanup type entirely during any cleanup run.
3. THE Plugin SHALL display each toggle as a named setting in the settings tab with a descriptive label and description.
4. THE Plugin SHALL persist all toggle states via `saveData` / `loadData`.

---

### Requirement 4: Deletion Mode Configuration

**User Story:** As a user, I want to choose how deleted files are removed so that I can balance safety and permanence based on my preferences.

#### Acceptance Criteria

1. THE Cleaner_Settings SHALL contain a `deletionMode` field accepting exactly one of three values: `system-trash`, `obsidian-trash`, or `permanent`.
2. WHEN `deletionMode` is `system-trash`, THE Plugin SHALL call `app.vault.trash(file, true)` to move files to the operating system trash.
3. WHEN `deletionMode` is `obsidian-trash`, THE Plugin SHALL call `app.vault.trash(file, false)` to move files to the Vault `.trash` folder.
4. WHEN `deletionMode` is `permanent`, THE Plugin SHALL call `app.vault.delete(file)` to permanently remove files.
5. THE Plugin SHALL display the `deletionMode` option as a dropdown in the settings tab.
6. THE Plugin SHALL default `deletionMode` to `obsidian-trash`.

---

### Requirement 5: Orphaned Attachments Cleanup

**User Story:** As a user, I want orphaned attachment files removed so that my vault does not accumulate unused media and documents.

#### Acceptance Criteria

1. WHEN the `orphanedAttachments` toggle is enabled and the Attachment_Folder is configured in Obsidian settings, THE Plugin SHALL scan only files inside the Attachment_Folder that match the configured `includedExtensions` list.
2. WHEN the Attachment_Folder is not configured in Obsidian settings, THE Plugin SHALL skip the orphaned attachments scan and display a notice informing the user to configure an attachment folder.
3. THE Plugin SHALL consider a file referenced if its filename or basename appears in the content of any Markdown file in the Vault.
4. WHEN orphaned attachments are found, THE Cleanup_Modal SHALL display each orphaned file path with an individual accept/reject toggle.
5. WHEN the user confirms accepted items, THE Plugin SHALL remove accepted files using the configured Deletion_Mode.

---

### Requirement 6: Conflicted Files Cleanup

**User Story:** As a user, I want conflicted sync copies identified and resolved so that my vault does not contain duplicate conflicted versions of notes.

#### Acceptance Criteria

1. THE Plugin SHALL identify Conflicted_Files by matching filenames against the pattern `<base name> (<any text>'s conflicted copy<optional date>).md` (case-insensitive match on "conflicted copy").
2. WHEN a Conflicted_File is found and a corresponding non-conflicted file with the same base name exists in the same folder, THE Cleanup_Modal SHALL display a side-by-side or sequential diff of the two files.
3. WHEN a Conflicted_File is found and no corresponding non-conflicted file exists, THE Cleanup_Modal SHALL offer to rename the Conflicted_File to the non-conflicted base name.
4. WHEN the user selects the conflicted version as preferred, THE Plugin SHALL overwrite the non-conflicted file with the conflicted file's content and remove the conflicted file using the configured Deletion_Mode.
5. WHEN the user selects the non-conflicted version as preferred, THE Plugin SHALL remove the Conflicted_File using the configured Deletion_Mode.
6. WHEN the user skips a conflicted pair, THE Plugin SHALL leave both files unchanged.

---

### Requirement 7: Duplicate Files Cleanup

**User Story:** As a user, I want numbered duplicate Markdown files removed so that Web Clipper and other tools do not leave redundant copies in my vault.

#### Acceptance Criteria

1. THE Plugin SHALL identify Duplicate_Files by finding Markdown files whose name matches `<base name> <N>.md` (where N is one or more digits) when a file named `<base name>.md` exists in the same folder.
2. THE Plugin SHALL group all duplicates of the same base name together (e.g., `Note 1.md`, `Note 2.md` are both duplicates of `Note.md`).
3. WHEN duplicates are found, THE Cleanup_Modal SHALL display the original file and all duplicates with their full paths and last-modified timestamps.
4. WHEN the user confirms removal, THE Plugin SHALL remove all accepted Duplicate_Files using the configured Deletion_Mode, leaving the original file untouched.
5. THE Plugin SHALL NOT remove the original `<base name>.md` file during duplicate cleanup.

---

### Requirement 8: Empty Markdown Files Cleanup

**User Story:** As a user, I want zero-byte Markdown files removed so that my vault does not contain empty, useless notes.

#### Acceptance Criteria

1. THE Plugin SHALL identify Empty_Markdown_Files as Markdown files with a `stat.size` of exactly 0 bytes.
2. WHEN empty Markdown files are found, THE Cleanup_Modal SHALL list each file path with an individual accept/reject toggle.
3. WHEN the user confirms accepted items, THE Plugin SHALL remove accepted Empty_Markdown_Files using the configured Deletion_Mode.

---

### Requirement 9: Empty Folders Cleanup

**User Story:** As a user, I want empty folders removed so that my vault folder structure stays clean after other cleanup operations.

#### Acceptance Criteria

1. THE Plugin SHALL identify Empty_Folders by recursively checking all folders in the Vault for the absence of any files or sub-folders.
2. THE Plugin SHALL evaluate Empty_Folders after all other cleanup types have completed their removals within the same run, so that folders emptied by earlier steps are also caught.
3. WHEN empty folders are found, THE Cleanup_Modal SHALL list each folder path with an individual accept/reject toggle.
4. WHEN the user confirms accepted items, THE Plugin SHALL remove accepted Empty_Folders using `app.vault.adapter.rmdir(path, false)`.
5. THE Plugin SHALL NOT remove the Vault root folder or the `.obsidian` configuration folder.

---

### Requirement 10: Tag Cleanup

**User Story:** As a user, I want tag typos and near-duplicate tags identified and merged so that my tag taxonomy stays consistent.

#### Acceptance Criteria

1. THE Plugin SHALL collect all tags from Markdown file frontmatter `tags` fields and inline `#tag` occurrences across the Vault.
2. THE Plugin SHALL identify candidate tag pairs where the edit distance (Levenshtein) between two tags is 1 or 2, presenting them as potential typos.
3. THE Plugin SHALL identify candidate tag pairs that differ only by a trailing `s` (e.g., `llm/agent` vs `llm/agents`), presenting them as potential pluralisation duplicates.
4. WHEN the user selects a source tag and a target tag to merge, THE Plugin SHALL update every Markdown file that contains the source tag, replacing the source tag with the target tag in both frontmatter and inline occurrences.
5. WHEN all occurrences of the source tag have been replaced, THE Plugin SHALL not leave any residual source tag references in the Vault.
6. THE Cleanup_Modal SHALL display each candidate pair with the count of notes affected and allow the user to accept, reject, or swap the merge direction.

---

### Requirement 11: Frontmatter Attribute Deletion

**User Story:** As a user, I want notes with specific frontmatter key/value pairs automatically cleaned up so that I can remove notes matching criteria I define in settings.

#### Acceptance Criteria

1. THE Cleaner_Settings SHALL contain a `frontmatterRules` list where each rule specifies a `key` (string) and an optional `value` (string or array of strings).
2. WHEN a rule specifies only a `key`, THE Plugin SHALL match any Markdown file that contains that frontmatter key regardless of its value.
3. WHEN a rule specifies both a `key` and a `value`, THE Plugin SHALL match only Markdown files where the frontmatter key equals the specified value.
4. WHEN a rule specifies both a `key` and an array of `values`, THE Plugin SHALL match Markdown files where the frontmatter key equals any value in the array.
5. WHEN matching files are found, THE Cleanup_Modal SHALL list each matched file with the matching rule and an individual accept/reject toggle.
6. WHEN the user confirms accepted items, THE Plugin SHALL remove accepted files using the configured Deletion_Mode.
7. THE Plugin SHALL allow the user to add, edit, and remove frontmatter rules in the settings tab.

---

### Requirement 12: Step-by-Step Cleanup Modal

**User Story:** As a user, I want a guided modal that walks me through each cleanup type one at a time so that I can review and selectively accept or reject individual changes before they are applied.

#### Acceptance Criteria

1. WHEN the user triggers a cleanup run, THE Cleanup_Modal SHALL open and present enabled cleanup types sequentially, one type per step.
2. THE Cleanup_Modal SHALL display a step indicator showing the current step number and total number of steps.
3. WHEN a cleanup step finds no items, THE Cleanup_Modal SHALL automatically advance to the next step without requiring user interaction.
4. WHEN a cleanup step finds items, THE Cleanup_Modal SHALL display a scrollable list of items, each with an individual checkbox to accept or reject the action.
5. THE Cleanup_Modal SHALL provide "Select All" and "Deselect All" controls for each step.
6. THE Cleanup_Modal SHALL provide "Apply & Next" and "Skip" buttons to either apply accepted items and advance or skip the step entirely.
7. WHEN all steps are complete, THE Cleanup_Modal SHALL display a summary of all actions taken, grouped by cleanup type, with counts of items processed and items skipped.
8. THE Cleanup_Modal SHALL allow the user to navigate back to a previous step before any changes for that step have been applied.

---

### Requirement 13: Run on Startup

**User Story:** As a user, I want the option to run cleanup automatically when Obsidian opens so that my vault stays clean without manual intervention.

#### Acceptance Criteria

1. THE Cleaner_Settings SHALL contain a boolean `runOnStartup` field defaulting to `false`.
2. WHEN `runOnStartup` is `true`, THE Plugin SHALL trigger a cleanup run automatically during the `onload` lifecycle method after a short delay to allow the Vault to fully index.
3. WHEN `runOnStartup` is `true` and `confirmBeforeDelete` is `true`, THE Plugin SHALL open the Cleanup_Modal on startup.
4. WHEN `runOnStartup` is `true` and `confirmBeforeDelete` is `false`, THE Plugin SHALL apply all enabled cleanup types automatically without opening the Cleanup_Modal, then display a summary Notice.
5. THE Plugin SHALL display the `runOnStartup` toggle in the settings tab.

---

### Requirement 14: Notifications and Confirmation

**User Story:** As a user, I want clear feedback about what the plugin did so that I am always aware of changes made to my vault.

#### Acceptance Criteria

1. THE Cleaner_Settings SHALL retain the existing `showNotifications` boolean field.
2. WHEN `showNotifications` is `true` and a cleanup run completes, THE Plugin SHALL display an Obsidian Notice summarising the total number of items removed per cleanup type.
3. WHEN a cleanup run finds no items across all enabled cleanup types, THE Plugin SHALL display a Notice stating that the vault is clean (if `showNotifications` is `true`).
4. THE Cleaner_Settings SHALL retain the existing `confirmBeforeDelete` boolean field, which controls whether the Cleanup_Modal is shown or changes are applied automatically.

---

### Requirement 15: Community Plugin Standards

**User Story:** As a developer, I want the plugin to meet Obsidian community plugin submission standards so that it can be submitted to the official community plugin repository.

#### Acceptance Criteria

1. THE Plugin SHALL include a `manifest.json` with all required fields: `id`, `name`, `version`, `minAppVersion`, `description`, `author`, and `isDesktopOnly`.
2. THE Plugin SHALL include a `LICENSE` file.
3. THE Plugin SHALL NOT use `eval()` or dynamically execute arbitrary code strings.
4. THE Plugin SHALL NOT make network requests to external services without explicit user consent documented in the README.
5. THE Plugin SHALL include a `README.md` describing installation, features, settings, and usage.
6. THE Plugin SHALL register all event listeners and intervals via the Plugin API (`this.registerEvent`, `this.registerInterval`) so they are automatically cleaned up on `onunload`.
