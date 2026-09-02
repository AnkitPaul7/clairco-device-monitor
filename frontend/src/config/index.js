const env = import.meta.env;

const config = {
  apiUrl: env.VITE_API_URL || 'http://localhost:5000',
  wsUrl: env.VITE_WS_URL || 'ws://localhost:5000',
  apiKey: env.VITE_API_KEY || '',
  refreshIntervalMs: Number(env.VITE_REFRESH_INTERVAL_MS || 30000)
};

export default config;
