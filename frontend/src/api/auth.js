import client from './client';

export function forgotPassword(email) {
  return client.post('/api/forgot-password', { email }).then((res) => res.data);
}

export function resetPassword(payload) {
  return client.post('/api/reset-password', payload).then((res) => res.data);
}

export function requestOtp(email) {
  return client.post('/api/login/otp/request', { email }).then((res) => res.data);
}

export function loginWithOtp(email, code) {
  return client.post('/api/login/otp/verify', { email, code }).then((res) => res.data);
}
