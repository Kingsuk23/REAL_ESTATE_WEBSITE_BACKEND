import { StatusCodes } from 'http-status-codes';
import { logger } from '../configs/winston_config';

// Base Error define Here
class base_error extends Error {
  public readonly name: string;
  public readonly http_status_code: StatusCodes;
  public readonly is_operational: boolean;

  constructor(
    name: string,
    http_status_code: StatusCodes,
    description: string,
    is_operational: boolean,
  ) {
    super(description);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.http_status_code = http_status_code;
    this.is_operational = is_operational;

    Error.captureStackTrace(this);
  }
}

// Api Error is Define Here
export class api_error extends base_error {
  constructor(
    name: string,
    http_status_code = StatusCodes.INTERNAL_SERVER_ERROR,
    description = 'internal server error',
    is_operational = true,
  ) {
    super(name, http_status_code, description, is_operational);
  }
}

// Centralized error handling class
class error_handler {
  public async handle_error(err: Error): Promise<void> {
    await logger.error(
      'Error message from the centralized error-handling component',
      err,
    );
  }
  public is_trusted_error(error: Error) {
    if (error instanceof base_error) {
      return error.is_operational;
    }
    return false;
  }
}

export const error_Handler = new error_handler();
