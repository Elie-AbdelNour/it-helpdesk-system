import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { createTicket, listCategories, listPriorities } from '../api/tickets';

export default function TicketCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [categoryid, setCategoryid] = useState('');
  const [priorityid, setPriorityid] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCategories().then((cats) => {
      setCategories(cats);
      if (cats.length) setCategoryid(String(cats[0].id));
    });
    listPriorities().then((prios) => {
      setPriorities(prios);
      if (prios.length) setPriorityid(String(prios[0].id));
    });
  }, []);

  function fieldError(field) {
    return errors[field]?.[0];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const ticket = await createTicket({ subject, description, categoryid, priorityid });
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        setErrors({ general: [err.response?.data?.message ?? 'Unable to create ticket.'] });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-lg bg-white p-8 shadow dark:bg-slate-800">
      <h1 className="text-2xl font-semibold">New Ticket</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {errors.general && (
          <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
            {errors.general[0]}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium">Subject</label>
          <input
            type="text"
            required
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          />
          {fieldError('subject') && <p className="mt-1 text-sm text-red-600">{fieldError('subject')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          />
          {fieldError('description') && (
            <p className="mt-1 text-sm text-red-600">{fieldError('description')}</p>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">Category</label>
            <select
              value={categoryid}
              onChange={(e) => setCategoryid(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium">Priority</label>
            <select
              value={priorityid}
              onChange={(e) => setPriorityid(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
            >
              {priorities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.targetresolutionhours}h target)
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  );
}
