import axios from 'axios';

function apiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  const pageHost = window.location.hostname;
  const localHosts = ['localhost', '127.0.0.1'];

  if (!localHosts.includes(pageHost)) {
    return configuredUrl;
  }

  const url = new URL(configuredUrl);
  if (localHosts.includes(url.hostname)) {
    url.hostname = pageHost;
  }

  return url.toString().replace(/\/$/, '');
}

const client = axios.create({
  baseURL: apiUrl(),
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
});

export async function ensureCsrfCookie() {
  await client.get('/sanctum/csrf-cookie');
}

export default client;
