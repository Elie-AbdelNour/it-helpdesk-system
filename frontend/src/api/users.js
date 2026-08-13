import client from './client';

export function listRoles() {
  return client.get('/api/roles').then((res) => res.data);
}

export function listUsers(params = {}) {
  return client.get('/api/admin/users', { params }).then((res) => res.data);
}

export function createUser(payload) {
  return client.post('/api/admin/users', payload).then((res) => res.data);
}

export function updateUser(id, payload) {
  return client.patch(`/api/admin/users/${id}`, payload).then((res) => res.data);
}
