import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useTaskStore } from '@/stores/task.store';
import { useNotificationStore } from '@/stores/notification.store';
import type { Task } from '@/types';

export interface RealtimePayload {
  type: 'task:created' | 'task:updated' | 'task:deleted' | 'comment:created';
  message: string;
  taskId?: string;
  teamId?: string | null;
  actorUserId?: string;
  data?: unknown;
}

let socket: Socket | null = null;

function resolveWsUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicit) return explicit.replace(/\/$/, '');

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  try {
    const url = new URL(apiBase);
    return `${url.protocol}//${url.host}`;
  } catch {
    return window.location.origin;
  }
}

function applyTaskEvent(payload: RealtimePayload): void {
  const actorId = payload.actorUserId;
  const me = useAuthStore.getState().user?.id;

  // Skip noisy toast for our own actions; still sync list for other tabs/devices
  const fromSelf = Boolean(actorId && me && actorId === me);

  if (payload.type === 'task:created' && payload.data) {
    const task = payload.data as Task;
    useTaskStore.setState((state) => {
      if (state.tasks.some((t) => t.id === task.id)) return state;
      return { tasks: [task, ...state.tasks] };
    });
  }

  if (payload.type === 'task:updated' && payload.data) {
    const task = payload.data as Task;
    useTaskStore.setState((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      currentTask: state.currentTask?.id === task.id ? task : state.currentTask,
    }));
  }

  if (payload.type === 'task:deleted' && payload.taskId) {
    const id = payload.taskId;
    useTaskStore.setState((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      currentTask: state.currentTask?.id === id ? null : state.currentTask,
    }));
  }

  if (payload.type === 'comment:created' && !fromSelf) {
    // Comments list is local to TaskComments; toast is enough here
  }

  if (!fromSelf) {
    useNotificationStore.getState().addFromRealtime(payload);
    toast.message(payload.message);
  }
}

export function connectRealtime(): void {
  const token = localStorage.getItem('accessToken');
  if (!token) return;
  if (socket?.connected) return;

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return;
  }

  socket = io(resolveWsUrl(), {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('notification', (payload: RealtimePayload) => {
    applyTaskEvent(payload);
  });

  socket.on('connect_error', () => {
    // Silent — app works without realtime
  });
}

export function disconnectRealtime(): void {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function getRealtimeSocket(): Socket | null {
  return socket;
}
