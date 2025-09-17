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
      },
      select: {
        id: true,
      },
    });

    // generate otp here
    const otp = generate_otp();

    // store in redis using user id
    await redis_client.set(`user-${new_user.id}`, JSON.stringify({ otp }), {
      EX: 300,
      NX: true,
    });

    await mail_sender_queue.add(
      'send_otp_to_the user',
      { email, otp },
      retry_failed_job,
    );

    res.status(StatusCodes.CREATED).json({
      message: 'User created successfully',
      data: { id: new_user.id },
    });
  },
);
