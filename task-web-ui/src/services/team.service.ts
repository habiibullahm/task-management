import apiClient from './api';
import type { ApiResponse, Team, TeamMember, TeamMemberRole } from '@/types';

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
}

export interface AddTeamMemberData {
  userId: string;
  role?: TeamMemberRole;
}

export const teamService = {
  // Get all teams
  async getTeams(): Promise<Team[]> {
    const response = await apiClient.get<ApiResponse<Team[]>>('/teams');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch teams');
  },

  // Get a single team by ID
  async getTeam(id: string): Promise<Team> {
    const response = await apiClient.get<ApiResponse<Team>>(`/teams/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch team');
  },

  // Create a new team
  async createTeam(data: CreateTeamData): Promise<Team> {
    const response = await apiClient.post<ApiResponse<Team>>('/teams', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create team');
  },

  // Update a team
  async updateTeam(id: string, data: UpdateTeamData): Promise<Team> {
    const response = await apiClient.put<ApiResponse<Team>>(`/teams/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update team');
  },

  // Delete a team
  async deleteTeam(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(`/teams/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete team');
    }
  },

  // Get team members
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const response = await apiClient.get<ApiResponse<TeamMember[]>>(`/teams/${teamId}/members`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch team members');
  },

  // Add member to team
  async addTeamMember(teamId: string, data: AddTeamMemberData): Promise<TeamMember> {
    const response = await apiClient.post<ApiResponse<TeamMember>>(`/teams/${teamId}/members`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to add team member');
  },

  // Remove member from team
  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(`/teams/${teamId}/members/${memberId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove team member');
    }
  },

  // Update team member role
  async updateTeamMemberRole(teamId: string, memberId: string, role: TeamMemberRole): Promise<TeamMember> {
    const response = await apiClient.put<ApiResponse<TeamMember>>(
      `/teams/${teamId}/members/${memberId}`,
      { role }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update team member role');
  },
};

