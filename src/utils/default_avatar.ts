import crypto from 'crypto';

export const default_avatar = (email: string) => {
  const size = 64;
  const defaultType = 'retro';
  const normalized = email.trim().toLocaleLowerCase();
  const hash = crypto.createHash('md5').update(normalized).digest('hex');

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultType}`;
};
