import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function OtpLogin() {
  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithOtp(email, code);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message ?? 'That code is invalid or has expired.');
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
        <h1 className="text-2xl font-semibold">Log in with a Code</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter the 6-digit code we emailed you.
        </p>

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
          <label className="block text-sm font-medium">Login Code</label>
          <input
            type="text"
            required
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 tracking-widest dark:border-slate-600 dark:bg-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Verifying...' : 'Log in'}
        </button>

        <p className="text-center text-sm">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Didn&rsquo;t get a code? Request one
          </Link>
        </p>
      </form>
    </div>
  );
}
