import client from './client';

export function uploadAttachment(ticketId, file, commentId = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (commentId) {
    formData.append('commentid', commentId);
  }

  return client
    .post(`/api/tickets/${ticketId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
}

export function deleteAttachment(ticketId, attachmentId) {
  return client.delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`);
}

export function attachmentDownloadUrl(ticketId, attachmentId) {
  return `${client.defaults.baseURL}/api/tickets/${ticketId}/attachments/${attachmentId}/download`;
}
