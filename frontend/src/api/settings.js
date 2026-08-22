import client from './client';

export function getSettings() {
  return client.get('/api/admin/settings').then((res) => res.data);
}

export function updateSetting(key, value) {
  return client.patch('/api/admin/settings', { key, value }).then((res) => res.data);
}
