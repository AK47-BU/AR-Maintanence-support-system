import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'
import { dashboardApi } from '../services/api.js'
import { Topbar } from '../components/layout/Topbar.jsx'
import { LoadingState, EmptyState } from '../components/ui/LoadingState.jsx'
import { fullDate } from '../utils/format.js'

// Action → badge colour mapping
const ACTION_STYLE = {
  FAULT_CREATED:           { color: 'var(--accent)',    label: 'Fault Created' },
  FAULT_UPDATED:           { color: 'var(--medium)',    label: 'Fault Updated' },
  FAULT_RESOLVED:          { color: 'var(--low)',       label: 'Fault Resolved' },
  FAULT_ANNOTATION_ADDED:  { color: 'var(--accent)',    label: 'Annotation' },
  TOOL_CHECK_PERFORMED:    { color: 'var(--high)',      label: 'Tool Check' },
  TOOL_STATUS_CHANGED:     { color: 'var(--medium)',    label: 'Tool Updated' },
  LOGIN_SUCCESS:           { color: 'var(--low)',       label: 'Login OK' },
  LOGIN_FAILED:            { color: 'var(--critical)',  label: 'Login Failed' },
  UNAUTHORISED_ACCESS:     { color: 'var(--critical)',  label: 'Unauth Access' },
}

function ActionBadge({ action }) {
  const style = ACTION_STYLE[action] ?? { color: 'var(--text-muted)', label: action }
  return (
    <span className="badge" style={{
      color: style.color,
      background: style.color + '18',
      border: `1px solid ${style.color}30`,
    }}>
      {style.label}
    </span>
  )
}

export function AuditPage() {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await dashboardApi.getAuditLog({ page, limit: 30 })
      setLogs(res.data.logs)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLogs(1) }, [loadLogs])

  return (
    <>
      <Topbar
        title="Audit Log"
        subtitle={`${pagination.total} events recorded`}
      />

      <div className="page-container">
        <div className="panel">
          {loading ? (
            <LoadingState message="Loading audit log..." />
          ) : logs.length === 0 ? (
            <EmptyState icon={<ClipboardList size={32} />} message="No audit events recorded." />
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>User</th>
                      <th>Role</th>
                      <th>Message</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log._id}>
                        <td><ActionBadge action={log.action} /></td>
                        <td>{log.user?.name ?? <span style={{ color: 'var(--text-muted)' }}>System</span>}</td>
                        <td className="mono">{log.user?.role ?? '—'}</td>
                        <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.message}
                        </td>
                        <td className="mono">{log.ipAddress ?? '—'}</td>
                        <td className="mono">{fullDate(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="pagination">
                  <span>{pagination.total} total entries</span>
                  <div className="pagination-controls">
                    <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                      disabled={pagination.page <= 1}
                      onClick={() => loadLogs(pagination.page - 1)}>
                      <ChevronLeft size={14} />
                    </button>
                    <span>Page {pagination.page} of {pagination.pages}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => loadLogs(pagination.page + 1)}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
