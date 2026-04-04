import { App, Modal } from 'obsidian';
import { Cleaner, CleanupItem, CleanupType, ApplyResult } from '../types';
import { renderItemList } from './step-renderer';

interface StepSummary {
  type: CleanupType;
  label: string;
  applied: number;
  skipped: number;
}

export class CleanupModal extends Modal {
  private cleaners: Cleaner[];
  private stepIndex = 0;
  private checkedItems: Set<number> = new Set();
  private currentItems: CleanupItem[] = [];
  private appliedSteps: Set<number> = new Set();
  private summaries: StepSummary[] = [];

  constructor(app: App, cleaners: Cleaner[]) {
    super(app);
    this.cleaners = cleaners;
  }

  async onOpen() {
    this.modalEl.style.width = '600px';
    await this.renderStep();
  }

  onClose() {
    this.contentEl.empty();
  }

  private async renderStep() {
    const { contentEl } = this;
    contentEl.empty();

    // Summary step
    if (this.stepIndex >= this.cleaners.length) {
      this.renderSummary();
      return;
    }

    const cleaner = this.cleaners[this.stepIndex];

    // Step indicator
    const indicator = contentEl.createEl('div', {
      text: `Step ${this.stepIndex + 1} of ${this.cleaners.length}: ${cleaner.label}`,
      cls: 'oc-step-indicator',
    });
    indicator.style.cssText = 'font-weight:600;margin-bottom:8px;color:var(--text-muted)';

    // Loading indicator
    const loadingEl = contentEl.createEl('div', { cls: 'oc-loading' });
    loadingEl.style.cssText = 'display:flex;align-items:center;gap:8px;padding:12px 0;color:var(--text-muted)';
    const spinner = loadingEl.createEl('div', { cls: 'oc-spinner' });
    spinner.style.cssText = 'width:16px;height:16px;border:2px solid var(--text-muted);border-top-color:var(--interactive-accent);border-radius:50%;animation:oc-spin 0.7s linear infinite;flex-shrink:0';
    loadingEl.createEl('span', { text: 'Scanning…' });

    // Inject keyframe animation once
    if (!document.getElementById('oc-spin-style')) {
      const style = document.createElement('style');
      style.id = 'oc-spin-style';
      style.textContent = '@keyframes oc-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }

    // Scan
    const { items } = await cleaner.scan();
    loadingEl.remove();
    this.currentItems = items;

    // Auto-advance if no items
    if (items.length === 0) {
      this.stepIndex++;
      await this.renderStep();
      return;
    }

    // Pre-check all items
    this.checkedItems = new Set(items.map((_, i) => i));

    // Count badge
    const countBadge = contentEl.createEl('div', { cls: 'oc-count-badge' });
    countBadge.style.cssText = 'font-size:0.85em;color:var(--text-muted);margin-bottom:8px';
    const updateCount = () => {
      countBadge.setText(`${this.checkedItems.size} of ${items.length} selected`);
    };
    updateCount();

    // Select All / Deselect All
    const controls = contentEl.createEl('div', { cls: 'oc-controls' });
    controls.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';

    const selectAll = controls.createEl('button', { text: 'Select All' });
    selectAll.onclick = () => {
      this.checkedItems = new Set(items.map((_, i) => i));
      updateCount();
      renderItemList(listContainer, { items, checked: this.checkedItems, onToggle: toggleAndCount });
    };

    const deselectAll = controls.createEl('button', { text: 'Deselect All' });
    deselectAll.onclick = () => {
      this.checkedItems = new Set();
      updateCount();
      renderItemList(listContainer, { items, checked: this.checkedItems, onToggle: toggleAndCount });
    };

    const toggleAndCount = (index: number, value: boolean) => {
      this.onToggle(index, value);
      updateCount();
    };

    // Item list
    const listContainer = contentEl.createEl('div');
    renderItemList(listContainer, { items, checked: this.checkedItems, onToggle: toggleAndCount });

    // Buttons
    const btnRow = contentEl.createEl('div', { cls: 'oc-btn-row' });
    btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:12px';

    // Back button: only if previous step has not been applied
    if (this.stepIndex > 0 && !this.appliedSteps.has(this.stepIndex - 1)) {
      const backBtn = btnRow.createEl('button', { text: 'Back' });
      backBtn.onclick = async () => {
        this.stepIndex--;
        await this.renderStep();
      };
    }

    const skipBtn = btnRow.createEl('button', { text: 'Skip' });
    skipBtn.onclick = async () => {
      this.summaries.push({
        type: cleaner.id,
        label: cleaner.label,
        applied: 0,
        skipped: items.length,
      });
      this.stepIndex++;
      await this.renderStep();
    };

    const applyBtn = btnRow.createEl('button', { text: 'Apply & Next', cls: 'mod-cta' });
    applyBtn.onclick = async () => {
      const accepted = Array.from(this.checkedItems).map(i => items[i]);
      const result: ApplyResult = await cleaner.apply(accepted);
      this.appliedSteps.add(this.stepIndex);
      this.summaries.push({
        type: cleaner.id,
        label: cleaner.label,
        applied: result.applied,
        skipped: items.length - accepted.length + result.skipped,
      });
      this.stepIndex++;
      await this.renderStep();
    };
  }

  private onToggle(index: number, value: boolean) {
    if (value) this.checkedItems.add(index);
    else this.checkedItems.delete(index);
  }

  private renderSummary() {
    const { contentEl } = this;
    contentEl.createEl('h3', { text: 'Cleanup Complete' });

    if (this.summaries.length === 0) {
      contentEl.createEl('p', { text: 'Nothing to clean up.' });
    } else {
      const table = contentEl.createEl('table');
      table.style.width = '100%';
      const header = table.createEl('tr');
      ['Cleanup Type', 'Applied', 'Skipped'].forEach(h => header.createEl('th', { text: h }));
      for (const s of this.summaries) {
        const row = table.createEl('tr');
        row.createEl('td', { text: s.label });
        row.createEl('td', { text: String(s.applied) });
        row.createEl('td', { text: String(s.skipped) });
      }
    }

    const closeBtn = contentEl.createEl('button', { text: 'Close', cls: 'mod-cta' });
    closeBtn.style.marginTop = '12px';
    closeBtn.onclick = () => this.close();
  }
}
