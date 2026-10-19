/**
 * PlantCare AI — API communication layer
 * All backend requests go through this module.
 */
const API_BASE_URL = 'http://localhost:8000';

const api = {
  /**
   * Generic fetch wrapper with error handling.
   */
  async request(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    const defaults = {
      credentials: 'include',
      headers: {},
    };

    // If body is FormData, don't set Content-Type (browser sets boundary)
    if (options.body && !(options.body instanceof FormData)) {
      defaults.headers['Content-Type'] = 'application/json';
      if (typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
      }
    }

    const config = { ...defaults, ...options, headers: { ...defaults.headers, ...options.headers } };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let detail = `Request failed (${response.status})`;
        try {
          const data = await response.json();
          detail = data.detail || detail;
        } catch (_) { /* ignore parse errors */ }
        throw new Error(detail);
      }

      return await response.json();
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot connect to the server. Please ensure the backend is running.');
      }
      throw err;
    }
  },

  /* ── Health ─────────────────────────────────────────── */
  healthCheck() {
    return this.request('/api/health');
  },

  /* ── Auth ───────────────────────────────────────────── */
  register(data) {
    return this.request('/api/auth/register', { method: 'POST', body: data });
  },

  login(data) {
    return this.request('/api/auth/login', { method: 'POST', body: data });
  },

  logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  },

  getMe() {
    return this.request('/api/auth/me');
  },

  /* ── Analysis ───────────────────────────────────────── */
  analyzeImage(formData) {
    return this.request('/api/analyze', { method: 'POST', body: formData });
  },

  /* ── Reports ────────────────────────────────────────── */
  saveReport(data) {
    return this.request('/api/reports', { method: 'POST', body: data });
  },

  getReports(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/reports${qs ? '?' + qs : ''}`);
  },

  getReport(id) {
    return this.request(`/api/reports/${id}`);
  },

  deleteReport(id) {
    return this.request(`/api/reports/${id}`, { method: 'DELETE' });
  },

  getStats() {
    return this.request('/api/reports/stats');
  },

  /* ── Image URL helper ───────────────────────────────── */
  imageUrl(filename) {
    return `${API_BASE_URL}/uploads/${filename}`;
  },

  /* ── Chatbot ────────────────────────────────────────── */
  chatCropProfitability(data) {
    return this.request('/api/chat/crop-profitability', { method: 'POST', body: data });
  },
};
