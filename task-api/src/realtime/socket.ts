import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import env from '../config/env';
import { JwtUtil } from '../utils/jwt.util';
import teamRepository from '../repositories/team.repository';

export type RealtimeEvent =
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'comment:created';

export interface RealtimePayload {
  type: RealtimeEvent;
  message: string;
  taskId?: string;
  teamId?: string | null;
  actorUserId?: string;
  data?: unknown;
}

let io: Server | null = null;

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function initRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.get('CORS_ORIGIN'),
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (typeof socket.handshake.headers.authorization === 'string'
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : undefined);

      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = JwtUtil.verifyAccessToken(token);
      socket.data.userId = payload.userId;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    void socket.join(userRoom(userId));
  });

  return io;
}

export function getRealtime(): Server | null {
  return io;
}

/** Notify interested users about a task-related event (no-op if sockets not initialized). */
export async function emitTaskRealtime(options: {
  type: RealtimeEvent;
  message: string;
  actorUserId: string;
  taskId: string;
  createdById: string;
  assignedToId?: string | null;
  teamId?: string | null;
  data?: unknown;
}): Promise<void> {
  if (!io) return;

  const recipientIds = new Set<string>();
  recipientIds.add(options.createdById);
  if (options.assignedToId) recipientIds.add(options.assignedToId);

  if (options.teamId) {
    try {
      const members = await teamRepository.listMembers(options.teamId);
      for (const member of members) {
        recipientIds.add(member.userId);
      }
    } catch {
      // ignore membership lookup failures for realtime fan-out
    }
  }

  const payload: RealtimePayload = {
    type: options.type,
    message: options.message,
    taskId: options.taskId,
    teamId: options.teamId ?? null,
    actorUserId: options.actorUserId,
    data: options.data,
  };

  for (const userId of recipientIds) {
    io.to(userRoom(userId)).emit('notification', payload);
  }
}
