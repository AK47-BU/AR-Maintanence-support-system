const API_BASE = '/api';

const Auth = {
  getToken: () => localStorage.getItem('ar_token'),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('ar_user') || 'null'); } catch { return null; }
  },
  save: (token, user) => {
    localStorage.setItem('ar_token', token);
    localStorage.setItem('ar_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('ar_token');
    localStorage.removeItem('ar_user');
  },
  isLoggedIn: () => !!localStorage.getItem('ar_token'),
  canWrite: () => {
    const u = Auth.getUser();
    return u && (u.role === 'admin' || u.role === 'engineer');
  }
};

async function request(path, options = {}) {
  const token = Auth.getToken();
  try {
    const res = await fetch(API_BASE + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    // Only redirect on 401 if the user had an active token (expired session).
    // A 401 on the login endpoint itself just means wrong credentials - don't redirect.
    if (res.status === 401 && Auth.getToken()) { Auth.clear(); window.location.href = '/ar/'; }
    return data;
  } catch (err) {
    return { success: false, message: 'Network error. Check your connection.' };
  }
}

const API = {
  login:           (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me:              ()                => request('/auth/me'),
  getFaults:       (params = {})     => request('/faults?' + new URLSearchParams(params)),
  createFault:     (data)            => request('/faults',               { method: 'POST',  body: JSON.stringify(data) }),
  updateFault:     (id, data)        => request('/faults/' + id,         { method: 'PATCH', body: JSON.stringify(data) }),
  annotateFault:   (id, text)        => request('/faults/' + id + '/annotate', { method: 'POST', body: JSON.stringify({ text }) }),
  getTools:        (params = {})     => request('/tools?' + new URLSearchParams(params)),
  submitToolCheck: (data)            => request('/tools/checks',         { method: 'POST',  body: JSON.stringify(data) }),
  uploadFaultPhoto: (id, formData)   => {
    const token = Auth.getToken();
    return fetch(`${API_BASE}/faults/${id}/photo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    }).then(r => r.json()).catch(() => ({ success: false, message: 'Upload failed.' }));
  }
};
