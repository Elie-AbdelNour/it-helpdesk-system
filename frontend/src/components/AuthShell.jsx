import Brand from './Brand';

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <main className="auth-content">
        <div className="mb-7">
          <Brand theme="light" to="/login" />
        </div>

        <div className="auth-card" style={{ width: 'calc(100vw - 40px)', maxWidth: '470px', boxSizing: 'border-box' }}>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">Secure access · Role-based permissions · Activity tracking</p>
      </main>
    </div>
  );
}
