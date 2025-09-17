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
