import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { resetPassword } from '../api/auth';
import AuthShell from '../components/AuthShell';
import Icon from '../components/Icon';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ email, token, password, password_confirmation: passwordConfirmation });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to reset the password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token || !email) {
    return (
      <AuthShell eyebrow="Invalid link" title="This reset link is incomplete" subtitle="Request a new reset link to continue safely." footer={<Link to="/login" className="text-link">Back to sign in</Link>}>
        <div className="alert-error"><Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /><span>The link is missing the account email or security token.</span></div>
        <Link to="/forgot-password" className="btn-primary mt-5 w-full">Request a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Secure reset" title="Choose a new password" subtitle={`Updating the password for ${email}`} footer={<Link to="/login" className="text-link">Cancel and return to sign in</Link>}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="alert-error"><Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
        <div>
          <label htmlFor="new-password" className="field-label">New password</label>
          <input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-control" placeholder="At least 8 characters" />
        </div>
        <div>
          <label htmlFor="new-password-confirmation" className="field-label">Confirm new password</label>
          <input id="new-password-confirmation" type="password" required minLength={8} autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="form-control" placeholder="Repeat your new password" />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Updating password...' : 'Update password'}</button>
      </form>
    </AuthShell>
  );
}
