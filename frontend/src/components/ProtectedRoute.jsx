import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import Brand from './Brand';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950">
        <Brand compact to="/" />
        <div className="mt-6 loading-spinner" />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Preparing your workspace</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
