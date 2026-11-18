import type { Request, Response, NextFunction } from 'express';
const attempts = new Map<string, { count: number; reset: number }>();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 20;
export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  let state = attempts.get(key);
  if (!state || state.reset <= now) {
    state = { count: 0, reset: now + windowMs };
    attempts.set(key, state);
  }
  state.count++;
  res.setHeader('RateLimit-Limit', maxAttempts);
  res.setHeader('RateLimit-Remaining', Math.max(0, maxAttempts - state.count));
  if (state.count > maxAttempts) return res.status(429).json({ error: 'Too many sign-in attempts. Please wait a few minutes and try again.' });
  next();
}
