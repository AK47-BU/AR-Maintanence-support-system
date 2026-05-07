// Severity and status badges
export function SeverityBadge({ severity }) {
  return <span className={`badge badge-${severity}`}>{severity}</span>
}

export function StatusBadge({ status }) {
  const label = status?.replace(/_/g, ' ') ?? '—'
  return <span className={`badge badge-${status}`}>{label}</span>
}

export function PassFailBadge({ passed }) {
  return (
    <span className={`badge ${passed ? 'badge-pass' : 'badge-fail'}`}>
      {passed ? 'Pass' : 'Fail'}
    </span>
  )
}
