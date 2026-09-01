function authenticate(req, res, next) {
  const configuredKey = process.env.API_KEY;

  if (!configuredKey) {
    return next();
  }

  const providedKey = req.get('x-api-key');

  if (providedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing API key'
    });
  }

  return next();
}

module.exports = {
  authenticate
};
