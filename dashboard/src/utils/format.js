// ─────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────

import { formatDistanceToNow, format } from 'date-fns'

// "2 hours ago"
export function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

// "14 May 2026, 09:32"
export function fullDate(dateStr) {
  try {
    return format(new Date(dateStr), 'd MMM yyyy, HH:mm')
  } catch {
    return '—'
  }
}

// Capitalise first letter, replace underscores with spaces
export function humanise(str) {
  if (!str) return '—'
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Initials from a name ("Jane Doe" → "JD")
export function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
