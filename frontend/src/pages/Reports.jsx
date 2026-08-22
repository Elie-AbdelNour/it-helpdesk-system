import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReportSummary, reportExportUrl } from '../api/reports';
import { listCategories, listPriorities, listStatuses } from '../api/tickets';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function StatTile({ label, value }) {
  return (
    <article className="app-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
    </article>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const isManagingUser = MANAGING_ROLES.includes(user.role?.rolename);

  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filters, setFilters] = useState({ datefrom: '', dateto: '', categoryid: '', priorityid: '', statusid: '' });
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([listCategories(), listPriorities(), listStatuses()]).then(([cats, prios, stats]) => {
      setCategories(cats);
      setPriorities(prios);
      setStatuses(stats);
    });
  }, []);

  const activeParams = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));

  useEffect(() => {
    setError(null);
    getReportSummary(activeParams)
      .then(setSummary)
      .catch(() => setError('Unable to load report data.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeParams)]);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setFilters({ datefrom: '', dateto: '', categoryid: '', priorityid: '', statusid: '' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Reports"
        description="Filter and export ticket activity as a CSV or PDF report."
        actions={
          <>
            <a href={reportExportUrl(activeParams, 'csv')} className="btn-secondary">
              <Icon name="download" className="h-4 w-4" />
              Export CSV
            </a>
            <a href={reportExportUrl(activeParams, 'pdf')} className="btn-primary">
              <Icon name="download" className="h-4 w-4" />
              Export PDF
            </a>
          </>
        }
      />

      <section className="app-card grid gap-3 p-4 md:grid-cols-4 lg:p-5">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          From
          <input
            type="date"
            value={filters.datefrom}
            onChange={(e) => updateFilter('datefrom', e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
        </label>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          To
          <input
            type="date"
            value={filters.dateto}
            onChange={(e) => updateFilter('dateto', e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
        </label>
        <select
          value={filters.categoryid}
          onChange={(e) => updateFilter('categoryid', e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filters.priorityid}
          onChange={(e) => updateFilter('priorityid', e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All priorities</option>
          {priorities.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filters.statusid}
          onChange={(e) => updateFilter('statusid', e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button type="button" onClick={clearFilters} className="btn-secondary">Clear filters</button>
      </section>

      {error && <div className="alert-error"><Icon name="alert" className="h-4 w-4 shrink-0" />{error}</div>}

      {summary && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Total tickets" value={summary.totals.count} />
            <StatTile label="Resolved" value={summary.totals.resolved} />
            <StatTile label="Average resolution" value={formatMinutes(summary.totals.avgresolutionminutes)} />
            <StatTile label="SLA compliance" value={summary.totals.slacompliance === null ? '—' : `${summary.totals.slacompliance}%`} />
          </section>

          <section className="app-card overflow-x-auto p-5 sm:p-6">
            <h2 className="section-title">Monthly breakdown</h2>
            <p className="mt-1 text-xs text-slate-400">Tickets created vs. resolved, last 6 months</p>
            <table className="mt-4 w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {summary.monthly.map((row) => (
                  <tr key={row.month} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-3 py-2 font-medium">{row.month}</td>
                    <td className="px-3 py-2">{row.created}</td>
                    <td className="px-3 py-2">{row.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {isManagingUser && summary.byagent && (
            <section className="app-card overflow-x-auto p-5 sm:p-6">
              <h2 className="section-title">Agent performance</h2>
              <p className="mt-1 text-xs text-slate-400">Assigned, resolved, and average resolution time per agent</p>
              <table className="mt-4 w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2">Agent</th>
                    <th className="px-3 py-2">Assigned</th>
                    <th className="px-3 py-2">Resolved</th>
                    <th className="px-3 py-2">Avg resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byagent.map((row) => (
                    <tr key={row.name} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2">{row.assigned}</td>
                      <td className="px-3 py-2">{row.resolved}</td>
                      <td className="px-3 py-2">{formatMinutes(row.avgresolutionminutes)}</td>
                    </tr>
                  ))}
                  {summary.byagent.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">No assigned tickets yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
