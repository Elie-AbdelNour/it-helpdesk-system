import client from './client';

export function listActivityLog(params = {}) {
  return client.get('/api/admin/activity-logs', { params }).then((res) => res.data);
}
