import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to log in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow dark:bg-slate-800"
      >
        <h1 className="text-2xl font-semibold">IT Help Desk Login</h1>

        {error && (
          <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
            {error}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-center text-sm">
          No account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
