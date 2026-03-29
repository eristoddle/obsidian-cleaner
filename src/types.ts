export type DeletionMode = 'system-trash' | 'obsidian-trash' | 'permanent';

export type CleanupType =
  | 'orphanedAttachments'
  | 'conflictedFiles'
  | 'duplicateFiles'
  | 'emptyMarkdownFiles'
  | 'emptyFolders'
  | 'tagCleanup'
  | 'frontmatterCleanup';

export interface FrontmatterRule {
  key: string;
  value?: string | string[];
}

export interface ObsidianCleanerSettings {
  // Feature toggles
  orphanedAttachments: boolean;
  conflictedFiles: boolean;
  duplicateFiles: boolean;
  emptyMarkdownFiles: boolean;
  emptyFolders: boolean;
  tagCleanup: boolean;
  frontmatterCleanup: boolean;

  // Deletion
  deletionMode: DeletionMode;

  // Notifications / confirmation
  confirmBeforeDelete: boolean;
  showNotifications: boolean;

  // Startup
  runOnStartup: boolean;

  // Attachment cleaner legacy
  includedExtensions: string[];

  // Frontmatter rules
  frontmatterRules: FrontmatterRule[];
}

export const DEFAULT_SETTINGS: ObsidianCleanerSettings = {
  orphanedAttachments: true,
  conflictedFiles: true,
  duplicateFiles: true,
  emptyMarkdownFiles: true,
  emptyFolders: true,
  tagCleanup: false,
  frontmatterCleanup: false,
  deletionMode: 'obsidian-trash',
  confirmBeforeDelete: true,
  showNotifications: true,
  runOnStartup: false,
  includedExtensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'pdf', 'mp4', 'webm', 'mp3', 'wav', 'ogg', 'flac'],
  frontmatterRules: [],
};

export interface CleanupItem {
  type: CleanupType;
  label: string;
  detail?: string;
  payload: unknown;
}

export interface ApplyResult {
  applied: number;
  skipped: number;
  errors: string[];
}

export interface Cleaner {
  readonly id: CleanupType;
  readonly label: string;
  scan(): Promise<{ items: CleanupItem[] }>;
  apply(accepted: CleanupItem[]): Promise<ApplyResult>;
}
