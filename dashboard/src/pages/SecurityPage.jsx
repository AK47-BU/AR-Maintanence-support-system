import { useState, useEffect } from 'react'
import { ShieldAlert, ShieldX } from 'lucide-react'
import { dashboardApi } from '../services/api.js'
import { Topbar } from '../components/layout/Topbar.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { LoadingState, EmptyState } from '../components/ui/LoadingState.jsx'
import { fullDate } from '../utils/format.js'

export function SecurityPage() {
  const [events, setEvents] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await dashboardApi.getSecurityEvents()
        setEvents(res.data.events)
        setSummary(res.data.summary)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingState message="Loading security events..." />

  const totalAlerts = Object.values(summary).reduce((acc, n) => acc + n, 0)

  return (
    <>
      <Topbar
        title="Security Events"
        subtitle="Failed logins, unauthorised access attempts"
      />

      <div className="page-container">
        <div className="stats-grid">
          <StatCard
            label="Login Failures"
            value={summary.LOGIN_FAILED ?? 0}
            accentColor={summary.LOGIN_FAILED > 0 ? 'var(--critical)' : 'var(--low)'}
            icon={<ShieldX size={40} />}
          />
          <StatCard
            label="Unauthorised Access"
            value={summary.UNAUTHORISED_ACCESS ?? 0}
            accentColor={summary.UNAUTHORISED_ACCESS > 0 ? 'var(--critical)' : 'var(--low)'}
            icon={<ShieldAlert size={40} />}
          />
          <StatCard
            label="Suspicious Activity"
            value={summary.SUSPICIOUS_ACTIVITY ?? 0}
            accentColor={summary.SUSPICIOUS_ACTIVITY > 0 ? 'var(--high)' : 'var(--low)'}
            icon={<ShieldAlert size={40} />}
          />
          <StatCard
            label="Total Security Alerts"
            value={totalAlerts}
            accentColor={totalAlerts > 0 ? 'var(--critical)' : 'var(--low)'}
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title"><ShieldAlert size={14} /> Recent Security Events</span>
          </div>

          {events.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert size={32} />}
              message="No security events recorded. The system looks clean."
            />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>User</th>
                    <th>Message</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event._id}>
                      <td>
                        <span className="badge badge-critical">
                          {event.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>{event.user?.name ?? <span style={{ color: 'var(--text-muted)' }}>Unknown</span>}</td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.message}
                      </td>
                      <td className="mono">{event.ipAddress ?? '—'}</td>
                      <td className="mono">{fullDate(event.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
