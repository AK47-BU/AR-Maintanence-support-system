import { useState, useEffect, useCallback } from 'react'
import { Plus, AlertTriangle, X, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { faultsApi } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { Topbar } from '../components/layout/Topbar.jsx'
import { SeverityBadge, StatusBadge } from '../components/ui/Badge.jsx'
import { LoadingState, EmptyState } from '../components/ui/LoadingState.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { timeAgo, fullDate } from '../utils/format.js'

// ── Report Fault Modal ────────────────────────────

function ReportFaultModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'structural',
    severity: 'medium', location: { area: '', depot: 'Main Depot', vehicleId: '' },
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function setLocation(key, value) {
    setForm(prev => ({ ...prev, location: { ...prev.location, [key]: value } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await faultsApi.create(form)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Report New Fault"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Report Fault'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-error"><X size={14} />{error}</div>}

      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="input" value={form.title} onChange={e => setField('title', e.target.value)}
          placeholder="e.g. Cracked nearside panel" required />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <input className="input" value={form.description}
          onChange={e => setField('description', e.target.value)}
          placeholder="Additional details..." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Type *</label>
          <select className="select" value={form.type} onChange={e => setField('type', e.target.value)}>
            {['structural','electrical','mechanical','wear','safety','other'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Severity *</label>
          <select className="select" value={form.severity} onChange={e => setField('severity', e.target.value)}>
            {['critical','high','medium','low'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Location Area *</label>
        <input className="input" value={form.location.area}
          onChange={e => setLocation('area', e.target.value)}
          placeholder="e.g. Bus exterior — left panel" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Vehicle ID</label>
          <input className="input" value={form.location.vehicleId}
            onChange={e => setLocation('vehicleId', e.target.value)}
            placeholder="e.g. BF22 YTR" />
        </div>
        <div className="form-group">
          <label className="form-label">Depot</label>
          <input className="input" value={form.location.depot}
            onChange={e => setLocation('depot', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

// ── Fault Detail Modal ────────────────────────────

function FaultDetailModal({ fault: initialFault, onClose, onUpdated }) {
  const { user } = useAuth()
  const [fault, setFault] = useState(initialFault)
  const [annotation, setAnnotation] = useState('')
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const canEdit = user?.role === 'admin' || user?.role === 'engineer'

  async function submitAnnotation(e) {
    e.preventDefault()
    if (!annotation.trim()) return
    setSaving(true)
    try {
      const res = await faultsApi.annotate(fault._id, annotation.trim())
      setFault(res.data.fault)
      setAnnotation('')
      onUpdated()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(status) {
    setStatusSaving(true)
    try {
      const res = await faultsApi.update(fault._id, { status })
      setFault(res.data.fault)
      onUpdated()
    } catch (err) {
      console.error(err)
    } finally {
      setStatusSaving(false)
    }
  }

  const nextStatuses = {
    detected: ['confirmed', 'false_alarm'],
    confirmed: ['in_progress', 'false_alarm'],
    in_progress: ['resolved'],
    resolved: [],
    false_alarm: [],
  }

  return (
    <Modal title={fault.title} onClose={onClose}>
      {/* Severity + status */}
      <div style={{ display: 'flex', gap: 8 }}>
        <SeverityBadge severity={fault.severity} />
        <StatusBadge status={fault.status} />
        <span className="mono" style={{ marginLeft: 'auto' }}>{fault.type}</span>
      </div>

      {/* Meta grid */}
      <div className="fault-meta">
        <div className="fault-meta-item">
          <div className="label">Location</div>
          <div className="value">{fault.location?.area ?? '—'}</div>
        </div>
        <div className="fault-meta-item">
          <div className="label">Vehicle</div>
          <div className="value">{fault.location?.vehicleId ?? '—'}</div>
        </div>
        <div className="fault-meta-item">
          <div className="label">Depot</div>
          <div className="value">{fault.location?.depot ?? '—'}</div>
        </div>
        <div className="fault-meta-item">
          <div className="label">Detected By</div>
          <div className="value">{fault.detectedBy?.name ?? '—'}</div>
        </div>
        <div className="fault-meta-item">
          <div className="label">Reported</div>
          <div className="value">{fullDate(fault.createdAt)}</div>
        </div>
        {fault.resolvedAt && (
          <div className="fault-meta-item">
            <div className="label">Resolved</div>
            <div className="value">{fullDate(fault.resolvedAt)}</div>
          </div>
        )}
      </div>

      {fault.description && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fault.description}</p>
      )}

      {/* Status transitions */}
      {canEdit && nextStatuses[fault.status]?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>
            Move to:
          </span>
          {nextStatuses[fault.status].map(s => (
            <button
              key={s}
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '4px 10px' }}
              disabled={statusSaving}
              onClick={() => updateStatus(s)}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Annotations */}
      <div>
        <div className="panel-title" style={{ marginBottom: 10 }}>
          <MessageSquare size={14} /> Annotations ({fault.annotations?.length ?? 0})
        </div>
        <div className="annotations-list">
          {fault.annotations?.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No annotations yet.</p>
          )}
          {fault.annotations?.map((ann, i) => (
            <div key={i} className="annotation-item">
              <div className="annotation-meta">
                {ann.author?.name ?? 'Unknown'} · {timeAgo(ann.createdAt)}
              </div>
              <div className="annotation-text">{ann.text}</div>
            </div>
          ))}
        </div>

        {canEdit && (
          <form onSubmit={submitAnnotation} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              value={annotation}
              onChange={e => setAnnotation(e.target.value)}
              placeholder="Add an annotation..."
            />
            <button className="btn btn-primary" type="submit" disabled={saving || !annotation.trim()}>
              Add
            </button>
          </form>
        )}
      </div>
    </Modal>
  )
}

// ── Main Faults Page ──────────────────────────────

export function FaultsPage() {
  const { user } = useAuth()
  const [faults, setFaults] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [filters, setFilters] = useState({ status: '', severity: '', type: '' })
  const [loading, setLoading] = useState(true)
  const [showReport, setShowReport] = useState(false)
  const [selectedFault, setSelectedFault] = useState(null)

  const canReport = user?.role === 'admin' || user?.role === 'engineer'

  const loadFaults = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }
      const res = await faultsApi.list(params)
      setFaults(res.data.faults)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { loadFaults(1) }, [loadFaults])

  // Load the full fault detail when clicked
  async function openFault(id) {
    const res = await faultsApi.getOne(id)
    setSelectedFault(res.data.fault)
  }

  return (
    <>
      <Topbar
        title="Faults"
        subtitle={`${pagination.total} total faults in system`}
        actions={
          canReport && (
            <button className="btn btn-primary" onClick={() => setShowReport(true)}>
              <Plus size={14} /> Report Fault
            </button>
          )
        }
      />

      <div className="page-container">
        {/* Filters */}
        <div className="filter-bar">
          <select className="select" value={filters.status}
            onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {['detected','confirmed','in_progress','resolved','false_alarm'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>

          <select className="select" value={filters.severity}
            onChange={e => setFilters(p => ({ ...p, severity: e.target.value }))}>
            <option value="">All Severities</option>
            {['critical','high','medium','low'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select className="select" value={filters.type}
            onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
            <option value="">All Types</option>
            {['structural','electrical','mechanical','wear','safety','other'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {(filters.status || filters.severity || filters.type) && (
            <button className="btn btn-ghost" onClick={() => setFilters({ status:'', severity:'', type:'' })}>
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="panel">
          {loading ? (
            <LoadingState message="Loading faults..." />
          ) : faults.length === 0 ? (
            <EmptyState icon={<AlertTriangle size={32} />} message="No faults match your filters." />
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Vehicle</th>
                      <th>Detected By</th>
                      <th>Reported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faults.map(fault => (
                      <tr key={fault._id} onClick={() => openFault(fault._id)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`dot dot-${fault.severity}`} />
                            <span style={{ fontWeight: 500 }}>{fault.title}</span>
                          </div>
                          {fault.annotations?.length > 0 && (
                            <span className="mono" style={{ fontSize: 10, marginLeft: 14 }}>
                              {fault.annotations.length} note{fault.annotations.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </td>
                        <td className="mono">{fault.type}</td>
                        <td><SeverityBadge severity={fault.severity} /></td>
                        <td><StatusBadge status={fault.status} /></td>
                        <td className="mono">{fault.location?.area ?? '—'}</td>
                        <td className="mono">{fault.location?.vehicleId ?? '—'}</td>
                        <td>{fault.detectedBy?.name ?? '—'}</td>
                        <td className="mono">{timeAgo(fault.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <span>Showing {faults.length} of {pagination.total} faults</span>
                  <div className="pagination-controls">
                    <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                      disabled={pagination.page <= 1}
                      onClick={() => loadFaults(pagination.page - 1)}>
                      <ChevronLeft size={14} />
                    </button>
                    <span>Page {pagination.page} of {pagination.pages}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => loadFaults(pagination.page + 1)}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showReport && (
        <ReportFaultModal onClose={() => setShowReport(false)} onSaved={() => loadFaults(1)} />
      )}

      {selectedFault && (
        <FaultDetailModal
          fault={selectedFault}
          onClose={() => setSelectedFault(null)}
          onUpdated={() => loadFaults(pagination.page)}
        />
      )}
    </>
  )
}
