// Enums as const objects (TypeScript 5.9+ with erasableSyntaxOnly)
export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const TeamMemberRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type TeamMemberRole = typeof TeamMemberRole[keyof typeof TeamMemberRole];

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teamMemberships?: TeamMember[];
}

// Team Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  creator?: User;
  members?: TeamMember[];
  tasks?: Task[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  joinedAt: string;
  updatedAt: string;
  team?: Team;
  user?: User;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId?: string;
  teamId?: string;
  createdBy?: User;
  assignedTo?: User;
  team?: Team;
  comments?: Comment[];
  activityLogs?: ActivityLog[];
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  task?: Task;
  user?: User;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: string;
  taskId?: string;
  userId: string;
  createdAt: string;
  task?: Task;
  user?: User;
}

// API Response Types
export interface ValidationErrorItem {
  field?: string;
  message: string;
}

/**
 * Error response contract from the API (HTTP status = statusCode).
 * { success: false, message, errors?, stack? } — stack only in development.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationErrorItem[];
  stack?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationErrorItem[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

