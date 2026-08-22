import { useEffect, useState } from 'react';
import { createUser, listRoles, listUsers, updateUser } from '../api/users';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

const emptyForm = { fullname: '', email: '', password: '', password_confirmation: '', roleid: '' };

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({ search: '', roleid: '', isactive: '' });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function load() {
    const params = { page };
    if (filters.search) params.search = filters.search;
    if (filters.roleid) params.roleid = filters.roleid;
    if (filters.isactive !== '') params.isactive = filters.isactive;

    listUsers(params).then(setUsers);
  }

  useEffect(() => {
    listRoles().then(setRoles);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await createUser(form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setErrors(err.response?.data?.errors ?? { general: [err.response?.data?.message ?? 'Unable to create user.'] });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(targetUser) {
    await updateUser(targetUser.id, { isactive: !targetUser.isactive });
    load();
  }

  async function changeRole(targetUser, roleid) {
    await updateUser(targetUser.id, { roleid });
    load();
  }

  function fieldError(field) {
    return errors[field]?.[0];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Create accounts, assign roles, and manage access to the workspace."
        actions={<button onClick={() => setShowForm((s) => !s)} className={showForm ? 'btn-secondary' : 'btn-primary'}><Icon name={showForm ? 'close' : 'plus'} className="h-4 w-4" />{showForm ? 'Close form' : 'Add user'}</button>}
      />

      {showForm && (
        <section className="app-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Add User</h2>
          <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
            {errors.general && <div className="alert-error sm:col-span-2"><Icon name="alert" className="h-4 w-4 shrink-0" />{errors.general[0]}</div>}
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input
                type="text"
                required
                value={form.fullname}
                onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              {fieldError('fullname') && <p className="mt-1 text-sm text-red-600">{fieldError('fullname')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              {fieldError('email') && <p className="mt-1 text-sm text-red-600">{fieldError('email')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              {fieldError('password') && <p className="mt-1 text-sm text-red-600">{fieldError('password')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password_confirmation}
                onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Role</label>
              <select
                required
                value={form.roleid}
                onChange={(e) => setForm((f) => ({ ...f, roleid: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.rolename}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="app-card p-5 sm:p-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Name or email"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <select
            value={filters.roleid}
            onChange={(e) => updateFilter('roleid', e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.rolename}
              </option>
            ))}
          </select>
          <select
            value={filters.isactive}
            onChange={(e) => updateFilter('isactive', e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">All statuses</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {users?.data.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                  <td className="px-3 py-2 font-medium">{u.fullname}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-3 py-2">
                    <select
                      value={u.roleid}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.rolename}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        u.isactive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}
                    >
                      {u.isactive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => toggleActive(u)} className="text-blue-600 hover:underline">
                      {u.isactive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {users && users.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {users && users.last_page > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary min-h-0 px-3 py-1.5"
            >
              Previous
            </button>
            <span>
              Page {users.current_page} of {users.last_page}
            </span>
            <button
              disabled={page >= users.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary min-h-0 px-3 py-1.5"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
