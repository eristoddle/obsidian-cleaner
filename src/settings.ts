import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';
import { ObsidianCleanerSettings, DEFAULT_SETTINGS, DeletionMode } from './types';

type PluginWithSettings = Plugin & {
  settings: ObsidianCleanerSettings;
  saveSettings(): Promise<void>;
};

export class ObsidianCleanerSettingTab extends PluginSettingTab {
  plugin: PluginWithSettings;

  constructor(app: App, plugin: PluginWithSettings) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ── Cleanup Types ──────────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Cleanup Types' });

    const cleanupTypes: Array<{
      key: keyof Pick<
        ObsidianCleanerSettings,
        | 'orphanedAttachments'
        | 'conflictedFiles'
        | 'duplicateFiles'
        | 'emptyMarkdownFiles'
        | 'emptyFolders'
        | 'tagCleanup'
        | 'frontmatterCleanup'
      >;
      name: string;
      desc: string;
    }> = [
      {
        key: 'orphanedAttachments',
        name: 'Orphaned Attachments',
        desc: 'Remove attachment files not referenced by any note',
      },
      {
        key: 'conflictedFiles',
        name: 'Conflicted Files',
        desc: 'Resolve sync-conflict copies (Dropbox, Syncthing, etc.)',
      },
      {
        key: 'duplicateFiles',
        name: 'Duplicate Files',
        desc: 'Remove numbered duplicates (e.g. Note 1.md) when the original exists',
      },
      {
        key: 'emptyMarkdownFiles',
        name: 'Empty Markdown Files',
        desc: 'Remove zero-byte .md files',
      },
      {
        key: 'emptyFolders',
        name: 'Empty Folders',
        desc: 'Remove folders that contain no files or subfolders',
      },
      {
        key: 'tagCleanup',
        name: 'Tag Cleanup',
        desc: 'Identify and merge near-duplicate tags',
      },
      {
        key: 'frontmatterCleanup',
        name: 'Frontmatter Cleanup',
        desc: 'Delete notes matching configured frontmatter rules',
      },
    ];

    for (const { key, name, desc } of cleanupTypes) {
      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings[key] as boolean)
            .onChange(async (value) => {
              (this.plugin.settings[key] as boolean) = value;
              await this.plugin.saveSettings();
            })
        );
    }

    // ── Behavior ───────────────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Behavior' });

    new Setting(containerEl)
      .setName('Deletion Mode')
      .setDesc('How files are removed when cleanup is applied')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('system-trash', 'System Trash')
          .addOption('obsidian-trash', 'Obsidian Trash (.trash folder)')
          .addOption('permanent', 'Permanent Delete')
          .setValue(this.plugin.settings.deletionMode)
          .onChange(async (value) => {
            this.plugin.settings.deletionMode = value as DeletionMode;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Confirm Before Delete')
      .setDesc('Show the step-by-step review modal before applying any changes')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.confirmBeforeDelete)
          .onChange(async (value) => {
            this.plugin.settings.confirmBeforeDelete = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show Notifications')
      .setDesc('Display a summary notice after each cleanup run')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showNotifications)
          .onChange(async (value) => {
            this.plugin.settings.showNotifications = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Run on Startup')
      .setDesc('Automatically run cleanup when Obsidian opens')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.runOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.runOnStartup = value;
            await this.plugin.saveSettings();
          })
      );

    // ── Attachments ────────────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Attachments' });

    new Setting(containerEl)
      .setName('Included Extensions')
      .setDesc('Comma-separated list of file extensions to consider as attachments (e.g. png,jpg,pdf)')
      .addTextArea((text) =>
        text
          .setValue(this.plugin.settings.includedExtensions.join(','))
          .onChange(async (value) => {
            this.plugin.settings.includedExtensions = value
              .split(',')
              .map((ext) => ext.trim().toLowerCase())
              .filter((ext) => ext.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // ── Frontmatter Rules ──────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Frontmatter Rules' });
    this.renderFrontmatterRules(containerEl);
  }

  private renderFrontmatterRules(containerEl: HTMLElement): void {
    // Remove any previously rendered rules section before re-rendering
    containerEl.querySelectorAll('.frontmatter-rule-row, .frontmatter-add-btn').forEach(el => el.remove());

    const rules = this.plugin.settings.frontmatterRules;

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      const setting = new Setting(containerEl)
        .setName(`key: ${rule.key || '(empty)'}${rule.value !== undefined ? `, value: ${Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}` : ''}`)
        .addText((text) =>
          text
            .setPlaceholder('key')
            .setValue(rule.key)
            .onChange(async (value) => {
              rules[i].key = value;
              setting.setName(`key: ${value || '(empty)'}${rules[i].value !== undefined ? `, value: ${Array.isArray(rules[i].value) ? (rules[i].value as string[]).join(', ') : rules[i].value}` : ''}`);
              await this.plugin.saveSettings();
            })
        )
        .addText((text) =>
          text
            .setPlaceholder('value (optional, comma-separated)')
            .setValue(
              rule.value === undefined
                ? ''
                : Array.isArray(rule.value)
                ? rule.value.join(', ')
                : rule.value
            )
            .onChange(async (value) => {
              const trimmed = value.trim();
              if (trimmed === '') {
                rules[i].value = undefined;
              } else {
                const parts = trimmed.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
                rules[i].value = parts.length === 1 ? parts[0] : parts;
              }
              setting.setName(`key: ${rules[i].key || '(empty)'}${rules[i].value !== undefined ? `, value: ${Array.isArray(rules[i].value) ? (rules[i].value as string[]).join(', ') : rules[i].value}` : ''}`);
              await this.plugin.saveSettings();
            })
        )
        .addExtraButton((btn) =>
          btn
            .setIcon('trash')
            .setTooltip('Remove rule')
            .onClick(async () => {
              rules.splice(i, 1);
              await this.plugin.saveSettings();
              this.renderFrontmatterRules(containerEl);
            })
        );

      setting.settingEl.addClass('frontmatter-rule-row');
    }

    const addBtnSetting = new Setting(containerEl)
      .addButton((btn) =>
        btn
          .setButtonText('Add Rule')
          .onClick(async () => {
            rules.push({ key: '' });
            await this.plugin.saveSettings();
            this.renderFrontmatterRules(containerEl);
          })
      );

    addBtnSetting.settingEl.addClass('frontmatter-add-btn');
  }
}
