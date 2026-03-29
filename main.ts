import { Plugin } from 'obsidian';
import { ObsidianCleanerSettings, DEFAULT_SETTINGS, Cleaner } from './src/types';
import { ObsidianCleanerSettingTab } from './src/settings';
import { OrphanedAttachmentsCleaner } from './src/cleaners/orphaned-attachments';
import { ConflictedFilesCleaner } from './src/cleaners/conflicted-files';
import { DuplicateFilesCleaner } from './src/cleaners/duplicate-files';
import { EmptyMarkdownCleaner } from './src/cleaners/empty-markdown';
import { EmptyFoldersCleaner } from './src/cleaners/empty-folders';
import { TagCleanupCleaner } from './src/cleaners/tag-cleanup';
import { FrontmatterCleanupCleaner } from './src/cleaners/frontmatter-cleanup';
import { CleanupModal } from './src/modal/cleanup-modal';
import { AutoRunner } from './src/auto-runner';

export default class ObsidianCleanerPlugin extends Plugin {
	settings: ObsidianCleanerSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('trash-2', 'Obsidian Cleaner', () => this.runCleanup());

		this.addCommand({
			id: 'obsidian-cleaner:run',
			name: 'Run Obsidian Cleaner',
			callback: () => this.runCleanup(),
		});

		this.addSettingTab(new ObsidianCleanerSettingTab(this.app, this));

		if (this.settings.runOnStartup) {
			setTimeout(() => this.runCleanup(), 3000);
		}
	}

	getEnabledCleaners(): Cleaner[] {
		const s = this.settings;
		const cleaners: Cleaner[] = [];

		if (s.orphanedAttachments)
			cleaners.push(new OrphanedAttachmentsCleaner(this.app, s));
		if (s.conflictedFiles)
			cleaners.push(new ConflictedFilesCleaner(this.app, s));
		if (s.duplicateFiles)
			cleaners.push(new DuplicateFilesCleaner(this.app, s));
		if (s.emptyMarkdownFiles)
			cleaners.push(new EmptyMarkdownCleaner(this.app, s));
		if (s.emptyFolders)
			cleaners.push(new EmptyFoldersCleaner(this.app));
		if (s.tagCleanup)
			cleaners.push(new TagCleanupCleaner(this.app, s));
		if (s.frontmatterCleanup)
			cleaners.push(new FrontmatterCleanupCleaner(this.app, s));

		return cleaners;
	}

	async runCleanup() {
		const cleaners = this.getEnabledCleaners();

		if (this.settings.confirmBeforeDelete) {
			new CleanupModal(this.app, cleaners).open();
		} else {
			const autoRunner = new AutoRunner(this.app, this.settings);
			const summaries = await autoRunner.runAll(cleaners);
			autoRunner.showSummaryNotice(summaries);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
