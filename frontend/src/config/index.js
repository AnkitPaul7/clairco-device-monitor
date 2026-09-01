const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:5000',
  apiKey: process.env.REACT_APP_API_KEY || '',
  refreshIntervalMs: Number(process.env.REACT_APP_REFRESH_INTERVAL_MS || 30000)
};

export default config;
