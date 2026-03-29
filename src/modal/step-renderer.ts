import { CleanupItem } from '../types';

export interface StepRenderOptions {
  items: CleanupItem[];
  checked: Set<number>;
  onToggle: (index: number, value: boolean) => void;
}

export function renderItemList(container: HTMLElement, options: StepRenderOptions): void {
  container.empty();
  if (options.items.length === 0) {
    container.createEl('p', { text: 'No items found.' });
    return;
  }
  const list = container.createEl('div', { cls: 'oc-item-list' });
  list.style.maxHeight = '300px';
  list.style.overflowY = 'auto';

  options.items.forEach((item, i) => {
    const row = list.createEl('div', { cls: 'oc-item-row' });
    row.style.display = 'flex';
    row.style.alignItems = 'flex-start';
    row.style.gap = '8px';
    row.style.padding = '4px 0';

    const cb = row.createEl('input') as HTMLInputElement;
    cb.type = 'checkbox';
    cb.checked = options.checked.has(i);
    cb.onchange = () => options.onToggle(i, cb.checked);

    const label = row.createEl('div');
    label.createEl('div', { text: item.label, cls: 'oc-item-label' });
    if (item.detail) {
      const detail = label.createEl('div', { text: item.detail, cls: 'oc-item-detail' });
      detail.style.fontSize = '0.85em';
      detail.style.color = 'var(--text-muted)';
    }
  });
}
