import axios from 'axios';
import config from '../config';

const apiClient = axios.create({
  baseURL: `${config.apiUrl}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(config.apiKey ? { 'x-api-key': config.apiKey } : {})
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
