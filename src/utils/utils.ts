import { RateLimiterRes } from 'rate-limiter-flexible';
import jwt from 'jsonwebtoken';
import env_configs from '../configs/env_config';
import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';

export const get_email_ip_key = (email: string, ip: string) => `${email}_${ip}`;

export function isRateLimiterRes(obj: any): obj is RateLimiterRes {
  return (
    obj &&
    typeof obj === 'object' &&
    'msBeforeNext' in obj &&
    'consumedPoints' in obj
  );
}

export const get_jwt_token = (id: string, role: string): string => {
  const data = { user: { id, role } };
  const token = jwt.sign(data, env_configs.JWT_SECRET, { expiresIn: '30d' });
  return token;
};

export const api_rate_limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: 'Too many request from this ip address',
    retryAfter: '1 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      error: 'Rate limit exceeded',
      message: 'Too many request from this IP, please try again later',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});
