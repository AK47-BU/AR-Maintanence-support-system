import { useState, useEffect, useCallback } from 'react'
import { Wrench, Package, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { toolsApi } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { Topbar } from '../components/layout/Topbar.jsx'
import { PassFailBadge } from '../components/ui/Badge.jsx'
import { LoadingState, EmptyState } from '../components/ui/LoadingState.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { timeAgo, fullDate } from '../utils/format.js'

// ── Tool Check Detail Modal ───────────────────────

function CheckDetailModal({ check, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Tool Check — {check.checkType?.replace(/_/g, ' ')}</span>
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8 }}>
            <PassFailBadge passed={check.passed} />
            <span className="mono">{fullDate(check.createdAt)}</span>
          </div>

          <div className="fault-meta">
            <div className="fault-meta-item">
              <div className="label">Engineer</div>
              <div className="value">{check.performedBy?.name ?? '—'}</div>
            </div>
            <div className="fault-meta-item">
              <div className="label">Vehicle</div>
              <div className="value">{check.vehicleId ?? '—'}</div>
            </div>
            <div className="fault-meta-item">
              <div className="label">Depot</div>
              <div className="value">{check.depot ?? '—'}</div>
            </div>
            <div className="fault-meta-item">
              <div className="label">Expected / Detected</div>
              <div className="value">{check.totalExpected} / {check.totalDetected}</div>
            </div>
          </div>

          {/* Missing tools */}
          {check.missingTools?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--critical)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Missing Tools ({check.missingTools.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {check.missingTools.map((t, i) => (
                  <span key={i} className="badge badge-critical">{t.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Detected tools */}
          {check.detectedTools?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--low)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Detected Tools
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {check.detectedTools.map((t, i) => (
                  <span key={i} className="badge badge-low">
                    {t.name}
                    {t.confidence != null && (
                      <span style={{ opacity: 0.7 }}> {Math.round(t.confidence * 100)}%</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {check.notes && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{check.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Tools Page ───────────────────────────────

export function ToolsPage() {
  const { user } = useAuth()
  const [tools, setTools] = useState([])
  const [toolSummary, setToolSummary] = useState({})
  const [checks, setChecks] = useState([])
  const [checkPagination, setCheckPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [checkStats, setCheckStats] = useState(null)
  const [checksFilter, setChecksFilter] = useState('')
  const [selectedCheck, setSelectedCheck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(null)

  const isAdmin = user?.role === 'admin'

  const loadData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (checksFilter !== '') params.passed = checksFilter
      const [toolsRes, checksRes, statsRes] = await Promise.all([
        toolsApi.list(),
        toolsApi.listChecks(params),
        toolsApi.getCheckStats(),
      ])
      setTools(toolsRes.data.tools)
      setToolSummary(toolsRes.data.summary)
      setChecks(checksRes.data.checks)
      setCheckPagination(checksRes.data.pagination)
      setCheckStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [checksFilter])

  useEffect(() => { loadData(1) }, [loadData])

  async function updateToolStatus(id, status) {
    setStatusUpdating(id)
    try {
      await toolsApi.updateStatus(id, status)
      // Refresh tools list after update
      const res = await toolsApi.list()
      setTools(res.data.tools)
      setToolSummary(res.data.summary)
    } catch (err) {
      console.error(err)
    } finally {
      setStatusUpdating(null)
    }
  }

  if (loading) return <LoadingState message="Loading tools..." />

  const passRate = checkStats ? parseFloat(checkStats.passRate) : 0

  return (
    <>
      <Topbar
        title="Tools & Checks"
        subtitle="Inventory status and AR tool check history"
      />

      <div className="page-container">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Available" value={toolSummary.available} accentColor="var(--low)" />
          <StatCard label="Checked Out" value={toolSummary.checkedOut} accentColor="var(--accent)" />
          <StatCard label="Missing" value={toolSummary.missing}
            accentColor={toolSummary.missing > 0 ? 'var(--critical)' : 'var(--low)'} />
          <StatCard label="Check Pass Rate" value={`${passRate}%`}
            sub={`${checkStats?.total ?? 0} checks total`}
            accentColor={passRate >= 80 ? 'var(--low)' : 'var(--high)'} />
        </div>

        <div className="two-col">
          {/* Tool inventory */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title"><Package size={14} /> Tool Inventory</span>
              <span className="mono">{tools.length} tools</span>
            </div>
            {tools.length === 0 ? (
              <EmptyState icon={<Wrench size={32} />} message="No tools in inventory." />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Status</th>
                      {isAdmin && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tools.map(tool => (
                      <tr key={tool._id}>
                        <td style={{ fontWeight: 500 }}>{tool.name}</td>
                        <td className="mono">{tool.category?.replace(/_/g, ' ')}</td>
                        <td>
                          <span className={`badge ${
                            tool.status === 'available'   ? 'badge-low'     :
                            tool.status === 'missing'     ? 'badge-critical' :
                            tool.status === 'checked_out' ? 'badge-detected' :
                            'badge-medium'
                          }`}>
                            {tool.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            {tool.status === 'missing' && (
                              <button
                                className="btn btn-ghost"
                                style={{ fontSize: 11, padding: '3px 8px' }}
                                disabled={statusUpdating === tool._id}
                                onClick={() => updateToolStatus(tool._id, 'available')}
                              >
                                Mark Found
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tool checks */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title"><Wrench size={14} /> AR Tool Checks</span>
              <select className="select" style={{ fontSize: 11, padding: '3px 8px' }}
                value={checksFilter}
                onChange={e => setChecksFilter(e.target.value)}>
                <option value="">All</option>
                <option value="true">Pass</option>
                <option value="false">Fail</option>
              </select>
            </div>

            {checks.length === 0 ? (
              <EmptyState icon={<Wrench size={32} />} message="No tool checks recorded." />
            ) : (
              <>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Engineer</th>
                        <th>Result</th>
                        <th>Missing</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checks.map(check => (
                        <tr key={check._id} onClick={() => setSelectedCheck(check)}>
                          <td style={{ textTransform: 'capitalize' }}>
                            {check.checkType?.replace(/_/g, ' ')}
                          </td>
                          <td>{check.performedBy?.name ?? '—'}</td>
                          <td><PassFailBadge passed={check.passed} /></td>
                          <td className="mono" style={{ color: check.totalMissing > 0 ? 'var(--critical)' : 'inherit' }}>
                            {check.totalMissing > 0 ? check.totalMissing : '—'}
                          </td>
                          <td className="mono">{timeAgo(check.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {checkPagination.pages > 1 && (
                  <div className="pagination">
                    <span>{checkPagination.total} checks total</span>
                    <div className="pagination-controls">
                      <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                        disabled={checkPagination.page <= 1}
                        onClick={() => loadData(checkPagination.page - 1)}>
                        <ChevronLeft size={14} />
                      </button>
                      <span>{checkPagination.page}/{checkPagination.pages}</span>
                      <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                        disabled={checkPagination.page >= checkPagination.pages}
                        onClick={() => loadData(checkPagination.page + 1)}>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedCheck && (
        <CheckDetailModal check={selectedCheck} onClose={() => setSelectedCheck(null)} />
      )}
    </>
  )
}
