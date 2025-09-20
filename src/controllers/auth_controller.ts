import { Request, Response } from 'express';
import { try_catch_handler } from '../middlewares/centralized_error_handler';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { arcjet_config } from '../configs/arcjet_config';
import { prisma, redis_client } from '../configs/db_config';
import bcrypt, { compare } from 'bcrypt';
import {
  limiter_consecutive_fails_by_email_and_ip,
  limiter_slow_brute_by_ip,
  max_consecutive_fails_by_email_and_ip,
  max_wrong_attempts_by_ip_per_day,
} from '../configs/flexible_rate_limit_config';
import {
  get_email_ip_key,
  get_jwt_token,
  isRateLimiterRes,
} from '../utils/utils';
import { mail_sender_service } from '../services/mail_sender_service';
import { verify_otp_service } from '../services/verify_otp_service';
import { api_error } from '../utils/error_handler';
import { default_avatar } from '../utils/default_avatar';

export const registration_controller = try_catch_handler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    // Validate user email authentic
    const decision = await arcjet_config.protect(req, {
      email,
    });

    if (decision.isDenied()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message:
          " 'Oops! It seems you’re using a disposable email. For the best experience, please use a real email address.',",
      });
    }

    // check user already register or not
    const is_user_register = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (is_user_register) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ' An account with this email already exists',
      });
    }

    // Create hash password
    const gen_salt = bcrypt.genSaltSync(10);

    const hash_password = bcrypt.hashSync(password, gen_salt);

    // Generate avatar url
    const avatar_url = default_avatar(email);

    // Save user in database
    const new_user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash_password,
        role: 'buyer',
        avatar_url,
        is_email_verified: false,
      },
      select: {
        id: true,
        role: true,
      },
    });

    // send otp mail
    await mail_sender_service({
      email,
      id: new_user.id,
      email_type: 'verification',
    });

    const token = get_jwt_token(new_user.id, new_user.role);

    res.status(StatusCodes.CREATED).json({
      message: 'User created successfully',
      token,
    });
  },
);

export const email_verification_controller = try_catch_handler(
  async (req: Request, res: Response) => {
    const { id } = req.user;
    const { otp } = req.body;

    // validate user id and otp are filed
    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'User ID is required' });
    }

    if (!otp) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'OTP is required' });
    }

    // get user verification otp from redis database
    const is_otp_verified = await verify_otp_service(otp, id);

    if (!is_otp_verified) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Invalid or expire OTP' });
    }

    await prisma.user.update({
      where: { id },
      data: { is_email_verified: true },
      select: { id: true },
    });

    res.status(StatusCodes.OK).json({ message: 'User successfully verified' });
  },
);

export const send_otp_controller = try_catch_handler(
  async (req: Request, res: Response) => {
    const { id } = req.user;

    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'User ID is required' });
    }

    // find user exist or not
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'User request invalid' });
    }

    // send otp mail
    await mail_sender_service({
      email: user.email,
      id,
      email_type: 'verification',
    });

    res.status(StatusCodes.OK).json({ message: 'OTP send successfully' });
  },
);

export const login_user_controller = try_catch_handler(
  async (req: Request, res: Response) => {
    const ip_address = req.ip;
    const { email, password } = req.body;

    const email_ip_key = get_email_ip_key(email, ip_address as string);

    // Get current limiter states
    const [res_email_and_ip, res_slow_by_ip] = await Promise.all([
      limiter_consecutive_fails_by_email_and_ip.get(email_ip_key),
      limiter_slow_brute_by_ip.get(ip_address as string),
    ]);

    let retry_sec = 0;

    // Check if IP or Email+IP is already blocked
    if (
      res_slow_by_ip !== null &&
      res_slow_by_ip.consumedPoints > max_wrong_attempts_by_ip_per_day
    ) {
      retry_sec = Math.round(res_slow_by_ip.msBeforeNext / 1000) || 1;
    } else if (
      res_email_and_ip !== null &&
      res_email_and_ip.consumedPoints > max_consecutive_fails_by_email_and_ip
    ) {
      retry_sec = Math.round(res_email_and_ip.msBeforeNext / 1000) || 1;
    }

    if (retry_sec > 0) {
      res.set('Retry-After', String(retry_sec));
      return res
        .status(StatusCodes.TOO_MANY_REQUESTS)
        .send('Too Many Requests');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, role: true },
    });

    if (!user) {
      try {
        await limiter_slow_brute_by_ip.consume(ip_address as string);
      } catch (rlRejected) {
        if (isRateLimiterRes(rlRejected)) {
          res.set(
            'Retry-After',
            String(Math.round(rlRejected.msBeforeNext / 1000)) || '1',
          );
          return res
            .status(StatusCodes.TOO_MANY_REQUESTS)
            .send('Too Many Requests');
        }
        throw rlRejected;
      }

      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'User does not exist' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      try {
        await Promise.all([
          limiter_slow_brute_by_ip.consume(ip_address as string),
          limiter_consecutive_fails_by_email_and_ip.consume(email_ip_key),
        ]);
      } catch (rlRejected) {
        if (isRateLimiterRes(rlRejected)) {
          res.set(
            'Retry-After',
            String(Math.round(rlRejected.msBeforeNext / 1000)) || '1',
          );
          return res
            .status(StatusCodes.TOO_MANY_REQUESTS)
            .send('Too Many Requests');
        }
        throw rlRejected;
      }

      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Invalid user credentials' });
    }

    // Clear consecutive fail counter on successful login
    if (res_email_and_ip !== null && res_email_and_ip.consumedPoints > 0) {
      await limiter_consecutive_fails_by_email_and_ip.delete(email_ip_key);
    }

    const token = get_jwt_token(user.id, user.role);

    res
      .status(StatusCodes.OK)
      .json({ message: 'User login successfully', token });
  },
);

export const logout_user_controller = try_catch_handler(
  async (req: Request, res: Response) => {
    const { id } = req.user;
    const token = req.token;
    const token_expire_date = req.token_expire_date;

    const logout_user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!logout_user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Invalid user' });
    }

    await redis_client.setEx(`blacklist_${token}`, token_expire_date, token);

    res.status(StatusCodes.OK).json({ message: 'Logout successfully' });
  },
);

export const update_auth_password = try_catch_handler(
  async (req: Request, res: Response) => {
    const { id } = req.user;
    const { old_pass, new_pass } = req.body;

    const is_exist_user = await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!is_exist_user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Unauthorize access' });
    }

    const compare_pass = bcrypt.compareSync(old_pass, is_exist_user.password);

    if (!compare_pass) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Unauthorize access' });
    }

    const gen_salt = bcrypt.genSaltSync(10);
    const hash_pass = bcrypt.hashSync(new_pass, gen_salt);

    await prisma.user.update({
      where: { id },
      data: { password: hash_pass },
      select: { id: true },
    });

    res
      .status(StatusCodes.OK)
      .json({ message: 'Password update successfully' });
  },
);

export const update_auth_email = try_catch_handler(
  async (req: Request, res: Response) => {
    const { id } = req.user;

    const { new_email, otp } = req.body;

    const decision = await arcjet_config.protect(req, {
      email: new_email,
    });

    if (decision.isDenied()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message:
          " 'Oops! It seems you’re using a disposable email. For the best experience, please use a real email address.',",
      });
    }

    const is_exist_user = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!is_exist_user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Unauthorize access' });
    }

    // verify user otp
    const is_otp_verified = await verify_otp_service(otp, id);

    if (!is_otp_verified) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Invalid or expire OTP' });
    }

    await prisma.user.update({
      where: { id },
      data: { email: new_email },
      select: { id: true },
    });

    // Todo: user cache update

    res.status(StatusCodes.OK).json({ message: 'email update successfully' });
  },
);

export const reset_password_request = try_catch_handler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const is_exist_user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!is_exist_user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Unauthorize access' });
    }

    await mail_sender_service({
      email,
      email_type: 'reset',
      id: is_exist_user.id,
      url: 'http://localhost:3000/api/v1/reset_password',
    });

    res.status(StatusCodes.OK).json({ message: 'Reset email send' });
  },
);

export const reset_password = try_catch_handler(
  async (req: Request, res: Response) => {
    const { token, id } = req.query;
    const { password } = req.body;

    if (typeof token !== 'string' || typeof id !== 'string') {
      throw (
        new api_error(
          getReasonPhrase(StatusCodes.BAD_REQUEST),
          StatusCodes.BAD_REQUEST,
        ),
        'Type error',
        true
      );
    }

    const is_user_exist = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!is_user_exist) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Invalid request',
      });
    }

    const save_data = await redis_client.get(`auth_pass_reset_token_${id}`);

    if (!save_data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Invalid request',
      });
    }

    const { token_hash } = JSON.parse(save_data);

    const is_original_token = bcrypt.compareSync(token, token_hash);

    if (!is_original_token) {
      return res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ message: 'Token is invalid' });
    }

    const pass_slat = bcrypt.genSaltSync(10);
    const pass_hash = bcrypt.hashSync(password, pass_slat);

    await prisma.user.update({
      where: { id },
      data: { password: pass_hash },
      select: { id: true },
    });

    await redis_client.del(`auth_pass_reset_token_${id}`);

    res
      .status(StatusCodes.OK)
      .json({ message: 'User password update successfully' });
  },
);
