import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { try_catch_handler } from './centralized_error_handler';
import { redis_client } from '../configs/db_config';
import env_configs from '../configs/env_config';

declare module 'jsonwebtoken' {
  export interface UserIDJwtPayload extends jwt.JwtPayload {
    user: { id: string; role: string };
  }
}

export const validate_user_auth = try_catch_handler(
  async (req: Request, res: Response, next: NextFunction) => {
    // collect token from header
    const auth_token = req.header('Authorization')?.replace('Bearer ', '');

    console.log(auth_token);
    // validate token exist or not
    if (!auth_token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Unable to authorize' });
    }

    // check token already in block list or not
    const token = await redis_client.get(`blacklist_${auth_token}`);

    if (token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Token expire' });
    }

    console.log(token);
    // verify if it's correct or false
    const verify = <jwt.UserIDJwtPayload>(
      jwt.verify(auth_token, env_configs.JWT_SECRET)
    );

    if (!verify) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'user token is invalid' });
    }

    req.user = verify.user;
    req.token = auth_token;
    req.token_expire_date = verify.exp as number;
    next();
  },
);
