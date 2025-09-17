import nodemailer from 'nodemailer';
import env_configs from './env_config';

export const transporter = nodemailer.createTransport({
  host: env_configs.NODEMAILER_HOST,
  port: Number(env_configs.NODEMAILER_PORT),
  secure: false,
  auth: {
    user: env_configs.NODEMAILER_USER,
    pass: env_configs.NODEMAILER_PASS,
  },
});
