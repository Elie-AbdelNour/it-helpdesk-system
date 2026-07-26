import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCategories, listPriorities, listStatuses, listTickets } from '../api/tickets';

export default function TicketList() {
  const [tickets, setTickets] = useState(null);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filters, setFilters] = useState({ search: '', categoryid: '', priorityid: '', statusid: '' });
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([listCategories(), listPriorities(), listStatuses()]).then(
      ([cats, prios, stats]) => {
        setCategories(cats);
        setPriorities(prios);
        setStatuses(stats);
      }
    );
  }, []);

  useEffect(() => {
    setError(null);
    const params = { page };
    if (filters.search) params.search = filters.search;
    if (filters.categoryid) params.categoryid = filters.categoryid;
    if (filters.priorityid) params.priorityid = filters.priorityid;
    if (filters.statusid) params.statusid = filters.statusid;

    listTickets(params)
      .then(setTickets)
      .catch(() => setError('Unable to load tickets.'));
  }, [filters, page]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <Link
          to="/tickets/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Ticket
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
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
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow dark:bg-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2">Ref #</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
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
                <td className="px-4 py-2">{t.category?.name}</td>
                <td className="px-4 py-2">{t.priority?.name}</td>
                <td className="px-4 py-2">{t.status?.name}</td>
                <td className="px-4 py-2">{new Date(t.createdat).toLocaleDateString()}</td>
              </tr>
            ))}
            {tickets && tickets.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
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
