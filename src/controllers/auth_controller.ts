import { Request, Response } from 'express';
import { try_catch_handler } from '../middlewares/centralized_error_handler';
import { StatusCodes } from 'http-status-codes';
import { arcjet_config } from '../configs/arcjet_config';
import { prisma, redis_client } from '../configs/db_config';
import bcrypt from 'bcrypt';
import { generate_otp } from '../services/generate_otp';
import {
  mail_sender_queue,
  retry_failed_job,
} from '../services/bullmq_service';
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
    const is_user_register = await prisma.user.findUnique({ where: { email } });

    if (is_user_register) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ' An account with this email already exists',
      });
    }

    // Create hash password
    const gen_salt = bcrypt.genSaltSync(10);

    const hash_password = bcrypt.hashSync(password, gen_salt);

    // Save user in database
    const new_user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash_password,
        role: 'buyer',
        is_email_verified: false,
      },
      select: {
        id: true,
        role: true,
      },
    });

    // generate otp here
    const otp = generate_otp();

    // store in redis using user id
    await redis_client.set(`user-${new_user.id}`, JSON.stringify({ otp }), {
      EX: 300,
    });

    // add job to send otp
    await mail_sender_queue.add(
      'send_otp_to_the user',
      { email, otp },
      retry_failed_job,
    );

    const token = get_jwt_token(new_user.id, new_user.role);

    res.status(StatusCodes.CREATED).json({
      message: 'User created successfully',
      token,
    });
  },
);

export const otp_validation_controller = try_catch_handler(
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
    const get_save_otp = await redis_client.get(`user-${id}`);

    if (!get_save_otp) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'OTP has expired or is invalid' });
    }

    const save_otp: { otp: number } = JSON.parse(get_save_otp);

    if (save_otp.otp !== otp) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'OTP does not match' });
    }

    await prisma.user.update({
      where: { id },
      data: { is_email_verified: true },
    });
    await redis_client.del(`user-${id}`);

    res.status(StatusCodes.OK).json({ message: 'User successfully verified' });
  },
);

export const resend_otp_controller = try_catch_handler(
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

    // generate otp here
    const otp = generate_otp();

    // store in redis using user id
    await redis_client.set(`user-${id}`, JSON.stringify({ otp }), {
      EX: 300,
    });

    // add job to send otp
    await mail_sender_queue.add(
      'send_otp_to_the user',
      { email: user.email, otp },
      retry_failed_job,
    );

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
    console.log(token);
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

    const logout_user = await prisma.user.findUnique({ where: { id } });

    if (!logout_user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Invalid user' });
    }
    console.log(token_expire_date);
    await redis_client.setEx(`blacklist_${token}`, token_expire_date, token);

    res.status(StatusCodes.OK).json({ message: 'Logout successfully' });
  },
);
