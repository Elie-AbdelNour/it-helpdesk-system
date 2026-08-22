import client from './client';

export function updateProfile(payload) {
  return client.patch('/api/profile', payload).then((res) => res.data);
}

export function updatePassword(payload) {
  return client.post('/api/profile/password', payload).then((res) => res.data);
}
