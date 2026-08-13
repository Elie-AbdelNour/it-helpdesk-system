import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboardStats } from '../api/dashboard';

const HUE = { blue: '#2a78d6', orange: '#eb6834' };
const CHROME = { grid: '#e1e0d9', axis: '#898781', surface: '#fcfcfb', text: '#0b0b0b' };

export default function TeamWorkload() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const byAgent = stats?.byagent ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team Workload</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Open and resolved ticket counts per agent.
        </p>
      </div>

      {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading...</p>}

      {stats && (
        <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          {byAgent.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No tickets assigned yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(240, byAgent.length * 50)}>
                <BarChart data={byAgent} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid stroke={CHROME.grid} strokeDasharray="0" horizontal={false} />
                  <XAxis type="number" stroke={CHROME.axis} tick={{ fill: CHROME.axis, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke={CHROME.axis}
                    tick={{ fill: CHROME.axis, fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: CHROME.grid }}
                    width={140}
                  />
                  <Tooltip contentStyle={{ background: CHROME.surface, border: `1px solid ${CHROME.grid}`, color: CHROME.text, fontSize: 12 }} cursor={{ fill: CHROME.grid, opacity: 0.3 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="open" name="Open" fill={HUE.blue} radius={[0, 4, 4, 0]} maxBarSize={18} />
                  <Bar dataKey="resolved" name="Resolved" fill={HUE.orange} radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Agent</th>
                      <th className="px-3 py-2">Open</th>
                      <th className="px-3 py-2">Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byAgent.map((agent) => (
                      <tr key={agent.name} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                        <td className="px-3 py-2 font-medium">{agent.name}</td>
                        <td className="px-3 py-2">{agent.open}</td>
                        <td className="px-3 py-2">{agent.resolved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
