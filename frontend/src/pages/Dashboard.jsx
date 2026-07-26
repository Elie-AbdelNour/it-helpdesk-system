import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="rounded-lg bg-white p-8 shadow dark:bg-slate-800">
      <h1 className="text-2xl font-semibold">IT Help Desk</h1>

      <p className="mt-6">
        Welcome, <span className="font-medium">{user.fullname}</span>.
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Role: {user.role?.rolename}
      </p>

      <Link
        to="/tickets"
        className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        View Tickets
      </Link>

      <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        Dashboards and reports arrive in a later week. This page confirms login, session
        persistence, and role-based access are working end to end.
      </p>
    </div>
  );
}
