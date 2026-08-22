import client from './client';

export function getReportSummary(params = {}) {
  return client.get('/api/reports/summary', { params }).then((res) => res.data);
}

export function reportExportUrl(params = {}, format = 'csv') {
  const query = new URLSearchParams({ ...params, format }).toString();
  return `${client.defaults.baseURL}/api/reports/export?${query}`;
}
