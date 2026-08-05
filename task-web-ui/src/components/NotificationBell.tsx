import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const navigate = useNavigate();
  const { items, unreadCount, markAllRead, clear } = useNotificationStore();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((v) => !v);
    if (!open) markAllRead();
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
        onClick={toggle}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-md border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => {
                clear();
                setOpen(false);
              }}
            >
              Clear
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      'w-full border-b border-border px-3 py-2 text-left text-sm hover:bg-muted/60',
                      !item.read && 'bg-primary/5'
                    )}
                    onClick={() => {
                      setOpen(false);
                      if (item.taskId) navigate(`/tasks/${item.taskId}`);
                    }}
                  >
                    <p>{item.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
