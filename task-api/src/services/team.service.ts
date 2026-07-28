import type { Team, TeamMember, TeamMemberRole } from '@prisma/client';
import teamRepository from '../repositories/team.repository';
import userRepository from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';
import { AddTeamMemberDto, CreateTeamDto, UpdateTeamDto, UpdateTeamMemberDto } from '../types';

const MEMBER_ROLES: TeamMemberRole[] = ['OWNER', 'ADMIN', 'MEMBER'];

function parseMemberRole(value?: string): TeamMemberRole | undefined {
  if (!value) return undefined;
  if (!MEMBER_ROLES.includes(value as TeamMemberRole)) {
    throw new AppError(400, `Invalid role. Allowed: ${MEMBER_ROLES.join(', ')}`);
  }
  return value as TeamMemberRole;
}

export class TeamService {
  async list(userId: string): Promise<Team[]> {
    return teamRepository.findForUser(userId);
  }

  async getById(userId: string, teamId: string): Promise<Team> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new AppError(404, 'Team not found');
    }
    await this.assertIsMember(userId, teamId);
    return team;
  }

  async create(userId: string, data: CreateTeamDto): Promise<Team> {
    if (!data.name?.trim()) {
      throw new AppError(400, 'Name is required');
    }

    return teamRepository.create({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      createdById: userId,
    });
  }

  async update(userId: string, teamId: string, data: UpdateTeamDto): Promise<Team> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new AppError(404, 'Team not found');
    }
    await this.assertCanManage(userId, teamId);

    if (data.name !== undefined && !data.name.trim()) {
      throw new AppError(400, 'Name cannot be empty');
    }

    return teamRepository.update(teamId, {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
    });
  }

  async delete(userId: string, teamId: string): Promise<void> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new AppError(404, 'Team not found');
    }
    await this.assertIsOwner(userId, teamId);
    await teamRepository.delete(teamId);
  }

  async listMembers(userId: string, teamId: string): Promise<TeamMember[]> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new AppError(404, 'Team not found');
    }
    await this.assertIsMember(userId, teamId);
    return teamRepository.listMembers(teamId);
  }

  async addMember(
    userId: string,
    teamId: string,
    data: AddTeamMemberDto
  ): Promise<TeamMember> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new AppError(404, 'Team not found');
    }
    await this.assertCanManage(userId, teamId);

    if (!data.userId) {
      throw new AppError(400, 'userId is required');
    }

    const user = await userRepository.findById(data.userId);
    if (!user || !user.isActive) {
      throw new AppError(404, 'User not found');
    }

    const existing = await teamRepository.findMembership(teamId, data.userId);
    if (existing) {
      throw new AppError(409, 'User is already a member of this team');
    }

    const role = parseMemberRole(data.role) ?? 'MEMBER';
    if (role === 'OWNER') {
      throw new AppError(400, 'Cannot add a member as OWNER; transfer ownership separately');
    }

    return teamRepository.addMember({
      teamId,
      userId: data.userId,
      role,
    });
  }

  async updateMemberRole(
    userId: string,
    teamId: string,
    membershipId: string,
    data: UpdateTeamMemberDto
  ): Promise<TeamMember> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new AppError(404, 'Team not found');
    }
    await this.assertIsOwner(userId, teamId);

    const membership = await teamRepository.findMembershipById(membershipId);
    if (!membership || membership.teamId !== teamId) {
      throw new AppError(404, 'Team member not found');
    }

    const role = parseMemberRole(data.role);
    if (!role) {
      throw new AppError(400, 'role is required');
    }

    if (membership.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await teamRepository.countOwners(teamId);
      if (ownerCount <= 1) {
        throw new AppError(400, 'Cannot demote the last OWNER');
      }
    }

    return teamRepository.updateMemberRole(membershipId, role);
  }

  async removeMember(
    userId: string,
    teamId: string,
    membershipId: string
  ): Promise<void> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new AppError(404, 'Team not found');
    }
    await this.assertCanManage(userId, teamId);

    const membership = await teamRepository.findMembershipById(membershipId);
    if (!membership || membership.teamId !== teamId) {
      throw new AppError(404, 'Team member not found');
    }

    if (membership.role === 'OWNER') {
      const ownerCount = await teamRepository.countOwners(teamId);
      if (ownerCount <= 1) {
        throw new AppError(400, 'Cannot remove the last OWNER');
      }
    }

    // Admins cannot remove owners
    const actor = await teamRepository.findMembership(teamId, userId);
    if (actor?.role === 'ADMIN' && membership.role === 'OWNER') {
      throw new AppError(403, 'Only an OWNER can remove another OWNER');
    }

    await teamRepository.removeMember(membershipId);
  }

  private async assertIsMember(userId: string, teamId: string): Promise<TeamMember> {
    const membership = await teamRepository.findMembership(teamId, userId);
    if (!membership) {
      throw new AppError(403, 'You are not a member of this team');
    }
    return membership;
  }

  private async assertCanManage(userId: string, teamId: string): Promise<TeamMember> {
    const membership = await this.assertIsMember(userId, teamId);
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new AppError(403, 'Only team OWNER or ADMIN can perform this action');
    }
    return membership;
  }

  private async assertIsOwner(userId: string, teamId: string): Promise<TeamMember> {
    const membership = await this.assertIsMember(userId, teamId);
    if (membership.role !== 'OWNER') {
      throw new AppError(403, 'Only a team OWNER can perform this action');
    }
    return membership;
  }
}

export default new TeamService();
