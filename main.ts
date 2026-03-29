import { App, Plugin, PluginSettingTab, Setting, TFile, Notice, Modal } from 'obsidian';

interface AttachmentCleanerSettings {
	confirmBeforeDelete: boolean;
	showNotifications: boolean;
	includedExtensions: string[];
}

const DEFAULT_SETTINGS: AttachmentCleanerSettings = {
	confirmBeforeDelete: true,
	showNotifications: true,
	includedExtensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'pdf', 'mp4', 'webm', 'mp3', 'wav', 'ogg', 'flac']
}

export default class AttachmentCleanerPlugin extends Plugin {
	settings: AttachmentCleanerSettings;

	async onload() {
		await this.loadSettings();

		// Add ribbon icon
		this.addRibbonIcon('trash-2', 'Clean unattached files', () => {
			this.cleanUnattachedFiles();
		});

		// Add command
		this.addCommand({
			id: 'clean-unattached-files',
			name: 'Clean unattached files',
			callback: () => {
				this.cleanUnattachedFiles();
			}
		});

		// Add settings tab
		this.addSettingTab(new AttachmentCleanerSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup if necessary
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async cleanUnattachedFiles() {
		const unattachedFiles = await this.findUnattachedFiles();
		
		if (unattachedFiles.length === 0) {
			if (this.settings.showNotifications) {
				new Notice('No unattached files found.');
			}
			return;
		}

		if (this.settings.confirmBeforeDelete) {
			new ConfirmationModal(this.app, unattachedFiles, (filesToDelete) => {
				this.deleteFiles(filesToDelete);
			}).open();
		} else {
			this.deleteFiles(unattachedFiles);
		}
	}

	async findUnattachedFiles(): Promise<TFile[]> {
		const allFiles = this.app.vault.getFiles();
		const markdownFiles = this.app.vault.getMarkdownFiles();
		
		// Get all possible attachment files based on extensions
		const potentialAttachments = allFiles.filter(file => {
			const extension = file.extension.toLowerCase();
			return this.settings.includedExtensions.includes(extension);
		});

		// Read all markdown content once
		const allMarkdownContent: string[] = [];
		for (const mdFile of markdownFiles) {
			const content = await this.app.vault.cachedRead(mdFile);
			allMarkdownContent.push(content);
		}

		// Find unattached files by checking if filename appears in any markdown content
		const unattachedFiles = potentialAttachments.filter(file => {
			return !this.isFileReferenced(file, allMarkdownContent);
		});

		return unattachedFiles;
	}

	isFileReferenced(file: TFile, allMarkdownContent: string[]): boolean {
		const fileName = file.name;
		const baseName = file.basename;
		
		// Check if filename or basename appears in any markdown content
		for (const content of allMarkdownContent) {
			// Simple string search - if the filename appears anywhere, consider it referenced
			if (content.includes(fileName) || content.includes(baseName)) {
				return true;
			}
		}
		
		return false;
	}

	async deleteFiles(files: TFile[]) {
		let deletedCount = 0;
		
		for (const file of files) {
			try {
				await this.app.vault.trash(file, false); // Move to vault trash, not system trash
				deletedCount++;
			} catch (error) {
				console.error(`Failed to delete ${file.path}:`, error);
			}
		}

		if (this.settings.showNotifications) {
			new Notice(`Moved ${deletedCount} unattached file(s) to trash.`);
		}
	}
}

class ConfirmationModal extends Modal {
	files: TFile[];
	onConfirm: (files: TFile[]) => void;

	constructor(app: App, files: TFile[], onConfirm: (files: TFile[]) => void) {
		super(app);
		this.files = files;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Confirm File Deletion' });
		contentEl.createEl('p', { 
			text: `Found ${this.files.length} unattached file(s). The following files will be moved to trash:` 
		});

		const fileList = contentEl.createEl('div', { cls: 'attachment-cleaner-file-list' });
		fileList.style.maxHeight = '300px';
		fileList.style.overflow = 'auto';
		fileList.style.border = '1px solid var(--background-modifier-border)';
		fileList.style.borderRadius = '4px';
		fileList.style.padding = '8px';
		fileList.style.marginBottom = '16px';

		this.files.forEach(file => {
			const fileItem = fileList.createEl('div', { text: file.path });
			fileItem.style.padding = '2px 0';
		});

		const buttonContainer = contentEl.createEl('div', { cls: 'attachment-cleaner-buttons' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.gap = '8px';
		buttonContainer.style.justifyContent = 'flex-end';

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.onclick = () => this.close();

		const confirmBtn = buttonContainer.createEl('button', { 
			text: `Move ${this.files.length} file(s) to trash`,
			cls: 'mod-warning'
		});
		confirmBtn.onclick = () => {
			this.onConfirm(this.files);
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class AttachmentCleanerSettingTab extends PluginSettingTab {
	plugin: AttachmentCleanerPlugin;

	constructor(app: App, plugin: AttachmentCleanerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Attachment Cleaner Settings' });

		new Setting(containerEl)
			.setName('Confirm before delete')
			.setDesc('Show confirmation dialog before deleting files')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.confirmBeforeDelete)
				.onChange(async (value) => {
					this.plugin.settings.confirmBeforeDelete = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show notifications')
			.setDesc('Show notifications when cleaning is complete')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showNotifications)
				.onChange(async (value) => {
					this.plugin.settings.showNotifications = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('File extensions')
			.setDesc('Comma-separated list of file extensions to consider as attachments')
			.addTextArea(text => text
				.setPlaceholder('png,jpg,jpeg,gif,pdf,mp4,mp3...')
				.setValue(this.plugin.settings.includedExtensions.join(','))
				.onChange(async (value) => {
					this.plugin.settings.includedExtensions = value
						.split(',')
						.map(ext => ext.trim().toLowerCase())
						.filter(ext => ext.length > 0);
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: 'Usage' });
		containerEl.createEl('p', { text: 'Click the trash icon in the ribbon or use the command palette to clean unattached files.' });
		containerEl.createEl('p', { text: 'Files are moved to the vault trash (.trash folder) and can be recovered if needed.' });
	}
}