import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  CheckSquare,
  Columns3,
  Users,
  Settings,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Match nested routes (e.g. /tasks/:id) */
  matchPrefix?: boolean;
}

export const APP_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare, matchPrefix: true },
  { label: 'Board', path: '/boards', icon: Columns3 },
  { label: 'Teams', path: '/teams', icon: Users, matchPrefix: true },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 64;

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) {
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  }
  return pathname === item.path;
}

export function titleForPath(pathname: string): string {
  const exact = APP_NAV.find((item) => item.path === pathname);
  if (exact) return exact.label;
  if (pathname.startsWith('/tasks/new')) return 'New task';
  if (pathname.startsWith('/tasks/')) return 'Edit task';
  if (pathname.startsWith('/teams/new')) return 'New team';
  if (pathname.startsWith('/teams/')) return 'Team';
  return 'Task Management';
}
