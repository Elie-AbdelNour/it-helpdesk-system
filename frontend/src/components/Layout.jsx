import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import Avatar from './Avatar';

const NAV_BY_ROLE = {
  Employee: [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/tickets', label: 'My Tickets' },
    { to: '/tickets/new', label: 'Create Ticket' },
  ],
  'IT Support Agent': [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/tickets', label: 'Assigned Tickets' },
    { to: '/tickets?unassigned=1', label: 'Open Tickets' },
  ],
  Manager: [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/tickets', label: 'All Tickets' },
    { to: '/ticket-assignments', label: 'Ticket Assignments' },
    { to: '/team-workload', label: 'Team Workload' },
    { to: '/audit-log', label: 'System Audit Log' },
  ],
  Admin: [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/tickets', label: 'All Tickets' },
    { to: '/tickets/new', label: 'Create Ticket' },
    { to: '/ticket-assignments', label: 'Ticket Assignments' },
    { to: '/team-workload', label: 'Team Workload' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/audit-log', label: 'System Audit Log' },
  ],
};

function navClass({ isActive }) {
  return `block rounded px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = NAV_BY_ROLE[user?.role?.rolename] ?? NAV_BY_ROLE.Employee;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={`flex flex-col border-r border-slate-800 bg-slate-900 transition-all ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          {!collapsed && <span className="text-lg font-bold text-white">IT Help Desk</span>}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink key={item.label} to={item.to} end={item.end} className={navClass}>
              {collapsed ? item.label.slice(0, 1) : item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-800">
          <div />
          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Avatar fullname={user?.fullname} />
                <span className="text-left text-sm">
                  <span className="block font-medium text-slate-900 dark:text-slate-100">{user?.fullname}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{user?.role?.rolename}</span>
                </span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <button
                      onClick={handleLogout}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
