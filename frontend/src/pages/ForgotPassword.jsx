import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { forgotPassword, requestOtp } from '../api/auth';
import AuthShell from '../components/AuthShell';
import Icon from '../components/Icon';

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
      const response = await forgotPassword(email);
      setMessage(response.message);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to send a reset link.');
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
      setError(err.response?.data?.message ?? 'Unable to send a login code.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Get back into your account"
      subtitle="Enter your email and choose the recovery method that works best for you."
      footer={<Link to="/login" className="text-link inline-flex items-center gap-2"><Icon name="arrowLeft" className="h-4 w-4" />Back to sign in</Link>}
    >
      <div className="space-y-5">
        {message && <div className="alert-success"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" /><span>{message}</span></div>}
        {error && <div className="alert-error"><Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

        <div>
          <label htmlFor="recovery-email" className="field-label">Email address</label>
          <input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="form-control" placeholder="name@company.com" />
        </div>

        <div className="grid gap-3">
          <button type="button" disabled={!email || submitting !== null} onClick={handleSendLink} className="btn-primary w-full">
            {submitting === 'link' ? 'Sending link...' : 'Email password reset link'}
          </button>
          <button type="button" disabled={!email || submitting !== null} onClick={handleSendCode} className="btn-secondary w-full">
            {submitting === 'code' ? 'Sending code...' : 'Send one-time login code'}
          </button>
        </div>

        <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          For security, we show the same response whether or not an email exists in the system.
        </p>
      </div>
    </AuthShell>
  );
}
