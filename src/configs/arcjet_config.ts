import arcjet, { validateEmail } from '@arcjet/node';
import env_configs from './env_config';

export const arcjet_config = arcjet({
  key: env_configs.ARCJET_KEY,
  rules: [
    validateEmail({
      mode: 'LIVE',
      deny: ['DISPOSABLE', 'NO_MX_RECORDS', 'INVALID'],
    }),
  ],
});
