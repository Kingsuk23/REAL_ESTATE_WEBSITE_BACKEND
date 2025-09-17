import { RateLimiterRes } from 'rate-limiter-flexible';
import jwt from 'jsonwebtoken';
import env_configs from '../configs/env_config';

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
