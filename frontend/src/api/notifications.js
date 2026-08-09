import client from './client';

export function listNotifications() {
  return client.get('/api/notifications').then((res) => res.data);
}

export function markNotificationRead(id) {
  return client.post(`/api/notifications/${id}/read`).then((res) => res.data);
}

export function markAllNotificationsRead() {
  return client.post('/api/notifications/read-all');
}
