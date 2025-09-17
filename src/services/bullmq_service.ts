import { Job, Queue, Worker } from 'bullmq';
import { redis_config } from '../configs/db_config';
import { transporter } from '../configs/nodemailer_config';
import { auth_otp_template } from '../utils/email_template';
import nodemailer from 'nodemailer';

export const retry_failed_job = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 3000,
    jitter: 0.5,
  },
};

export const mail_sender_queue = new Queue('auth_mail_sender', {
  connection: redis_config,
});

const mail_sender_worker = new Worker(
  'auth_mail_sender',
  async (job: Job<{ email: string; otp: number }>) => {
    try {
      const { email, otp } = job.data;

      if (!email || !otp) {
        throw new Error('require fields are missing');
      }

      const is_verify = await transporter.verify();

      if (!is_verify) {
        throw new Error('Email server failed to start');
      }

      const mail_info = await transporter.sendMail({
        from: `"RealHut Team" <carolina.howe43@ethereal.email>`,
        to: email,
        html: auth_otp_template(otp),
      });
      const get_mail = nodemailer.getTestMessageUrl(mail_info);
      console.log(get_mail);
      return mail_info.messageId;
    } catch (err) {
      console.error('Error while sending mail', err);
      throw err;
    }
  },
  {
    connection: redis_config,
    concurrency: 5,
    removeOnComplete: {
      age: 3600,
      count: 100,
    },
    removeOnFail: {
      age: 24 * 3600,
    },
  },
);

mail_sender_worker.on('failed', (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error ${err.message}`);
  } else {
    console.error(`Job is undefined. Error: ${err.message}`);
  }
});
