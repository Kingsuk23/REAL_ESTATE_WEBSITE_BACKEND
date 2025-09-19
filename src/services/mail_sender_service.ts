import { redis_client } from '../configs/db_config';
import { mail_sender_queue, retry_failed_job } from './bullmq_service';
import { generate_otp } from './generate_otp';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

interface mail_sender_service_props {
  id: string;
  email: string;
  email_type: string;
  url?: string;
}

export const mail_sender_service = async ({
  email,
  id,
  email_type,
  url,
}: mail_sender_service_props) => {
  let medium;
  if (email_type === 'verification') {
    // generate otp here
    const otp = generate_otp();

    const otp_salt = bcrypt.genSaltSync(10);
    const otp_hash = bcrypt.hashSync(String(otp), otp_salt);

    // store in redis using user id
    await redis_client.set(
      `auth_verification_otp_${id}`,
      JSON.stringify({ otp_hash }),
      {
        EX: 300,
      },
    );
    medium = otp;
  } else {
    const resetToken = crypto.randomBytes(32).toString('hex');

    const token_salt = bcrypt.genSaltSync(10);
    const token_hash = bcrypt.hashSync(resetToken, token_salt);

    await redis_client.set(
      `auth_pass_reset_token_${id}`,
      JSON.stringify({ token_hash }),
      {
        EX: 300,
      },
    );
    medium = `${url}?token=${resetToken}&id=${id}`;
  }

  // add job to send otp
  await mail_sender_queue.add(
    'send_auth_verification_to_the user',
    { email, medium, email_type },
    retry_failed_job,
  );
};
