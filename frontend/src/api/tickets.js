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

export function assignTicket(id, payload) {
  return client.post(`/api/tickets/${id}/assign`, payload).then((res) => res.data);
}

export function escalateTicket(id, payload) {
  return client.post(`/api/tickets/${id}/escalate`, payload).then((res) => res.data);
}

export function updateTicketStatus(id, payload) {
  return client.post(`/api/tickets/${id}/status`, payload).then((res) => res.data);
}

export function addTicketComment(id, payload) {
  return client.post(`/api/tickets/${id}/comments`, payload).then((res) => res.data);
}

export function getTicketHistory(id, params = {}) {
  return client.get(`/api/tickets/${id}/history`, { params }).then((res) => res.data);
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

export function listAssignableUsers() {
  return client.get('/api/assignable-users').then((res) => res.data);
}
