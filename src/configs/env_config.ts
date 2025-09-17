const env_configs = {
  PORT: process.env.PORT as string,
  NODE_ENVIRONMENT: process.env.NODE_ENVIRONMENT as string,
  ARCJET_KEY: process.env.ARCJET_KEY as string,
  REDIS_USERNAME: process.env.REDIS_USERNAME as string,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
  REDIS_HOST: process.env.REDIS_HOST as string,
  REDIS_PORT: process.env.REDIS_PORT as string,
  NODEMAILER_HOST: process.env.NODEMAILER_HOST as string,
  NODEMAILER_PORT: process.env.NODEMAILER_PORT as string,
  NODEMAILER_USER: process.env.NODEMAILER_USER as string,
  NODEMAILER_PASS: process.env.NODEMAILER_PASS as string,
};

export default env_configs;
