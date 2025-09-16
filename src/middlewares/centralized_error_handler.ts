import { NextFunction, Request, Response } from 'express';
import { api_error, error_Handler } from '../utils/error_handler';

export const centralized_error_handler = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!error_Handler.is_trusted_error(err)) {
    next(err);
  }

  await error_Handler.handle_error(err);

  res.status((err as api_error).http_status_code).json({
    status: (err as api_error).name,
    message: (err as api_error).message,
  });
};

export const try_catch_handler =
  (func: (req: Request, res: Response, next: NextFunction) => any) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      Promise.resolve(func(req, res, next)).catch(next);
    } catch (error) {
      next(error);
    }
  };
