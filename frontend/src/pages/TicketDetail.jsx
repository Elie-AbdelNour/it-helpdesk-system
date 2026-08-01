import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  addTicketComment,
  assignTicket,
  deleteTicket,
  getTicket,
  getTicketHistory,
  listAssignableUsers,
  listCategories,
  listPriorities,
  listStatuses,
  updateTicket,
  updateTicketStatus,
} from '../api/tickets';

const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function resolutionLabel(ticket) {
  if (ticket.actualresolutionminutes !== null) {
    return formatDuration(ticket.actualresolutionminutes);
  }

  return `Open ${formatDuration(ticket.elapsedresolutionminutes)}`;
}

function resolutionStateText(state) {
  const labels = {
    open: 'Open',
    overdue: 'Overdue',
    resolved: 'Resolved',
    resolved_within_target: 'Within target',
    resolved_late: 'Resolved late',
  };

  return labels[state] ?? state;
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isManagingUser = MANAGING_ROLES.includes(user.role?.rolename);

  const [ticket, setTicket] = useState(null);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [agents, setAgents] = useState([]);
  const [history, setHistory] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', categoryid: '', priorityid: '' });
  const [statusForm, setStatusForm] = useState({ statusid: '', notes: '' });
  const [assignmentForm, setAssignmentForm] = useState({ assignedto: '', notes: '' });
  const [commentForm, setCommentForm] = useState({ commenttext: '', isinternal: false });
  const [historyFilters, setHistoryFilters] = useState({ datefrom: '', dateto: '' });
  const [errors, setErrors] = useState({});
  const [workflowError, setWorkflowError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(null);

  const syncTicket = useCallback((nextTicket) => {
    setTicket(nextTicket);
    setForm({
      subject: nextTicket.subject,
      description: nextTicket.description,
      categoryid: String(nextTicket.categoryid),
      priorityid: String(nextTicket.priorityid),
    });
    setStatusForm((current) => ({
      ...current,
      statusid: String(nextTicket.statusid),
    }));
    setAssignmentForm((current) => ({
      ...current,
      assignedto: nextTicket.assignedto ? String(nextTicket.assignedto) : '',
    }));
  }, []);

  const loadTicket = useCallback(() => {
    setNotFound(false);
    return getTicket(id)
      .then(syncTicket)
      .catch(() => setNotFound(true));
  }, [id, syncTicket]);

  const loadHistory = useCallback(() => {
    const params = {};
    if (historyFilters.datefrom) params.datefrom = historyFilters.datefrom;
    if (historyFilters.dateto) params.dateto = historyFilters.dateto;

    return getTicketHistory(id, params)
      .then(setHistory)
      .catch(() => setHistory(null));
  }, [historyFilters.datefrom, historyFilters.dateto, id]);

  useEffect(() => {
    Promise.all([
      listCategories(),
      listPriorities(),
      listStatuses(),
      isManagingUser ? listAssignableUsers() : Promise.resolve([]),
    ]).then(([cats, prios, stats, users]) => {
      setCategories(cats);
      setPriorities(prios);
      setStatuses(stats);
      setAgents(users);
    });
  }, [isManagingUser]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function refreshWorkflow(nextTicket = null) {
    if (nextTicket) {
      syncTicket(nextTicket);
    } else {
      await loadTicket();
    }
    await loadHistory();
  }

  async function handleSave(e) {
    e.preventDefault();
    setErrors({});
    setWorkflowError(null);
    setSubmitting('ticket');
    try {
      const updated = await updateTicket(id, form);
      await refreshWorkflow(updated);
      setEditing(false);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        setErrors({ general: [err.response?.data?.message ?? 'Unable to update ticket.'] });
      }
    } finally {
      setSubmitting(null);
    }
  }

  async function handleStatusSubmit(e) {
    e.preventDefault();
    setWorkflowError(null);
    setSubmitting('status');
    try {
      const updated = await updateTicketStatus(id, statusForm);
      setStatusForm((current) => ({ ...current, notes: '' }));
      await refreshWorkflow(updated);
    } catch (err) {
      setWorkflowError(err.response?.data?.message ?? 'Unable to update status.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    setWorkflowError(null);
    setSubmitting('assignment');
    try {
      const updated = await assignTicket(id, assignmentForm);
      setAssignmentForm((current) => ({ ...current, notes: '' }));
      await refreshWorkflow(updated);
    } catch (err) {
      setWorkflowError(err.response?.data?.message ?? 'Unable to assign ticket.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault();
    setWorkflowError(null);
    setSubmitting('comment');
    try {
      await addTicketComment(id, commentForm);
      setCommentForm({ commenttext: '', isinternal: false });
      await refreshWorkflow();
    } catch (err) {
      setWorkflowError(err.response?.data?.message ?? 'Unable to add comment.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ticket ${ticket.ticketrefno}? This cannot be undone.`)) return;
    await deleteTicket(id);
    navigate('/tickets');
  }

  function fieldError(field) {
    return errors[field]?.[0];
  }

  if (notFound) {
    return <p className="text-slate-500">Ticket not found, or you do not have access to it.</p>;
  }

  if (!ticket) {
    return <p className="text-slate-500">Loading...</p>;
  }

  const isOwner = ticket.creator?.id === user.id;
  const canEdit = isManagingUser || isOwner;
  const canDelete = user.role?.rolename === 'Admin' || isOwner;
  const resolutionIsLate = ticket.resolutionstate === 'overdue' || ticket.resolutionstate === 'resolved_late';

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{ticket.ticketrefno}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ticket.subject}</p>
          </div>
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

        <dl className="mt-5 grid gap-4 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt>Status</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{ticket.status?.name}</dd>
          </div>
          <div>
            <dt>Assigned to</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {ticket.agent?.fullname ?? '-'}
            </dd>
          </div>
          <div>
            <dt>Created by</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {ticket.creator?.fullname}
            </dd>
          </div>
          <div>
            <dt>Priority target</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {ticket.targetresolutionhours ? `${ticket.targetresolutionhours}h` : '-'}
            </dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {formatDateTime(ticket.createdat)}
            </dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {formatDateTime(ticket.resolutiondueat)}
            </dd>
          </div>
          <div>
            <dt>Resolved</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {formatDateTime(ticket.resolvedat)}
            </dd>
          </div>
          <div>
            <dt>Actual resolution</dt>
            <dd className={resolutionIsLate ? 'font-medium text-red-600' : 'font-medium text-slate-900 dark:text-slate-100'}>
              {resolutionLabel(ticket)} ({resolutionStateText(ticket.resolutionstate)})
            </dd>
          </div>
        </dl>
      </section>

      {editing && (
        <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <h2 className="text-lg font-semibold">Edit Ticket</h2>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
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
              {fieldError('subject') && <p className="mt-1 text-sm text-red-600">{fieldError('subject')}</p>}
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
              {fieldError('description') && (
                <p className="mt-1 text-sm text-red-600">{fieldError('description')}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
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
              <div>
                <label className="block text-sm font-medium">Priority</label>
                <select
                  value={form.priorityid}
                  onChange={(e) => setForm((f) => ({ ...f, priorityid: e.target.value }))}
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

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting === 'ticket'}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting === 'ticket' ? 'Saving...' : 'Save'}
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
        </section>
      )}

      {!editing && (
        <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</h2>
              <p className="mt-1 whitespace-pre-wrap">{ticket.description}</p>
            </div>
            <div className="flex flex-wrap gap-8">
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
        </section>
      )}

      {workflowError && (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
          {workflowError}
        </p>
      )}

      {isManagingUser && (
        <section className="grid gap-4 md:grid-cols-2">
          <form onSubmit={handleStatusSubmit} className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
            <h2 className="text-lg font-semibold">Status</h2>
            <div className="mt-4 space-y-3">
              <select
                value={statusForm.statusid}
                onChange={(e) => setStatusForm((f) => ({ ...f, statusid: e.target.value }))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <textarea
                rows={3}
                placeholder="Status notes"
                value={statusForm.notes}
                onChange={(e) => setStatusForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <button
                type="submit"
                disabled={submitting === 'status'}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting === 'status' ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>

          <form onSubmit={handleAssignSubmit} className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
            <h2 className="text-lg font-semibold">Assignment</h2>
            <div className="mt-4 space-y-3">
              <select
                required
                value={assignmentForm.assignedto}
                onChange={(e) => setAssignmentForm((f) => ({ ...f, assignedto: e.target.value }))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="">Select agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.fullname} ({agent.role?.rolename})
                  </option>
                ))}
              </select>
              <textarea
                rows={3}
                placeholder="Assignment notes"
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <button
                type="submit"
                disabled={submitting === 'assignment'}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting === 'assignment' ? 'Assigning...' : 'Assign Ticket'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <h2 className="text-lg font-semibold">Comments</h2>
        <form onSubmit={handleCommentSubmit} className="mt-4 space-y-3">
          <textarea
            rows={4}
            required
            placeholder="Add comment"
            value={commentForm.commenttext}
            onChange={(e) => setCommentForm((f) => ({ ...f, commenttext: e.target.value }))}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {isManagingUser && (
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={commentForm.isinternal}
                  onChange={(e) => setCommentForm((f) => ({ ...f, isinternal: e.target.checked }))}
                />
                Internal note
              </label>
            )}
            <button
              type="submit"
              disabled={submitting === 'comment'}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting === 'comment' ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {ticket.comments?.map((comment) => (
            <div key={comment.id} className="border-t border-slate-200 pt-3 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{comment.user?.fullname}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {formatDateTime(comment.createdat)}
                </span>
                {comment.isinternal && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    Internal
                  </span>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{comment.commenttext}</p>
            </div>
          ))}
          {ticket.comments?.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              From
              <input
                type="date"
                value={historyFilters.datefrom}
                onChange={(e) => setHistoryFilters((f) => ({ ...f, datefrom: e.target.value }))}
                className="mt-1 block rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              To
              <input
                type="date"
                value={historyFilters.dateto}
                onChange={(e) => setHistoryFilters((f) => ({ ...f, dateto: e.target.value }))}
                className="mt-1 block rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {history?.timeline?.map((item, index) => (
            <div key={`${item.type}-${item.createdat}-${index}`} className="border-l-2 border-blue-200 pl-4 dark:border-blue-800">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{item.title}</span>
                <span className="text-slate-500 dark:text-slate-400">{formatDateTime(item.createdat)}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.actor ?? '-'}</p>
              {item.details && <p className="mt-1 whitespace-pre-wrap text-sm">{item.details}</p>}
            </div>
          ))}
          {history?.timeline?.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No timeline entries found.</p>
          )}
        </div>
      </section>

      {isManagingUser && (
        <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <h2 className="text-lg font-semibold">Audit Trail</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {history?.activitylogs?.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                    <td className="px-3 py-2">{formatDateTime(log.createdat)}</td>
                    <td className="px-3 py-2">{log.user?.fullname ?? '-'}</td>
                    <td className="px-3 py-2">{log.action}</td>
                    <td className="px-3 py-2">{log.details}</td>
                  </tr>
                ))}
                {history?.activitylogs?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-5 text-center text-slate-500">
                      No audit entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
