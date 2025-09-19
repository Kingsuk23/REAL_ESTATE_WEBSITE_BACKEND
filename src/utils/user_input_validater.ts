import z from 'zod';

export const auth_resignation_schema = z
  .object({
    name: z
      .string({ message: 'Please enter you name' })
      .min(3, { message: 'Your name at least have 3 characters' })
      .max(16, { message: 'You name should be below 16 characters' }),
    email: z
      .string({ message: 'Please enter your valid email' })
      .email({ message: 'This is not a valid email' }),
    password: z
      .string({ message: 'Please enter a strong password' })
      .min(8, { message: 'Your password must be 8 characters' }),
  })
  .superRefine(({ password }, check_pass_complexity) => {
    const contain_uppercase = (ch: string) => /[A-Z]/.test(ch);
    const contain_lowercase = (ch: string) => /[a-z]/.test(ch);
    const contain_spacial_char = (ch: string) =>
      /[`!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/.test(ch);

    let count_of_uppercase = 0,
      count_of_lowercase = 0,
      count_of_number = 0,
      count_of_spacial_char = 0;

    for (let ch of password) {
      if (!isNaN(+ch)) count_of_number++;
      else if (contain_uppercase(ch)) count_of_uppercase++;
      else if (contain_lowercase(ch)) count_of_lowercase++;
      else if (contain_spacial_char(ch)) count_of_spacial_char++;
    }
    if (count_of_uppercase < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one uppercase character',
      });
    }
    if (count_of_lowercase < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one lowercase character',
      });
    }
    if (count_of_spacial_char < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one spacial character',
      });
    }
    if (count_of_number < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one number',
      });
    }
  });

export const auth_login_schema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email({ message: 'Invalid email' }),
  password: z.string({ message: 'Password is required' }),
});

export const auth_email_update_schema = z.object({
  new_email: z
    .string({ message: 'Enter your new email' })
    .email({ message: 'Invalid email' }),
  otp: z.number({ message: 'Enter OTP Here' }),
});

export const auth_password_update_schema = z
  .object({
    old_pass: z.string({ message: 'Enter your old password' }),
    new_pass: z
      .string({ message: 'Please enter a strong password' })
      .min(8, { message: 'Your password must be 8 characters' }),
  })
  .superRefine(({ new_pass }, check_pass_complexity) => {
    const contain_uppercase = (ch: string) => /[A-Z]/.test(ch);
    const contain_lowercase = (ch: string) => /[a-z]/.test(ch);
    const contain_spacial_char = (ch: string) =>
      /[`!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/.test(ch);

    let count_of_uppercase = 0,
      count_of_lowercase = 0,
      count_of_number = 0,
      count_of_spacial_char = 0;

    for (let ch of new_pass) {
      if (!isNaN(+ch)) count_of_number++;
      else if (contain_uppercase(ch)) count_of_uppercase++;
      else if (contain_lowercase(ch)) count_of_lowercase++;
      else if (contain_spacial_char(ch)) count_of_spacial_char++;
    }
    if (count_of_uppercase < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one uppercase character',
      });
    }
    if (count_of_lowercase < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one lowercase character',
      });
    }
    if (count_of_spacial_char < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one spacial character',
      });
    }
    if (count_of_number < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one number',
      });
    }
  });

export const reset_password_request_schema = z.object({
  email: z
    .string({ message: 'Enter your email' })
    .email({ message: 'Invalid email' }),
});

export const auth_password_reset_schema = z
  .object({
    password: z
      .string({ message: 'Please enter a strong password' })
      .min(8, { message: 'Your password must be 8 characters' }),
  })
  .superRefine(({ password }, check_pass_complexity) => {
    const contain_uppercase = (ch: string) => /[A-Z]/.test(ch);
    const contain_lowercase = (ch: string) => /[a-z]/.test(ch);
    const contain_spacial_char = (ch: string) =>
      /[`!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/.test(ch);

    let count_of_uppercase = 0,
      count_of_lowercase = 0,
      count_of_number = 0,
      count_of_spacial_char = 0;

    for (let ch of password) {
      if (!isNaN(+ch)) count_of_number++;
      else if (contain_uppercase(ch)) count_of_uppercase++;
      else if (contain_lowercase(ch)) count_of_lowercase++;
      else if (contain_spacial_char(ch)) count_of_spacial_char++;
    }
    if (count_of_uppercase < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one uppercase character',
      });
    }
    if (count_of_lowercase < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one lowercase character',
      });
    }
    if (count_of_spacial_char < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one spacial character',
      });
    }
    if (count_of_number < 1) {
      check_pass_complexity.addIssue({
        code: 'custom',
        message: 'password must be contain one number',
      });
    }
  });
