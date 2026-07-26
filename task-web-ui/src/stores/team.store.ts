import { create } from 'zustand';
import { teamService, type CreateTeamData, type UpdateTeamData } from '@/services/team.service';
import { handleApiError } from '@/services/api';
import type { Team, TeamMember } from '@/types';

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

  clearError: () => set({ error: null }),
  
  setCurrentTeam: (team: Team | null) => set({ currentTeam: team }),
}));

