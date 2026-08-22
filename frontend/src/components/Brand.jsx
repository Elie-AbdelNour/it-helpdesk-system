import { Link } from 'react-router';

export default function Brand({ compact = false, theme = 'dark', to = '/', className = '' }) {
  return (
    <Link to={to} className={`brand-lockup brand-lockup--${theme} ${compact ? 'brand-lockup--compact' : ''} ${className}`}>
      <span className="brand-mark">
        <img src="/itd-logo.png" alt="" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="brand-name">IT Help Desk</span>
          <span className="brand-tagline">Support center</span>
        </span>
      )}
    </Link>
  );
}
