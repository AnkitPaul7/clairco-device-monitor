import apiClient from './axios';

export async function getDevices(params = {}) {
  const response = await apiClient.get('/devices', { params });
  return response.data.data || [];
}

export async function createDevice(payload) {
  const response = await apiClient.post('/devices', payload);
  return response.data.data;
}

export async function updateDevice(id, payload) {
  const response = await apiClient.put(`/devices/${id}`, payload);
  return response.data.data;
}

export async function deleteDevice(id) {
  const response = await apiClient.delete(`/devices/${id}`);
  return response.data.data;
}
