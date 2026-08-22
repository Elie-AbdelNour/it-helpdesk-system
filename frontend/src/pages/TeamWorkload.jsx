import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboardStats } from '../api/dashboard';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';

const PALETTE = {
  light: { blue: '#2563eb', orange: '#10b981', grid: '#e8eef5', axis: '#94a3b8', surface: '#ffffff', text: '#0f172a' },
  dark: { blue: '#60a5fa', orange: '#34d399', grid: '#1e293b', axis: '#64748b', surface: '#0f172a', text: '#e2e8f0' },
};

export default function TeamWorkload() {
  const { theme } = useTheme();
  const { blue, orange, grid, axis, surface, text } = PALETTE[theme];
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
            <div className="empty-state"><span className="empty-state-icon"><Icon name="workload" className="h-5 w-5" /></span><p className="text-sm font-medium text-slate-600 dark:text-slate-300">No assigned tickets yet</p><p className="mt-1 text-xs text-slate-400">Workload data will appear after the first assignment.</p></div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(240, byAgent.length * 50)}>
                <BarChart data={byAgent} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid stroke={grid} strokeDasharray="0" horizontal={false} />
                  <XAxis type="number" stroke={axis} tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke={axis}
                    tick={{ fill: axis, fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: grid }}
                    width={140}
                  />
                  <Tooltip contentStyle={{ background: surface, border: `1px solid ${grid}`, color: text, fontSize: 12 }} cursor={{ fill: grid, opacity: 0.3 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: axis }} />
                  <Bar dataKey="open" name="Open" fill={blue} radius={[0, 4, 4, 0]} maxBarSize={18} />
                  <Bar dataKey="resolved" name="Resolved" fill={orange} radius={[0, 4, 4, 0]} maxBarSize={18} />
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
                      <tr key={agent.name} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="px-3 py-3 font-medium">{agent.name}</td>
                        <td className="px-3 py-3"><span className="status-badge bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">{agent.open}</span></td>
                        <td className="px-3 py-3"><span className="status-badge bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{agent.resolved}</span></td>
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
