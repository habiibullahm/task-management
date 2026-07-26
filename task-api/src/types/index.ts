import { Request } from 'express';
import { JwtPayload } from '../utils/jwt.util';

// Extend Express Request to include user information
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Auth DTOs
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

// Task DTOs
export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date | string;
  assignedToId?: string;
  teamId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date | string | null;
  assignedToId?: string | null;
}

// Team DTOs
export interface CreateTeamDto {
  name: string;
  description?: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
}

export interface AddTeamMemberDto {
  userId: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter params
export interface TaskFilterParams extends PaginationParams {
  status?: string;
  priority?: string;
  assignedToId?: string;
  teamId?: string;
  createdById?: string;
  search?: string;
  sort?: 'dueDate' | 'updatedAt';
}

export interface TeamFilterParams extends PaginationParams {
  search?: string;
}
