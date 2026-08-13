import { useEffect, useState } from 'react';
import { listActivityLog } from '../api/activityLog';

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: '', datefrom: '', dateto: '' });

  useEffect(() => {
    const params = {};
    if (filters.action) params.action = filters.action;
    if (filters.datefrom) params.datefrom = filters.datefrom;
    if (filters.dateto) params.dateto = filters.dateto;

    listActivityLog(params).then((res) => setLogs(res.data));
  }, [filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every recorded action across the system.
        </p>
      </div>

      <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Action (e.g. ticket_assigned)"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            From
            <input
              type="date"
              value={filters.datefrom}
              onChange={(e) => setFilters((f) => ({ ...f, datefrom: e.target.value }))}
              className="mt-1 block rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
          </label>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            To
            <input
              type="date"
              value={filters.dateto}
              onChange={(e) => setFilters((f) => ({ ...f, dateto: e.target.value }))}
              className="mt-1 block rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
          </label>
        </div>

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
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                  <td className="px-3 py-2">{formatDateTime(log.createdat)}</td>
                  <td className="px-3 py-2">{log.user?.fullname ?? '-'}</td>
                  <td className="px-3 py-2">{log.action}</td>
                  <td className="px-3 py-2">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
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
    </div>
  );
}
