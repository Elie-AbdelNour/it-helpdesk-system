import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  listAssignableUsers,
  listCategories,
  listPriorities,
  listStatuses,
  listTickets,
} from '../api/tickets';

const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function resolutionText(ticket) {
  if (ticket.actualresolutionminutes !== null) {
    return formatDuration(ticket.actualresolutionminutes);
  }

  return `Open ${formatDuration(ticket.elapsedresolutionminutes)}`;
}

export default function TicketList() {
  const { user } = useAuth();
  const isManagingUser = MANAGING_ROLES.includes(user.role?.rolename);
  const [searchParams] = useSearchParams();
  const unassignedOnly = searchParams.get('unassigned') === '1';
  const [tickets, setTickets] = useState(null);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    categoryid: '',
    priorityid: '',
    statusid: '',
    assignedto: '',
    createdfrom: '',
    createdto: '',
    resolvedfrom: '',
    resolvedto: '',
  });
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

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
    setError(null);
    const params = { page };
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    if (unassignedOnly) params.unassigned = 1;

    listTickets(params)
      .then(setTickets)
      .catch(() => setError('Unable to load tickets.'));
  }, [filters, page, unassignedOnly]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setPage(1);
    setFilters({
      search: '',
      categoryid: '',
      priorityid: '',
      statusid: '',
      assignedto: '',
      createdfrom: '',
      createdto: '',
      resolvedfrom: '',
      resolvedto: '',
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{unassignedOnly ? 'Open (Unassigned) Tickets' : 'Tickets'}</h1>
        <Link
          to="/tickets/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Ticket
        </Link>
      </div>

      <div className="mt-4 grid gap-3 rounded bg-white p-4 shadow dark:bg-slate-800 md:grid-cols-4">
        <input
          type="text"
          placeholder="Search subject or ref #"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <select
          value={filters.statusid}
          onChange={(e) => updateFilter('statusid', e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filters.categoryid}
          onChange={(e) => updateFilter('categoryid', e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filters.priorityid}
          onChange={(e) => updateFilter('priorityid', e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="">All priorities</option>
          {priorities.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.targetresolutionhours}h)
            </option>
          ))}
        </select>
        {isManagingUser && (
          <select
            value={filters.assignedto}
            onChange={(e) => updateFilter('assignedto', e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.fullname}
              </option>
            ))}
          </select>
        )}
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Created from
          <input
            type="date"
            value={filters.createdfrom}
            onChange={(e) => updateFilter('createdfrom', e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Created to
          <input
            type="date"
            value={filters.createdto}
            onChange={(e) => updateFilter('createdto', e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Resolved from
          <input
            type="date"
            value={filters.resolvedfrom}
            onChange={(e) => updateFilter('resolvedfrom', e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Resolved to
          <input
            type="date"
            value={filters.resolvedto}
            onChange={(e) => updateFilter('resolvedto', e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded bg-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          Clear Filters
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow dark:bg-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2">Ref #</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Status</th>
              {isManagingUser && <th className="px-4 py-2">Agent</th>}
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Due</th>
              <th className="px-4 py-2">Resolution</th>
            </tr>
          </thead>
          <tbody>
            {tickets?.data.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <td className="px-4 py-2">
                  <Link to={`/tickets/${t.id}`} className="text-blue-600 hover:underline">
                    {t.ticketrefno}
                  </Link>
                </td>
                <td className="px-4 py-2">{t.subject}</td>
                <td className="px-4 py-2">{t.priority?.name}</td>
                <td className="px-4 py-2">{t.status?.name}</td>
                {isManagingUser && <td className="px-4 py-2">{t.agent?.fullname ?? '-'}</td>}
                <td className="px-4 py-2">{formatDate(t.createdat)}</td>
                <td className="px-4 py-2">{formatDate(t.resolutiondueat)}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      t.resolutionstate === 'overdue' || t.resolutionstate === 'resolved_late'
                        ? 'font-medium text-red-600'
                        : 'font-medium text-slate-700 dark:text-slate-200'
                    }
                  >
                    {resolutionText(t)}
                  </span>
                </td>
              </tr>
            ))}
            {tickets && tickets.data.length === 0 && (
              <tr>
                <td colSpan={isManagingUser ? 8 : 7} className="px-4 py-6 text-center text-slate-500">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {tickets && tickets.last_page > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded bg-slate-200 px-3 py-1 disabled:opacity-50 dark:bg-slate-700"
          >
            Previous
          </button>
          <span>
            Page {tickets.current_page} of {tickets.last_page}
          </span>
          <button
            disabled={page >= tickets.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded bg-slate-200 px-3 py-1 disabled:opacity-50 dark:bg-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
