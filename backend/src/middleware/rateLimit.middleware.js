const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  maxRequests = 10,
  message = "Too many requests. Please try again later.",
} = {}) => {
  const hits = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();

    for (const [key, bucket] of hits.entries()) {
      if (bucket.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, windowMs);

  cleanupInterval.unref?.();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const bucket = hits.get(key);

    if (!bucket || bucket.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
      next();
      return;
    }

    bucket.count += 1;

    const remaining = Math.max(maxRequests - bucket.count, 0);
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > maxRequests) {
      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({ message });
      return;
    }

    next();
  };
};

const apiRateLimiter = createRateLimiter({
  windowMs: parsePositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  maxRequests: parsePositiveInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 300),
});

const authRateLimiter = createRateLimiter({
  windowMs: parsePositiveInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  maxRequests: parsePositiveInteger(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 20),
  message: "Too many authentication attempts. Please try again later.",
});

module.exports = {
  apiRateLimiter,
  authRateLimiter,
  createRateLimiter,
};
