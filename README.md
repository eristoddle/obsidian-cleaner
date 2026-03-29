# Obsidian Cleaner

A comprehensive vault hygiene plugin for [Obsidian](https://obsidian.md). Obsidian Cleaner walks you through a step-by-step modal to review and selectively apply seven types of cleanup — so you stay in control of every change.

## Features

- **Orphaned Attachments** — finds attachment files in your configured attachment folder that are not referenced by any note
- **Conflicted Files** — detects sync-conflict copies (e.g. Dropbox / Syncthing) and helps you resolve or remove them
- **Duplicate Files** — identifies numbered duplicates (`Note 1.md`, `Note 2.md`) left behind by Web Clipper and similar tools
- **Empty Markdown Files** — removes zero-byte `.md` files that serve no purpose
- **Empty Folders** — cleans up folders left empty after other cleanup steps
- **Tag Cleanup** — surfaces near-duplicate tags (edit distance ≤ 2 or pluralisation differences) and merges them across your vault
- **Frontmatter Cleanup** — deletes notes matching configurable frontmatter key/value rules

Each cleanup type can be enabled or disabled independently, and every item is presented with an individual accept/reject toggle before anything is deleted.

## Installation

### Community Plugin (recommended)

1. Open Obsidian and go to **Settings → Community plugins**
2. Disable **Safe mode** if prompted
3. Click **Browse** and search for **Obsidian Cleaner**
4. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from the [GitHub releases page](https://github.com/Eristoddle/obsidian-cleaner/releases)
2. Copy `main.js`, `manifest.json`, and `styles.css` (if present) into `<your vault>/.obsidian/plugins/obsidian-cleaner/`
3. Reload Obsidian and enable the plugin under **Settings → Community plugins**

## Usage

1. Click the **trash icon** in the left ribbon, or open the command palette and run **Run Obsidian Cleaner**
2. The cleanup modal opens and runs each enabled cleanup type in sequence
3. For each step, review the list of found items — check or uncheck individual items as needed
4. Use **Select All** / **Deselect All** to quickly toggle all items in a step
5. Click **Apply & Next** to apply your selections and move to the next step, or **Skip** to leave that step untouched
6. Use **Back** to revisit a previous step before its changes have been applied
7. When all steps are complete, a summary shows how many items were processed and skipped per cleanup type

If **Run on Startup** is enabled, the plugin runs automatically when Obsidian opens. With **Confirm Before Delete** on, the modal opens as usual; with it off, all accepted items are applied silently and a summary notice is shown.

## Settings

### Per-Feature Toggles

Each cleanup type has its own toggle so you can run only what you need:

| Setting | Description |
|---|---|
| Orphaned Attachments | Scan the attachment folder for unreferenced files |
| Conflicted Files | Find and resolve sync-conflict copies |
| Duplicate Files | Remove numbered duplicates of existing notes |
| Empty Markdown Files | Delete zero-byte markdown files |
| Empty Folders | Remove folders that contain no files or subfolders |
| Tag Cleanup | Identify and merge near-duplicate tags |
| Frontmatter Cleanup | Delete notes matching frontmatter rules |

### Deletion Mode

Controls how files are removed. Choose one of:

- **Move to system trash** (`system-trash`) — sends files to your OS trash (recoverable).
- **Move to Obsidian trash** (`obsidian-trash`, default) — moves files to the vault's `.trash` folder.
- **Permanently delete** (`permanent`) — irreversibly removes files. Use with caution.

### Other Settings

| Setting | Default | Description |
|---|---|---|
| Confirm Before Delete | `true` | Open the step-by-step modal before applying any changes. When off, all enabled cleanup types run automatically. |
| Show Notifications | `true` | Display a notice after each cleanup run summarising what was removed. |
| Run on Startup | `false` | Automatically run cleanup when Obsidian opens. |
| Included Extensions | `png, jpg, jpeg, gif, svg, pdf, mp4, webm, mp3, wav` | Comma-separated list of file extensions considered as attachments for the orphaned attachments scan. |

### Frontmatter Rules

Add rules to automatically flag notes for deletion based on their frontmatter. Each rule has:

- **Key** — the frontmatter field to match (e.g. `status`)
- **Value** *(optional)* — a specific value or list of values to match (e.g. `archived`). If omitted, any note containing the key is matched.

Rules can be added, edited, and removed in the settings tab.

## License

MIT — see [LICENSE](LICENSE) for details.
