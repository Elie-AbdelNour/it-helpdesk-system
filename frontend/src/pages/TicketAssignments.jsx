import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { assignTicket, listAssignableUsers, listTickets } from '../api/tickets';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

export default function TicketAssignments() {
  const [tickets, setTickets] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState({});
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  function load() {
    listTickets({ unassigned: 1, page: 1 })
      .then(setTickets)
      .catch(() => setError('Unable to load tickets.'));
  }

  useEffect(() => {
    listAssignableUsers().then(setAgents);
    load();
  }, []);

  async function handleAssign(ticketId) {
    const assignedto = selectedAgent[ticketId];
    if (!assignedto) return;

    setSubmittingId(ticketId);
    try {
      await assignTicket(ticketId, { assignedto });
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to assign ticket.');
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ticket Assignments</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Unassigned tickets waiting to be picked up.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="overflow-x-auto rounded-lg bg-white shadow dark:bg-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2">Ref #</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Assign to</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {tickets?.data.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                <td className="px-4 py-2">
                  <Link to={`/tickets/${t.id}`} className="text-blue-600 hover:underline">
                    {t.ticketrefno}
                  </Link>
                </td>
                <td className="px-4 py-2">{t.subject}</td>
                <td className="px-4 py-2">{t.priority?.name}</td>
                <td className="px-4 py-2">{formatDate(t.createdat)}</td>
                <td className="px-4 py-2">
                  <select
                    value={selectedAgent[t.id] ?? ''}
                    onChange={(e) => setSelectedAgent((s) => ({ ...s, [t.id]: e.target.value }))}
                    className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                  >
                    <option value="">Select agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.fullname}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleAssign(t.id)}
                    disabled={!selectedAgent[t.id] || submittingId === t.id}
                    className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingId === t.id ? 'Assigning...' : 'Assign'}
                  </button>
                </td>
              </tr>
            ))}
            {tickets && tickets.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No unassigned tickets. Everything is picked up.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
