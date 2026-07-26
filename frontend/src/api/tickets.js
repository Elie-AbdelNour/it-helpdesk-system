import client from './client';

export function listTickets(params = {}) {
  return client.get('/api/tickets', { params }).then((res) => res.data);
}

export function getTicket(id) {
  return client.get(`/api/tickets/${id}`).then((res) => res.data);
}

export function createTicket(payload) {
  return client.post('/api/tickets', payload).then((res) => res.data);
}

export function updateTicket(id, payload) {
  return client.put(`/api/tickets/${id}`, payload).then((res) => res.data);
}

export function deleteTicket(id) {
  return client.delete(`/api/tickets/${id}`);
}

export function listCategories() {
  return client.get('/api/categories').then((res) => res.data);
}

export function listPriorities() {
  return client.get('/api/priorities').then((res) => res.data);
}

export function listStatuses() {
  return client.get('/api/statuses').then((res) => res.data);
}
