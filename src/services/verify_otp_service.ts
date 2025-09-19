import { redis_client } from '../configs/db_config';
import bcrypt from 'bcrypt';

export const verify_otp_service = async (otp: number, id: string) => {
  const get_save_otp = await redis_client.get(`auth_verification_otp_${id}`);

  if (!get_save_otp) {
    return false;
  }

  const { otp_hash } = JSON.parse(get_save_otp);

  const original_otp = bcrypt.compareSync(String(otp), otp_hash);

  if (!original_otp) {
    return false;
  }

  await redis_client.del(`auth_verification_otp_${id}`);

  return true;
};
