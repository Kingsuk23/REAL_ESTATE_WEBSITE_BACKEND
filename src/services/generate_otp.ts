import crypto from 'crypto';

export const generate_otp = (): Number => {
  const otp = crypto.randomInt(100000, 999999);
  return otp;
};
