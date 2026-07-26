import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  deleteTicket,
  getTicket,
  listCategories,
  listPriorities,
  updateTicket,
} from '../api/tickets';

const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', categoryid: '', priorityid: '' });
  const [errors, setErrors] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories);
    listPriorities().then(setPriorities);
  }, []);

  useEffect(() => {
    setNotFound(false);
    getTicket(id)
      .then((t) => {
        setTicket(t);
        setForm({
          subject: t.subject,
          description: t.description,
          categoryid: String(t.categoryid),
          priorityid: String(t.priorityid),
        });
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return <p className="text-slate-500">Ticket not found, or you don't have access to it.</p>;
  }

  if (!ticket) {
    return <p className="text-slate-500">Loading...</p>;
  }

  const isManager = MANAGING_ROLES.includes(user.role?.rolename);
  const isOwner = ticket.creator?.id === user.id;
  const canEdit = isManager || isOwner;
  const canDelete = user.role?.rolename === 'Admin' || isOwner;

  async function handleSave(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const updated = await updateTicket(id, form);
      setTicket(updated);
      setEditing(false);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        setErrors({ general: [err.response?.data?.message ?? 'Unable to update ticket.'] });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ticket ${ticket.ticketrefno}? This cannot be undone.`)) return;
    await deleteTicket(id);
    navigate('/tickets');
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{ticket.ticketrefno}</h1>
        <div className="flex gap-2">
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded bg-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-500 dark:text-slate-400">
        <div>
          <dt>Status</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">{ticket.status?.name}</dd>
        </div>
        <div>
          <dt>Created by</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            {ticket.creator?.fullname}
          </dd>
        </div>
      </dl>

      {editing ? (
        <form onSubmit={handleSave} className="mt-6 space-y-4">
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
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium">Category</label>
              <select
                value={form.categoryid}
                onChange={(e) => setForm((f) => ({ ...f, categoryid: e.target.value }))}
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
                value={form.priorityid}
                onChange={(e) => setForm((f) => ({ ...f, priorityid: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              >
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded bg-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Subject</h2>
            <p>{ticket.subject}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</h2>
            <p className="whitespace-pre-wrap">{ticket.description}</p>
          </div>
          <div className="flex gap-8">
            <div>
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Category</h2>
              <p>{ticket.category?.name}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Priority</h2>
              <p>{ticket.priority?.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
