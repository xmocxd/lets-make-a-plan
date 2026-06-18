import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Log', icon: '📝' },
  { to: '/plan', label: 'Plan', icon: '📋' },
  { to: '/destress', label: 'Calm', icon: '🧘' },
  { to: '/report', label: 'Report', icon: '📊' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function NavBar() {
  const { pathname } = useLocation();
  return (
    <nav className="nav-bar">
      {tabs.map((t) => {
        const active =
          pathname === t.to ||
          (t.to === '/report' && pathname.startsWith('/report/'));
        return (
        <Link
          key={t.to}
          to={t.to}
          className={active ? 'nav-item active' : 'nav-item'}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </Link>
        );
      })}
    </nav>
  );
}
