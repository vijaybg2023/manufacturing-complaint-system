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
export const complaintsAPI = {
  list: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
};

// 8D Reports
export const eightDAPI = {
  getByComplaint: (complaintId) => api.get(`/8d/complaint/${complaintId}`),
  create: (data) => api.post('/8d', data),
  update: (id, data) => api.put(`/8d/${id}`, data),
};

// Corrective Actions
export const correctiveActionsAPI = {
  getByComplaint: (complaintId) => api.get(`/corrective-actions/complaint/${complaintId}`),
  create: (data) => api.post('/corrective-actions', data),
  update: (id, data) => api.put(`/corrective-actions/${id}`, data),
  delete: (id) => api.delete(`/corrective-actions/${id}`),
};

// Dashboard
export const dashboardAPI = {
  summary: () => api.get('/dashboard/summary'),
  trends: (months) => api.get('/dashboard/trends', { params: { months } }),
  topIssues: () => api.get('/dashboard/top-issues'),
  actionsDue: () => api.get('/dashboard/actions-due'),
  byType: () => api.get('/dashboard/by-type'),
  bySeverity: () => api.get('/dashboard/by-severity'),
};

// Users
export const usersAPI = {
  me: () => api.get('/users/me'),
  getAll: () => api.get('/users'),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
};

// Storage / Attachments
export const storageAPI = {
  upload: (complaintId, formData) => api.post(`/attachments/${complaintId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  list: (complaintId) => api.get(`/attachments/${complaintId}`),
  delete: (complaintId, attachmentId) => api.delete(`/attachments/${complaintId}/${attachmentId}`),
};

// Legacy aliases for backward compatibility
export const complaintsApi = complaintsAPI;
export const dashboardApi = dashboardAPI;
export const usersApi = usersAPI;
export const attachmentsApi = storageAPI;

export default api;
