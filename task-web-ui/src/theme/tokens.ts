/**
 * Design token names for the Task Management UI.
 * Colors live as HSL CSS variables in `src/index.css` and are mapped in `tailwind.config.js`.
 * Prefer Tailwind classes like `bg-sidebar`, `text-status-done` over hard-coded grays.
 */

export const THEME_STORAGE_KEY = 'tm-theme';

export type ThemeMode = 'light' | 'dark';

export const shellTokens = [
  'background',
  'foreground',
  'card',
  'sidebar',
  'sidebar-foreground',
  'sidebar-accent',
  'sidebar-border',
  'primary',
  'muted',
  'border',
  'destructive',
] as const;

export const statusTokenClass: Record<string, string> = {
  TODO: 'border-status-todo/30 bg-status-todo/10 text-status-todo',
  IN_PROGRESS: 'border-status-progress/30 bg-status-progress/10 text-status-progress',
  IN_REVIEW: 'border-status-review/30 bg-status-review/10 text-status-review',
  DONE: 'border-status-done/30 bg-status-done/10 text-status-done',
  CANCELLED: 'border-status-cancelled/30 bg-status-cancelled/10 text-status-cancelled',
};

export const priorityTokenClass: Record<string, string> = {
  LOW: 'border-priority-low/30 bg-priority-low/10 text-priority-low',
  MEDIUM: 'border-priority-medium/30 bg-priority-medium/10 text-priority-medium',
  HIGH: 'border-priority-high/30 bg-priority-high/10 text-priority-high',
  URGENT: 'border-priority-high/40 bg-priority-high/15 text-priority-high',
};

export function applyThemeClass(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function persistTheme(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyThemeClass(mode);
}
