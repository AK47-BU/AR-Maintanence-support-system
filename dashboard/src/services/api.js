// ─────────────────────────────────────────────────
// API Service
//
// All fetch calls go through here. The token is
// stored in memory (not localStorage) for security.
// ─────────────────────────────────────────────────

let authToken = null

export function setToken(token) {
  authToken = token
}

export function clearToken() {
  authToken = null
}

// Core fetch wrapper
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`/api${path}`, { ...options, headers })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`)
  }

  return data
}

// Auth
export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),
  listUsers: () => request('/auth/users'),
}

// Faults
export const faultsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/faults${qs ? '?' + qs : ''}`)
  },
  getOne: (id) => request(`/faults/${id}`),
  getStats: () => request('/faults/stats'),
  create: (body) => request('/faults', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/faults/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  annotate: (id, text) =>
    request(`/faults/${id}/annotate`, { method: 'POST', body: JSON.stringify({ text }) }),
}

// Tools
export const toolsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/tools${qs ? '?' + qs : ''}`)
  },
  updateStatus: (id, status) =>
    request(`/tools/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listChecks: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/tools/checks${qs ? '?' + qs : ''}`)
  },
  getCheckStats: () => request('/tools/checks/stats'),
}

// Dashboard
export const dashboardApi = {
  getOverview: () => request('/dashboard/overview'),
  getFaultTrends: (days = 30) => request(`/dashboard/fault-trends?days=${days}`),
  getAuditLog: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/dashboard/audit-log${qs ? '?' + qs : ''}`)
  },
  getSecurityEvents: () => request('/dashboard/security-events'),
}
