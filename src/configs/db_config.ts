import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import env_configs from './env_config';

export const redis_config = {
  username: env_configs.REDIS_USERNAME,
  password: env_configs.REDIS_PASSWORD,
  host: env_configs.REDIS_HOST,
  port: Number(env_configs.REDIS_PORT),
};

export const prisma = new PrismaClient();

export const redis_client = createClient({
  username: redis_config.username,
  password: redis_config.password,
  socket: { host: redis_config.host, port: redis_config.port },
});

(async () => {
  redis_client.on('error', (err) => {
    console.log('Redis Client Error', err);
  });
  await redis_client.connect();
})();
