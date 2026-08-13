import client from './client';

export function createCategory(payload) {
  return client.post('/api/admin/categories', payload).then((res) => res.data);
}

export function updateCategory(id, payload) {
  return client.patch(`/api/admin/categories/${id}`, payload).then((res) => res.data);
}
