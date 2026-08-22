import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboardStats } from '../api/dashboard';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

const HUE = { blue: '#2563eb', orange: '#10b981' };
const CHROME = { grid: '#e8eef5', axis: '#94a3b8', surface: '#ffffff', text: '#0f172a' };

export default function TeamWorkload() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const byAgent = stats?.byagent ?? [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Team performance" title="Team workload" description="Compare open and resolved work across assigned support specialists." />

      {isLoading && <div className="app-card flex h-72 items-center justify-center"><div className="loading-spinner" /></div>}

      {stats && (
        <section className="app-card p-5 sm:p-6">
          {byAgent.length === 0 ? (
            <div className="empty-state"><span className="empty-state-icon"><Icon name="workload" className="h-5 w-5" /></span><p className="text-sm font-medium text-slate-600">No assigned tickets yet</p><p className="mt-1 text-xs text-slate-400">Workload data will appear after the first assignment.</p></div>
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
                      <tr key={agent.name} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-3 font-medium">{agent.name}</td>
                        <td className="px-3 py-3"><span className="status-badge bg-blue-50 text-blue-700">{agent.open}</span></td>
                        <td className="px-3 py-3"><span className="status-badge bg-emerald-50 text-emerald-700">{agent.resolved}</span></td>
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
