const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Resource routes currently return arrays. Also accept the paginated envelopes
// used by newer routes without passing an object into a table's map/length.
export function resourceRows(payload, resource) {
  const rows = Array.isArray(payload) ? payload : payload?.data ?? payload?.items;
  if (!Array.isArray(rows)) throw new Error(`Invalid ${resource} list response: expected an array of records.`);
  return rows;
}

export const api = {
  // Auth
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  // CRUD for each resource
  getAll: async (resource) => resourceRows(await request(`/${resource}`), resource),
  getOne: (resource, id) => request(`/${resource}/${id}`),
  create: (resource, body) => request(`/${resource}`, { method: 'POST', body: JSON.stringify(body) }),
  update: (resource, id, body) => request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (resource, id) => request(`/${resource}/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // AI
  aiRequest: (endpoint, prompt) => request(`/ai/${endpoint}`, { method: 'POST', body: JSON.stringify({ prompt }) }),
  aiPost: (endpoint, body) => request(`/ai/${endpoint}`, { method: 'POST', body: JSON.stringify(body || {}) }),

  // File upload helper (for OCR / floor plans / photos)
  uploadFile: async (resource, file, extra = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/${resource}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};
