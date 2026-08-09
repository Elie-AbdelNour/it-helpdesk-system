import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api/dashboard';

const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

// Categorical slots 1-3 from the validated palette (references/palette.md in the dataviz skill).
// Each chart on this page plots a single measure, so each takes one hue as its own sequential ramp;
// the three differ only so simultaneously-visible charts stay visually distinct.
const HUE = {
  blue: { light: '#2a78d6', dark: '#3987e5' },
  orange: { light: '#eb6834', dark: '#d95926' },
  aqua: { light: '#1baf7a', dark: '#199e70' },
};

const CHROME = {
  grid: { light: '#e1e0d9', dark: '#2c2c2a' },
  axis: { light: '#898781', dark: '#898781' },
  surface: { light: '#fcfcfb', dark: '#1a1a19' },
  text: { light: '#0b0b0b', dark: '#ffffff' },
};

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDark;
}

function StatTile({ label, value, danger }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${danger ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </p>
    </div>
  );
}

function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function CountBarChart({ data, hue, isDark }) {
  const color = isDark ? hue.dark : hue.light;
  const grid = isDark ? CHROME.grid.dark : CHROME.grid.light;
  const axis = isDark ? CHROME.axis.dark : CHROME.axis.light;
  const surface = isDark ? CHROME.surface.dark : CHROME.surface.light;
  const text = isDark ? CHROME.text.dark : CHROME.text.light;

  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid stroke={grid} strokeDasharray="0" vertical={false} />
        <XAxis dataKey="name" stroke={axis} tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: grid }} />
        <YAxis stroke={axis} tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: surface, border: `1px solid ${grid}`, color: text, fontSize: 12 }}
          cursor={{ fill: grid, opacity: 0.3 }}
        />
        <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isManagingUser = MANAGING_ROLES.includes(user.role?.rolename);
  const isDark = useIsDarkMode();
  const grid = isDark ? CHROME.grid.dark : CHROME.grid.light;
  const axis = isDark ? CHROME.axis.dark : CHROME.axis.light;
  const surface = isDark ? CHROME.surface.dark : CHROME.surface.light;
  const text = isDark ? CHROME.text.dark : CHROME.text.light;
  const blue = isDark ? HUE.blue.dark : HUE.blue.light;
  const orange = isDark ? HUE.orange.dark : HUE.orange.light;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome, <span className="font-medium">{user.fullname}</span>. {isManagingUser ? 'Org-wide overview.' : 'Your tickets.'}
        </p>
      </div>

      {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>}

      {stats && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatTile label="Open" value={stats.totals.open} />
            <StatTile label="Overdue" value={stats.totals.overdue} danger={stats.totals.overdue > 0} />
            <StatTile label="Resolved" value={stats.totals.resolved} />
            <StatTile label="Avg resolution time" value={formatMinutes(stats.avgresolutionminutes)} />
            <StatTile
              label="SLA compliance"
              value={stats.slacompliance === null ? '-' : `${stats.slacompliance}%`}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tickets by status</h2>
              <div className="mt-4">
                <CountBarChart data={stats.bystatus} hue={HUE.blue} isDark={isDark} />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tickets by priority</h2>
              <div className="mt-4">
                <CountBarChart data={stats.bypriority} hue={HUE.orange} isDark={isDark} />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tickets by category</h2>
              <div className="mt-4">
                <CountBarChart data={stats.bycategory} hue={HUE.aqua} isDark={isDark} />
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tickets created, last 14 days</h2>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.createdtrend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={grid} strokeDasharray="0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke={axis}
                    tick={{ fill: axis, fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: grid }}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis stroke={axis} tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: surface, border: `1px solid ${grid}`, color: text, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="count" stroke={blue} strokeWidth={2} dot={{ r: 3, fill: blue }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {isManagingUser && stats.byagent && (
            <section className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Workload by agent</h2>
              <div className="mt-4">
                {stats.byagent.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No tickets assigned yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(220, stats.byagent.length * 50)}>
                    <BarChart data={stats.byagent} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                      <CartesianGrid stroke={grid} strokeDasharray="0" horizontal={false} />
                      <XAxis type="number" stroke={axis} tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke={axis}
                        tick={{ fill: axis, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: grid }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{ background: surface, border: `1px solid ${grid}`, color: text, fontSize: 12 }}
                        cursor={{ fill: grid, opacity: 0.3 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, color: text }} />
                      <Bar dataKey="open" name="Open" fill={blue} radius={[0, 4, 4, 0]} maxBarSize={16} />
                      <Bar dataKey="resolved" name="Resolved" fill={orange} radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
