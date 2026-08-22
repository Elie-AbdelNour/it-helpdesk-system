import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import AuthShell from '../components/AuthShell';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});

    if (password !== passwordConfirmation) {
      setErrors({ password_confirmation: ['Passwords do not match.'] });
      return;
    }

    setSubmitting(true);
    try {
      await register(fullname, email, password, passwordConfirmation, phone);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {});
      else setErrors({ general: [err.response?.data?.message ?? 'Unable to create your account.'] });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldError = (field) => errors[field]?.[0];

  return (
    <AuthShell
      eyebrow="Employee access"
      title="Create your account"
      subtitle="Register to submit requests and follow their progress. New registrations receive the Employee role."
      footer={<>Already have an account? <Link to="/login" className="text-link">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="alert-error" role="alert">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errors.general[0]}</span>
          </div>
        )}

        <div>
          <label htmlFor="fullname" className="field-label">Full name</label>
          <input id="fullname" type="text" required autoComplete="name" value={fullname} onChange={(event) => setFullname(event.target.value)} className="form-control" placeholder="Your full name" />
          {fieldError('fullname') && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{fieldError('fullname')}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-email" className="field-label">Email address</label>
            <input id="register-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="form-control" placeholder="name@company.com" />
            {fieldError('email') && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{fieldError('email')}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="field-label">Phone <span className="font-normal text-slate-400">(optional)</span></label>
            <input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="form-control" placeholder="+961 ..." />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-password" className="field-label">Password</label>
            <input id="register-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-control" placeholder="8+ characters" />
            {fieldError('password') && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{fieldError('password')}</p>}
          </div>
          <div>
            <label htmlFor="confirm-password" className="field-label">Confirm password</label>
            <input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="form-control" placeholder="Repeat password" />
            {fieldError('password_confirmation') && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{fieldError('password_confirmation')}</p>}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full">
          {submitting ? 'Creating account...' : 'Create account'}
          {!submitting && <Icon name="arrowRight" className="h-4 w-4" />}
        </button>
      </form>
    </AuthShell>
  );
}
