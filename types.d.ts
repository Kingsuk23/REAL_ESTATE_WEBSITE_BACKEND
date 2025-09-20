declare namespace Express {
  export interface Request {
    user: {
      id: string;
      role: string;
    };
    rateLimit: { resetTime: number };
    token: string;
    token_expire_date: number;
  }
  export interface Response {
    user: {
      id: string;
      role: string;
    };
    token_expire_date: number;
    token: string;
  }
}
