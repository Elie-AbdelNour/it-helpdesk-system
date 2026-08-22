import { createContext, useContext, useEffect, useRef, useState } from 'react';
import client, { ensureCsrfCookie } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionChecked = useRef(false);

  useEffect(() => {
    // React StrictMode runs mount effects twice in development. A duplicate
    // session request can race the CSRF-cookie request on the login screen and
    // leave Axios holding a token for a replaced session.
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    client
      .get('/api/user')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    await ensureCsrfCookie();
    const res = await client.post('/api/login', { email, password });
    setUser(res.data.user);
  }

  async function loginWithOtp(email, code) {
    await ensureCsrfCookie();
    const res = await client.post('/api/login/otp/verify', { email, code });
    setUser(res.data.user);
  }

  async function register(fullname, email, password, passwordConfirmation, phone) {
    await ensureCsrfCookie();
    const res = await client.post('/api/register', {
      fullname,
      email,
      password,
      password_confirmation: passwordConfirmation,
      phone,
    });
    setUser(res.data.user);
  }

  async function logout() {
    await client.post('/api/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithOtp, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
