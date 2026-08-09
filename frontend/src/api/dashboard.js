import client from './client';

export function getDashboardStats() {
  return client.get('/api/dashboard/stats').then((res) => res.data);
}
