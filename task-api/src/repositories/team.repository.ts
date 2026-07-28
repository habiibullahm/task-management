import { prisma } from '../config/database';
import type { Team, TeamMember, TeamMemberRole } from '@prisma/client';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const memberInclude = {
  user: { select: userSelect },
} as const;

const teamInclude = {
  creator: { select: userSelect },
  members: {
    include: memberInclude,
    orderBy: { joinedAt: 'asc' as const },
  },
} as const;

export class TeamRepository {
  async create(data: {
    name: string;
    description?: string | null;
    createdById: string;
  }): Promise<Team> {
    return prisma.team.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        createdById: data.createdById,
        members: {
          create: {
            userId: data.createdById,
            role: 'OWNER',
          },
        },
      },
      include: teamInclude,
    });
  }

  async findById(id: string): Promise<Team | null> {
    return prisma.team.findUnique({
      where: { id },
      include: teamInclude,
    });
  }

  async findForUser(userId: string): Promise<Team[]> {
    return prisma.team.findMany({
      where: {
        members: { some: { userId } },
      },
      include: teamInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(
    id: string,
    data: { name?: string; description?: string | null }
  ): Promise<Team> {
    return prisma.team.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
      include: teamInclude,
    });
  }

  async delete(id: string): Promise<Team> {
    return prisma.team.delete({ where: { id } });
  }

  async findMembership(teamId: string, userId: string): Promise<TeamMember | null> {
    return prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId },
      },
    });
  }

  async findMembershipById(membershipId: string): Promise<TeamMember | null> {
    return prisma.teamMember.findUnique({
      where: { id: membershipId },
      include: memberInclude,
    });
  }

  async listMembers(teamId: string): Promise<TeamMember[]> {
    return prisma.teamMember.findMany({
      where: { teamId },
      include: memberInclude,
      orderBy: { joinedAt: 'asc' },
    });
  }

  async addMember(data: {
    teamId: string;
    userId: string;
    role: TeamMemberRole;
  }): Promise<TeamMember> {
    return prisma.teamMember.create({
      data: {
        teamId: data.teamId,
        userId: data.userId,
        role: data.role,
      },
      include: memberInclude,
    });
  }

  async updateMemberRole(membershipId: string, role: TeamMemberRole): Promise<TeamMember> {
    return prisma.teamMember.update({
      where: { id: membershipId },
      data: { role },
      include: memberInclude,
    });
  }

  async removeMember(membershipId: string): Promise<TeamMember> {
    return prisma.teamMember.delete({
      where: { id: membershipId },
    });
  }

  async countOwners(teamId: string): Promise<number> {
    return prisma.teamMember.count({
      where: { teamId, role: 'OWNER' },
    });
  }
}

export default new TeamRepository();
