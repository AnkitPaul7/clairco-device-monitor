const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

function corsOriginHandler(origin, callback) {
  // No Origin header (curl, server-to-server, same-origin) — always allow.
  if (!origin) {
    return callback(null, true);
  }

  // Outside production, accept any origin so the dashboard works from
  // localhost, 127.0.0.1, or a LAN IP (whatever host/port CRA is served from)
  // without needing FRONTEND_URL to list every possibility.
  if (!isProduction) {
    return callback(null, true);
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`Origin ${origin} is not allowed by CORS`));
}

module.exports = {
  corsOriginHandler
};
