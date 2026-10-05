/**
 * FinTrack Shield — Audit Logging Middleware Helper
 *
 * Helper to capture client IP for audit log entries.
 */

/**
 * Extract the real client IP, considering proxies.
 * @param {import('express').Request} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

module.exports = { getClientIp };
