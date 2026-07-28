import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { connectRealtime, disconnectRealtime } from '@/services/realtime';

/** Keeps a Socket.IO connection alive while the user is authenticated. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      connectRealtime();
    } else {
      disconnectRealtime();
    }
    return () => {
      // Keep connection across protected route remounts; disconnect only on logout
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
