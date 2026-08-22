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
import { Link } from 'react-router';
import { getDashboardStats } from '../api/dashboard';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const MANAGING_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

const CHART_PALETTE = {
  light: { blue: '#2563eb', orange: '#f97316', emerald: '#10b981', grid: '#e8eef5', axis: '#94a3b8', tooltipBg: '#fff', tooltipBorder: '#e2e8f0', tooltipText: '#0f172a', cursor: '#f1f5f9' },
  dark: { blue: '#60a5fa', orange: '#fb923c', emerald: '#34d399', grid: '#1e293b', axis: '#64748b', tooltipBg: '#0f172a', tooltipBorder: '#334155', tooltipText: '#e2e8f0', cursor: '#1e293b' },
};

const TONES = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function StatTile({ label, value, note, icon, tone = 'blue' }) {
  return (
    <article className="app-card group p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400">{note}</p>
    </article>
  );
}

function ChartEmpty({ text }) {
  return (
    <div className="empty-state min-h-[220px]">
      <span className="empty-state-icon"><Icon name="trend" className="h-5 w-5" /></span>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No data to display yet</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">{text}</p>
    </div>
  );
}

function CountBarChart({ data, color, palette }) {
  if (!data?.length) return <ChartEmpty text="Charts will populate as tickets are created and updated." />;

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 12, right: 4, left: -20, bottom: 4 }}>
        <CartesianGrid stroke={palette.grid} vertical={false} />
        <XAxis dataKey="name" stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 12, boxShadow: '0 10px 30px rgb(15 23 42 / 10%)', fontSize: 12, color: palette.tooltipText }} cursor={{ fill: palette.cursor }} />
        <Bar dataKey="count" fill={color} radius={[6, 6, 2, 2]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-36 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-80 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const palette = CHART_PALETTE[theme];
  const isManagingUser = MANAGING_ROLES.includes(user.role?.rolename);
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats });
  const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={today}
        title={`Welcome back, ${user.fullname.split(' ')[0]}`}
        description={isManagingUser ? 'Here is the latest service performance across your organization.' : 'Here is the latest progress across your support requests.'}
        actions={
          <>
            <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:inline-flex">{user.role?.rolename}</span>
            <Link to="/tickets/new" className="btn-primary"><Icon name="plus" className="h-4 w-4" />New ticket</Link>
          </>
        }
      />

      {isLoading && <DashboardSkeleton />}

      {stats && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatTile label="Open tickets" value={stats.totals.open} note="Currently awaiting resolution" icon="tickets" tone="blue" />
            <StatTile label="Pending" value={stats.totals.pending} note="Paused, waiting on a response" icon="clock" tone="amber" />
            <StatTile label="Overdue" value={stats.totals.overdue} note={stats.totals.overdue ? 'Needs immediate attention' : 'Everything is on schedule'} icon="alert" tone={stats.totals.overdue ? 'red' : 'emerald'} />
            <StatTile label="Resolved" value={stats.totals.resolved} note="Successfully resolved requests" icon="check" tone="emerald" />
            <StatTile label="Average time" value={formatMinutes(stats.avgresolutionminutes)} note="Mean time to resolution" icon="clock" tone="violet" />
            <StatTile label="SLA compliance" value={stats.slacompliance === null ? '—' : `${stats.slacompliance}%`} note="Resolved within target" icon="shield" tone="amber" />
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            {[
              ['Tickets by status', 'Live distribution across workflow stages', stats.bystatus, palette.blue],
              ['Tickets by priority', 'How urgency is distributed', stats.bypriority, palette.orange],
              ['Tickets by category', 'Most common support areas', stats.bycategory, palette.emerald],
            ].map(([title, subtitle, data, color]) => (
              <article key={title} className="app-card p-5 sm:p-6">
                <div>
                  <h2 className="section-title">{title}</h2>
                  <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
                </div>
                <div className="mt-4"><CountBarChart data={data} color={color} palette={palette} /></div>
              </article>
            ))}
          </section>

          <section className="app-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="section-title">Ticket activity</h2>
                <p className="mt-1 text-xs text-slate-400">Requests created over the last 14 days</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">14-day view</span>
            </div>
            <div className="mt-5">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats.createdtrend} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                  <CartesianGrid stroke={palette.grid} vertical={false} />
                  <XAxis dataKey="date" stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => value.slice(5)} />
                  <YAxis stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 12, boxShadow: '0 10px 30px rgb(15 23 42 / 10%)', fontSize: 12, color: palette.tooltipText }} />
                  <Line type="monotone" dataKey="count" stroke={palette.blue} strokeWidth={3} dot={{ r: 3, fill: palette.tooltipBg, stroke: palette.blue, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {isManagingUser && stats.byagent && (
            <section className="app-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="section-title">Team workload</h2>
                  <p className="mt-1 text-xs text-slate-400">Open and resolved work by assigned specialist</p>
                </div>
                <Link to="/team-workload" className="text-link text-xs">View detailed workload</Link>
              </div>
              <div className="mt-5">
                {!stats.byagent.length ? (
                  <ChartEmpty text="Agent workload will appear after the first ticket assignment." />
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(240, stats.byagent.length * 52)}>
                    <BarChart data={stats.byagent} layout="vertical" margin={{ top: 8, right: 18, left: 10, bottom: 8 }}>
                      <CartesianGrid stroke={palette.grid} horizontal={false} />
                      <XAxis type="number" stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke={palette.axis} tick={{ fill: palette.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={130} />
                      <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 12, fontSize: 12, color: palette.tooltipText }} cursor={{ fill: palette.cursor }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: palette.axis }} />
                      <Bar dataKey="open" name="Open" fill={palette.blue} radius={[0, 5, 5, 0]} maxBarSize={18} />
                      <Bar dataKey="resolved" name="Resolved" fill={palette.emerald} radius={[0, 5, 5, 0]} maxBarSize={18} />
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
