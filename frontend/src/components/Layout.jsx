import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import Brand from './Brand';
import Icon from './Icon';
import NotificationBell from './NotificationBell';

const NAV_BY_ROLE = {
  Employee: [
    { to: '/', label: 'Dashboard', icon: 'dashboard' },
    { to: '/tickets', label: 'My Tickets', icon: 'tickets' },
    { to: '/tickets/new', label: 'Create Ticket', icon: 'plus' },
  ],
  'IT Support Agent': [
    { to: '/', label: 'Dashboard', icon: 'dashboard' },
    { to: '/tickets', label: 'Assigned Tickets', icon: 'tickets' },
    { to: '/tickets?unassigned=1', label: 'Open Tickets', icon: 'inbox' },
  ],
  Manager: [
    { to: '/', label: 'Dashboard', icon: 'dashboard' },
    { to: '/tickets', label: 'All Tickets', icon: 'tickets' },
    { to: '/ticket-assignments', label: 'Ticket Assignments', icon: 'assignment' },
    { to: '/team-workload', label: 'Team Workload', icon: 'workload' },
    { to: '/audit-log', label: 'System Audit Log', icon: 'audit' },
  ],
  Admin: [
    { to: '/', label: 'Dashboard', icon: 'dashboard' },
    { to: '/tickets', label: 'All Tickets', icon: 'tickets' },
    { to: '/tickets/new', label: 'Create Ticket', icon: 'plus' },
    { to: '/ticket-assignments', label: 'Ticket Assignments', icon: 'assignment' },
    { to: '/team-workload', label: 'Team Workload', icon: 'workload' },
    { to: '/admin/users', label: 'Users', icon: 'users' },
    { to: '/admin/categories', label: 'Categories', icon: 'categories' },
    { to: '/audit-log', label: 'System Audit Log', icon: 'audit' },
  ],
};

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/tickets': 'Tickets',
  '/tickets/new': 'Create ticket',
  '/ticket-assignments': 'Ticket assignments',
  '/team-workload': 'Team workload',
  '/admin/users': 'User management',
  '/admin/categories': 'Ticket categories',
  '/audit-log': 'System audit log',
};

function isItemActive(item, location) {
  const [path, query] = item.to.split('?');
  if (query) return location.pathname === path && location.search === `?${query}`;
  if (path === '/') return location.pathname === '/';
  if (path === '/tickets') return location.pathname === '/tickets' || /^\/tickets\/\d+$/.test(location.pathname);
  return location.pathname === path;
}

function currentPageTitle(pathname) {
  if (/^\/tickets\/\d+$/.test(pathname)) return 'Ticket details';
  return PAGE_TITLES[pathname] ?? 'IT Help Desk';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('helpdesk-sidebar') === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = NAV_BY_ROLE[user?.role?.rolename] ?? NAV_BY_ROLE.Employee;

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem('helpdesk-sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[276px] shrink-0 flex-col border-r border-white/5 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[84px]' : 'lg:w-[276px]'}`}
      >
        <div className="flex h-[80px] items-center justify-between border-b border-white/5 px-5">
          <Brand compact={collapsed} />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <p className={`mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 ${collapsed ? 'lg:hidden' : ''}`}>
            Workspace
          </p>
          <nav className="space-y-1.5" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = isItemActive(item, location);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/25'
                      : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
                  } ${collapsed ? 'lg:justify-center' : ''}`}
                >
                  <Icon name={item.icon} className={`h-[19px] w-[19px] shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-sky-300'}`} />
                  <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                  {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-300" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/5 p-3">
          {!collapsed && (
            <div className="mb-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Service operational
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">All help desk services are online</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-white/[0.07] hover:text-white lg:flex ${collapsed ? 'justify-center' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} className="h-5 w-5" />
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>

      <div className="app-surface">
        <header className="app-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation"
            >
              <Icon name="menu" />
            </button>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-900 shadow-sm lg:hidden">
              <img src="/itd-logo.png" alt="ITD" className="h-7 w-7 object-contain" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
              <p className="truncate text-sm font-semibold text-slate-800">{currentPageTitle(location.pathname)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <div className="h-7 w-px bg-slate-200" />

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-slate-100"
                aria-expanded={menuOpen}
              >
                <Avatar fullname={user?.fullname} />
                <span className="hidden max-w-48 text-left sm:block">
                  <span className="block truncate text-sm font-semibold text-slate-800">{user?.fullname}</span>
                  <span className="block truncate text-[11px] text-slate-500">{user?.role?.rolename}</span>
                </span>
                <Icon name="chevronDown" className="hidden h-4 w-4 text-slate-400 sm:block" />
              </button>

              {menuOpen && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Close profile menu" />
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4">
                      <p className="truncate text-sm font-semibold text-slate-900">{user?.fullname}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</p>
                      <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        {user?.role?.rolename}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700"
                    >
                      <Icon name="logout" className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
