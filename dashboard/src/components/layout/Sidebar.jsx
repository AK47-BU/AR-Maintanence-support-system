import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, Wrench,
  ShieldAlert, ClipboardList, LogOut
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { initials } from '../../utils/format.js'

const NAV_ITEMS = [
  { to: '/',        label: 'Overview',      icon: LayoutDashboard },
  { to: '/faults',  label: 'Faults',        icon: AlertTriangle },
  { to: '/tools',   label: 'Tools',         icon: Wrench },
  { to: '/audit',   label: 'Audit Log',     icon: ClipboardList, adminOnly: true },
  { to: '/security',label: 'Security',      icon: ShieldAlert,   adminOnly: true },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <aside className="sidebar">
      {/* Logo / branding */}
      <div className="sidebar-logo">
        <h1>AR Maintenance</h1>
        <p>Control Centre v1.0</p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>

        {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Current user info at the bottom */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials(user?.name)}</div>
          <div>
            <div className="user-name">{user?.name ?? 'Unknown'}</div>
            <div className="user-role">{user?.role ?? '—'}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
