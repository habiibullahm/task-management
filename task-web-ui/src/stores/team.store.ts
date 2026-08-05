import { create } from 'zustand';
import {
  teamService,
  type AddTeamMemberData,
  type CreateTeamData,
  type UpdateTeamData,
} from '@/services/team.service';
import { handleApiError } from '@/services/api';
import type { Team, TeamMember, TeamMemberRole } from '@/types';

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTeams: () => Promise<void>;
  fetchTeam: (id: string) => Promise<void>;
  createTeam: (data: CreateTeamData) => Promise<Team>;
  updateTeam: (id: string, data: UpdateTeamData) => Promise<Team>;
  deleteTeam: (id: string) => Promise<void>;
  fetchTeamMembers: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, data: AddTeamMemberData) => Promise<TeamMember>;
  removeTeamMember: (teamId: string, memberId: string) => Promise<void>;
  updateTeamMemberRole: (
    teamId: string,
    memberId: string,
    role: TeamMemberRole
  ) => Promise<TeamMember>;
  clearError: () => void;
  setCurrentTeam: (team: Team | null) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  teams: [],
  currentTeam: null,
  teamMembers: [],
  isLoading: false,
  error: null,

  fetchTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const teams = await teamService.getTeams();
      set({ teams, isLoading: false });
    } catch (error) {
      set({ error: handleApiError(error, 'Failed to fetch teams'), isLoading: false });
    }
  },

  fetchTeam: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const team = await teamService.getTeam(id);
      set({ currentTeam: team, isLoading: false });
    } catch (error) {
      set({ error: handleApiError(error, 'Failed to fetch team'), isLoading: false });
    }
  },

  createTeam: async (data: CreateTeamData) => {
    set({ isLoading: true, error: null });
    try {
      const team = await teamService.createTeam(data);
      set((state) => ({ 
        teams: [...state.teams, team], 
        isLoading: false 
      }));
      return team;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create team');
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateTeam: async (id: string, data: UpdateTeamData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTeam = await teamService.updateTeam(id, data);
      set((state) => ({
        teams: state.teams.map((team) => (team.id === id ? updatedTeam : team)),
        currentTeam: state.currentTeam?.id === id ? updatedTeam : state.currentTeam,
        isLoading: false,
      }));
      return updatedTeam;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update team');
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteTeam: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await teamService.deleteTeam(id);
      set((state) => ({
        teams: state.teams.filter((team) => team.id !== id),
        currentTeam: state.currentTeam?.id === id ? null : state.currentTeam,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete team');
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchTeamMembers: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const members = await teamService.getTeamMembers(teamId);
      set({ teamMembers: members, isLoading: false });
    } catch (error) {
      set({ error: handleApiError(error, 'Failed to fetch team members'), isLoading: false });
    }
  },

  addTeamMember: async (teamId: string, data: AddTeamMemberData) => {
    set({ isLoading: true, error: null });
    try {
      const member = await teamService.addTeamMember(teamId, data);
      set((state) => ({
        teamMembers: [...state.teamMembers, member],
        currentTeam:
          state.currentTeam?.id === teamId
            ? {
                ...state.currentTeam,
                members: [...(state.currentTeam.members ?? []), member],
              }
            : state.currentTeam,
        isLoading: false,
      }));
      return member;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to add team member');
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  removeTeamMember: async (teamId: string, memberId: string) => {
    set({ isLoading: true, error: null });
    try {
      await teamService.removeTeamMember(teamId, memberId);
      set((state) => ({
        teamMembers: state.teamMembers.filter((m) => m.id !== memberId),
        currentTeam:
          state.currentTeam?.id === teamId
            ? {
                ...state.currentTeam,
                members: (state.currentTeam.members ?? []).filter((m) => m.id !== memberId),
              }
            : state.currentTeam,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to remove team member');
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateTeamMemberRole: async (teamId: string, memberId: string, role: TeamMemberRole) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await teamService.updateTeamMemberRole(teamId, memberId, role);
      set((state) => ({
        teamMembers: state.teamMembers.map((m) => (m.id === memberId ? updated : m)),
        currentTeam:
          state.currentTeam?.id === teamId
            ? {
                ...state.currentTeam,
                members: (state.currentTeam.members ?? []).map((m) =>
                  m.id === memberId ? updated : m
                ),
              }
            : state.currentTeam,
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update team member role');
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  clearError: () => set({ error: null }),

  setCurrentTeam: (team: Team | null) => set({ currentTeam: team }),
}));

