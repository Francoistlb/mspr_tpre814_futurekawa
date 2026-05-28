import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',         label: 'Tableau de bord', icon: '▢' },
  { to: '/stocks',   label: 'Stocks',          icon: '≡' },
  { to: '/alertes',  label: 'Alertes',         icon: '○' }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1><span className="dot" /> FutureKawa</h1>
        <p>Suivi stocks &amp; IoT</p>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'}>
            <span className="nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div>Prototype v0.1</div>
        <div>Siège — Brésil · Équateur · Colombie</div>
      </div>
    </aside>
  );
}
