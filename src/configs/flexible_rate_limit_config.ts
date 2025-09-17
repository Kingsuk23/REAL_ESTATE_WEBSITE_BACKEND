import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis_client } from './db_config';

export const max_wrong_attempts_by_ip_per_day = 100;
export const max_consecutive_fails_by_email_and_ip = 10;

export const limiter_slow_brute_by_ip = new RateLimiterRedis({
  storeClient: redis_client,
  useRedisPackage: true,
  keyPrefix: 'login_fail_ip_per_day',
  points: max_wrong_attempts_by_ip_per_day,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24,
});

export const limiter_consecutive_fails_by_email_and_ip = new RateLimiterRedis({
  storeClient: redis_client,
  useRedisPackage: true,
  keyPrefix: 'login_fail_consecutive_username_and_ip',
  points: max_consecutive_fails_by_email_and_ip,
  duration: 60 * 60 * 90,
  blockDuration: 60 * 60,
});
