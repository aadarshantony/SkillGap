import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sg_token');
      localStorage.removeItem('sg_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login:  (data) => api.post('/auth/login', data),
  me:     ()     => api.get('/auth/me'),
};

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileApi = {
  get:         ()       => api.get('/profile'),
  update:      (data)   => api.put('/profile', data),
  parseResume: (file)   => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/profile/resume', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
  },
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobsApi = {
  getEmployerJobs: (params) => api.get('/jobs/employer', { params }),
  getPublicJobs:   (params) => api.get('/jobs/public', { params }),
  getJob:          (type, id) => api.get(`/jobs/${type}/${id}`),
  postJob:         (data)   => api.post('/jobs', data),
  apply:           (type, id) => api.post(`/jobs/${type}/${id}/apply`),
};

// ─── Skills ──────────────────────────────────────────────────────────────────
export const skillsApi = {
  getTaxonomy: ()       => api.get('/skills/taxonomy'),
  getGap:      ()       => api.get('/skills/gap'),
  getDemand:   (params) => api.get('/skills/demand', { params }),
};

// ─── Learning Paths ───────────────────────────────────────────────────────────
export const pathsApi = {
  getAll:         ()           => api.get('/paths'),
  getOne:         (id)         => api.get(`/paths/${id}`),
  generate:       (data)       => api.post('/paths/generate', data),
  completeStep:   (id, order)  => api.patch(`/paths/${id}/step/${order}`),
  getTest:        (id)         => api.get(`/paths/${id}/test`),
  submitCheckpoint: (id, data) => api.post(`/paths/${id}/checkpoint`, data),
};

// ─── Credentials ─────────────────────────────────────────────────────────────
export const credentialsApi = {
  getMine:  ()     => api.get('/credentials'),
  getBySlug: (slug) => api.get(`/credentials/${slug}`),
};

// ─── Employer ─────────────────────────────────────────────────────────────────
export const employerApi = {
  getMyJobs:       ()       => api.get('/employer/jobs'),
  getCandidates:   (params) => api.get('/employer/candidates', { params }),
  getCandidate:    (id)     => api.get(`/employer/candidates/${id}`),
  getHeatmap:      (params) => api.get('/employer/heatmap', { params }),
};
