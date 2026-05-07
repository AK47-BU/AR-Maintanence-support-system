export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  )
}

export function EmptyState({ icon, message = 'Nothing here yet.' }) {
  return (
    <div className="empty-state">
      {icon}
      <p>{message}</p>
    </div>
  )
}
