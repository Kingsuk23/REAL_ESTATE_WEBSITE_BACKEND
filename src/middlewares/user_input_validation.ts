import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z, ZodError } from 'zod';

export const user_input_validation = (schema: z.ZodObject<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: any) => ({
          message: `${issue.message}`,
        }));
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: 'Invalid data', details: errorMessages });
      } else {
        next(error);
      }
    }
  };
};
