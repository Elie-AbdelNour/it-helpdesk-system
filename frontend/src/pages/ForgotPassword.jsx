import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { forgotPassword, requestOtp } from '../api/auth';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  async function handleSendLink() {
    setError(null);
    setMessage(null);
    setSubmitting('link');
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to send reset link.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSendCode() {
    setError(null);
    setMessage(null);
    setSubmitting('code');
    try {
      await requestOtp(email);
      navigate(`/login/otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to send login code.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow dark:bg-slate-800">
        <h1 className="text-2xl font-semibold">Forgot Password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your email, then choose how you&rsquo;d like to get back in.
        </p>

        {message && (
          <p className="rounded bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {message}
          </p>
        )}
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

        <div className="space-y-2">
          <button
            type="button"
            disabled={!email || submitting === 'link'}
            onClick={handleSendLink}
            className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting === 'link' ? 'Sending...' : 'Email me a reset link'}
          </button>
          <button
            type="button"
            disabled={!email || submitting === 'code'}
            onClick={handleSendCode}
            className="w-full rounded bg-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {submitting === 'code' ? 'Sending...' : 'Email me a login code'}
          </button>
        </div>

        <p className="text-center text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
