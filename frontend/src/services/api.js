import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: '/api',
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Complaints
export const complaintsApi = {
  list: (params) => api.get('/complaints', { params }),
  get: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  update8D: (id, data) => api.put(`/complaints/${id}/8d`, data),
  addAction: (id, data) => api.post(`/complaints/${id}/actions`, data),
  updateAction: (id, actionId, data) => api.put(`/complaints/${id}/actions/${actionId}`, data),
};

// Dashboard
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  trends: (months) => api.get('/dashboard/trends', { params: { months } }),
  topIssues: () => api.get('/dashboard/top-issues'),
  actionsDue: () => api.get('/dashboard/actions-due'),
};

// Users
export const usersApi = {
  me: () => api.get('/users/me'),
  list: () => api.get('/users'),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
};

// Attachments
export const attachmentsApi = {
  upload: (complaintId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/attachments/${complaintId}`, form);
  },
  download: (complaintId, attachmentId) => api.get(`/attachments/${complaintId}/${attachmentId}/download`),
  delete: (complaintId, attachmentId) => api.delete(`/attachments/${complaintId}/${attachmentId}`),
};

export default api;
