import apiClient from './axios';

export async function getAlerts(params = {}) {
  const response = await apiClient.get('/alerts', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination || {}
  };
}

export async function getActiveAlerts(params = {}) {
  const response = await apiClient.get('/alerts/active', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination || {}
  };
}

export async function getAlertStats() {
  const response = await apiClient.get('/alerts/stats');
  return response.data.data;
}

export async function resolveAlert(id) {
  const response = await apiClient.post(`/alerts/${id}/resolve`);
  return response.data.data;
}

export async function acknowledgeAlert(id) {
  const response = await apiClient.post(`/alerts/${id}/acknowledge`);
  return response.data.data;
}
