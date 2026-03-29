/**
 * Mock of core Obsidian types for testing purposes.
 * This allows tests to import and use Obsidian types without runtime dependencies.
 */

export class TFile {
  name: string = '';
  path: string = '';
  basename: string = '';
  parent?: TFolder;
  stat: { size: number; ctime: number; mtime: number } = {
    size: 0,
    ctime: 0,
    mtime: 0,
  };

  async getBasename(withoutExtension?: boolean): Promise<string> {
    return withoutExtension ? this.basename : this.name;
  }
}

export class TFolder {
  name: string = '';
  path: string = '';
  parent?: TFolder;
  children: (TFile | TFolder)[] = [];

  constructor() {}

  isRoot(): boolean {
    return this.path === '/';
  }
}

export class Vault {
  getMarkdownFiles(): TFile[] {
    return [];
  }

  getAbstractFileByPath(path: string): TFile | TFolder | null {
    return null;
  }

  getAllLoadedFiles(): (TFile | TFolder)[] {
    return [];
  }

  adapter = {
    rmdir: async (path: string, recursive: boolean) => {},
  };

  config = {
    attachmentFolderPath: '',
  };

  async read(file: TFile): Promise<string> {
    return '';
  }

  async modify(file: TFile, content: string): Promise<void> {}

  async delete(file: TFile, force?: boolean): Promise<void> {}

  async trash(file: TFile, system?: boolean): Promise<void> {}

  fileManager = {
    renameFile: async (oldFile: TFile, newPath: string) => {},
  };
}

export interface CachedMetadata {
  frontmatter?: Record<string, unknown>;
  tags?: Array<{ tag: string; position: { start: { offset: number } } }>;
}

export class MetadataCache {
  getFileCache(file: TFile): CachedMetadata | null {
    return null;
  }
}

export class App {
  vault = new Vault();
  metadataCache = new MetadataCache();
  fileManager = {
    renameFile: async (file: TFile, newPath: string) => {},
  };
}

export class Modal {
  app: App;
  containerEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.containerEl = document.createElement('div');
  }

  open() {}
  close() {}
}

export class Notice {
  message: string;

  constructor(message: string, timeout?: number) {
    this.message = message;
  }
}

export class Plugin {
  app: App;
  manifest: { id: string; name: string };

  constructor() {
    this.app = new App();
    this.manifest = { id: '', name: '' };
  }

  onload() {}
  onunload() {}

  registerEvent(cb: any) {}
  registerInterval(interval: number) {}
}

export class PluginSettingTab {
  containerEl: HTMLElement;

  constructor(public app: App, public plugin: Plugin) {
    this.containerEl = document.createElement('div');
  }

  display() {}
  hide() {}
}
