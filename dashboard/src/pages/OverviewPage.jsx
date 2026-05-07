import { useState, useEffect } from 'react'
import { AlertTriangle, Wrench, CheckCircle, ShieldAlert } from 'lucide-react'
import { dashboardApi, faultsApi } from '../services/api.js'
import { Topbar } from '../components/layout/Topbar.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { LoadingState } from '../components/ui/LoadingState.jsx'
import { FaultTrendChart } from '../components/charts/FaultTrendChart.jsx'
import { StatusDonutChart } from '../components/charts/StatusDonutChart.jsx'
import { SeverityBadge, StatusBadge } from '../components/ui/Badge.jsx'
import { timeAgo } from '../utils/format.js'

export function OverviewPage() {
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState([])
  const [faultStats, setFaultStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [overviewRes, trendsRes, statsRes] = await Promise.all([
          dashboardApi.getOverview(),
          dashboardApi.getFaultTrends(30),
          faultsApi.getStats(),
        ])
        setOverview(overviewRes.data)
        setTrends(trendsRes.data.trends)
        setFaultStats(statsRes.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingState message="Loading overview..." />
  if (error) return <div className="alert alert-error" style={{ margin: 32 }}>{error}</div>

  const { faults, tools, recent } = overview

  return (
    <>
      <Topbar
        title="Overview"
        subtitle="System status at a glance"
        actions={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span className="live-dot" /> Live
          </span>
        }
      />

      <div className="page-container">
        {/* Top stats */}
        <div className="stats-grid">
          <StatCard
            label="Active Faults"
            value={faults.active}
            sub={`${faults.thisWeek} reported this week`}
            accentColor="var(--accent)"
            icon={<AlertTriangle size={40} />}
          />
          <StatCard
            label="Critical Unresolved"
            value={faults.critical}
            sub="Require immediate attention"
            accentColor="var(--critical)"
            icon={<ShieldAlert size={40} />}
          />
          <StatCard
            label="Tool Checks (30d)"
            value={tools.checksThisMonth}
            sub={`${tools.failedChecks} failed checks`}
            accentColor="var(--high)"
            icon={<Wrench size={40} />}
          />
          <StatCard
            label="Missing Tools"
            value={tools.missing}
            sub={`of ${tools.total} in inventory`}
            accentColor={tools.missing > 0 ? 'var(--critical)' : 'var(--low)'}
            icon={<CheckCircle size={40} />}
          />
        </div>

        {/* Charts row */}
        <div className="chart-grid">
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Fault Trends — Last 30 Days</span>
            </div>
            <div className="panel-body">
              <FaultTrendChart trends={trends} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Faults by Status</span>
            </div>
            <div className="panel-body">
              <StatusDonutChart byStatus={faultStats?.byStatus ?? {}} />
            </div>
          </div>
        </div>

        {/* Recent activity row */}
        <div className="two-col">
          {/* Recent faults */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <AlertTriangle size={14} /> Recent Faults
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Fault</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.faults.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No faults yet</td></tr>
                  ) : (
                    recent.faults.map((fault) => (
                      <tr key={fault._id}>
                        <td>
                          <div style={{ fontWeight: 500, marginBottom: 2 }}>{fault.title}</div>
                          <div className="mono">{fault.location?.area}</div>
                        </td>
                        <td><SeverityBadge severity={fault.severity} /></td>
                        <td><StatusBadge status={fault.status} /></td>
                        <td className="mono">{timeAgo(fault.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent tool checks */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Wrench size={14} /> Recent Tool Checks
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Engineer</th>
                    <th>Result</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.toolChecks.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No checks yet</td></tr>
                  ) : (
                    recent.toolChecks.map((check) => (
                      <tr key={check._id}>
                        <td style={{ textTransform: 'capitalize' }}>
                          {check.checkType?.replace(/_/g, ' ')}
                        </td>
                        <td className="mono">{check.performedBy?.name ?? '—'}</td>
                        <td>
                          <span className={`badge ${check.passed ? 'badge-pass' : 'badge-fail'}`}>
                            {check.passed ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                        <td className="mono">{timeAgo(check.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
