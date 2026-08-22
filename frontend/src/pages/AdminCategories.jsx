import { useEffect, useState } from 'react';
import { listCategories } from '../api/tickets';
import { createCategory, updateCategory } from '../api/categories';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    listCategories().then(setCategories);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(category) {
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description ?? '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: '', description: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await updateCategory(editingId, form);
      } else {
        await createCategory(form);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to save category.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Configuration" title="Ticket categories" description="Keep request classification clear and easy for employees to understand." />

      <section className="app-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{editingId ? 'Edit Category' : 'Add Category'}</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          {error && <div className="alert-error sm:col-span-2"><Icon name="alert" className="h-4 w-4 shrink-0" />{error}</div>}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Category'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="app-card overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                <td className="px-3 py-2 font-medium">{category.name}</td>
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{category.description ?? '-'}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => startEdit(category)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
