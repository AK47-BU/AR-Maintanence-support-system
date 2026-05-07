// A single metric card for the top of dashboard pages
export function StatCard({ label, value, sub, accentColor, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-accent" style={{ background: accentColor }} />
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: accentColor }}>{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
