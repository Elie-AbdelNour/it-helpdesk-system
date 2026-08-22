import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from '../api/profile';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ fullname: user?.fullname ?? '', phone: user?.phone ?? '' });
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);
    try {
      const updated = await updateProfile(form);
      updateUser(updated);
      setProfileSuccess('Profile updated.');
    } catch (err) {
      setProfileError(err.response?.data?.message ?? 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(passwordForm);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setPasswordSuccess('Password updated.');
    } catch (err) {
      setPasswordError(err.response?.data?.message ?? 'Unable to update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="My profile" description="Manage your personal details and password." />

      <section className="app-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Profile details</h2>
        <form onSubmit={handleProfileSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          {profileError && <div className="alert-error sm:col-span-2"><Icon name="alert" className="h-4 w-4 shrink-0" />{profileError}</div>}
          {profileSuccess && <div className="alert-success sm:col-span-2"><Icon name="check" className="h-4 w-4 shrink-0" />{profileSuccess}</div>}

          <div>
            <label className="field-label">Full name</label>
            <input
              type="text"
              required
              value={form.fullname}
              onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
              className="form-control"
            />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="form-control"
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" value={user?.email ?? ''} disabled className="form-control opacity-60" />
            <p className="mt-1 text-xs text-slate-400">Contact an admin to change your email address.</p>
          </div>
          <div>
            <label className="field-label">Role</label>
            <input type="text" value={user?.role?.rolename ?? ''} disabled className="form-control opacity-60" />
          </div>

          <div className="sm:col-span-2">
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      <section className="app-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 grid gap-3 sm:grid-cols-3">
          {passwordError && <div className="alert-error sm:col-span-3"><Icon name="alert" className="h-4 w-4 shrink-0" />{passwordError}</div>}
          {passwordSuccess && <div className="alert-success sm:col-span-3"><Icon name="check" className="h-4 w-4 shrink-0" />{passwordSuccess}</div>}

          <div>
            <label className="field-label">Current password</label>
            <input
              type="password"
              required
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
              className="form-control"
            />
          </div>
          <div>
            <label className="field-label">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.password}
              onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))}
              className="form-control"
            />
          </div>
          <div>
            <label className="field-label">Confirm new password</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.password_confirmation}
              onChange={(e) => setPasswordForm((f) => ({ ...f, password_confirmation: e.target.value }))}
              className="form-control"
            />
          </div>

          <div className="sm:col-span-3">
            <button type="submit" disabled={savingPassword} className="btn-primary">
              {savingPassword ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
