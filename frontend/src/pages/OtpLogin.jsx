import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import AuthShell from '../components/AuthShell';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

export default function OtpLogin() {
  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
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
    <AuthShell eyebrow="Passwordless access" title="Enter your login code" subtitle="We sent a six-digit code to your email. It remains valid for 10 minutes." footer={<Link to="/forgot-password" className="text-link">Request another code</Link>}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="alert-error"><Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
        <div>
          <label htmlFor="otp-email" className="field-label">Email address</label>
          <input id="otp-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="form-control" />
        </div>
        <div>
          <label htmlFor="otp-code" className="field-label">Six-digit code</label>
          <input id="otp-code" type="text" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="form-control text-center text-xl font-semibold tracking-[0.45em]" placeholder="000000" />
        </div>
        <button type="submit" disabled={submitting || code.length !== 6} className="btn-primary w-full">
          {submitting ? 'Verifying...' : 'Verify and sign in'}
          {!submitting && <Icon name="arrowRight" className="h-4 w-4" />}
        </button>
      </form>
    </AuthShell>
  );
}
