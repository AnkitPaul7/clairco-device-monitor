const levels = ['error', 'warn', 'info', 'debug'];
const configuredLevel = process.env.LOG_LEVEL || 'info';
const configuredIndex = levels.indexOf(configuredLevel);

function shouldLog(level) {
  const levelIndex = levels.indexOf(level);
  return levelIndex <= (configuredIndex === -1 ? levels.indexOf('info') : configuredIndex);
}

function log(level, message, meta) {
  if (!shouldLog(level)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
  console[level === 'debug' ? 'log' : level](
    `[${timestamp}] ${level.toUpperCase()} ${message}${suffix}`
  );
}

module.exports = {
  debug: (message, meta) => log('debug', message, meta),
  error: (message, meta) => log('error', message, meta),
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta)
};
