import { createContext, useContext, useEffect, useState } from 'react';
import client, { ensureCsrfCookie } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  async function register(fullname, email, password, phone) {
    await ensureCsrfCookie();
    const res = await client.post('/api/register', { fullname, email, password, phone });
    setUser(res.data.user);
  }

  async function logout() {
    await client.post('/api/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
