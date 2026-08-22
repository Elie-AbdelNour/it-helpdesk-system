import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    refetchInterval: 20000,
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadcount ?? 0;

  async function handleOpen(notification) {
    if (!notification.isread) {
      await markNotificationRead(notification.id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    if (notification.ticketid) {
      navigate(`/tickets/${notification.ticketid}`);
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Everything that has happened on tickets involving you."
        actions={
          unreadCount > 0 && (
            <button type="button" onClick={handleMarkAllRead} className="btn-secondary">
              Mark all read
            </button>
          )
        }
      />

      <section className="app-card overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-slate-400">Loading...</p>}
        {!isLoading && notifications.length === 0 && (
          <p className="p-10 text-center text-sm text-slate-400">You&rsquo;re all caught up.</p>
        )}
        {notifications.map((notification) => (
          <button
            key={notification.id}
            onClick={() => handleOpen(notification)}
            className={`flex w-full items-start gap-3 border-b border-slate-100 px-5 py-4 text-left text-sm last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
              notification.isread ? 'text-slate-500 dark:text-slate-400' : 'bg-blue-50/30 font-medium text-slate-900 dark:bg-blue-500/10 dark:text-slate-100'
            }`}
          >
            <Icon name={notification.type === 'mention' ? 'profile' : 'tickets'} className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span className="flex-1">
              <span className="block">{notification.message}</span>
              <span className="mt-1 block text-xs text-slate-400">{formatDateTime(notification.createdat)}</span>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
