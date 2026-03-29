# Attachment Cleaner

An Obsidian plugin to clean up unattached files in your vault.

## Features

- Scans your vault for files that are not referenced in any markdown notes
- Configurable file extensions to consider as attachments
- Confirmation dialog before deletion
- Moves files to vault trash (recoverable)
- Ribbon icon and command palette integration

## Usage

1. Click the trash icon in the ribbon, or
2. Use the command palette: "Clean unattached files"

The plugin will scan all markdown files in your vault for references to attachment files and identify any files that are not referenced anywhere. You can configure which file extensions to consider as attachments in the settings.

## Settings

- **Confirm before delete**: Show confirmation dialog before deleting files
- **Show notifications**: Show notifications when cleaning is complete  
- **File extensions**: Comma-separated list of file extensions to consider as attachments

## Installation

1. Copy this plugin folder to your `.obsidian/plugins/` directory
2. Enable "Community plugins" in Obsidian settings
3. Enable the "Attachment Cleaner" plugin

## Development

```bash
npm install
npm run dev
```

## License

MIT