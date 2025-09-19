import { Router } from 'express';
import { user_input_validation } from '../middlewares/user_input_validation';
import {
  auth_email_update_schema,
  auth_login_schema,
  auth_password_reset_schema,
  auth_password_update_schema,
  auth_resignation_schema,
  reset_password_request_schema,
} from '../utils/user_input_validater';
import {
  registration_controller,
  login_user_controller,
  logout_user_controller,
  email_verification_controller,
  send_otp_controller,
  reset_password,
  reset_password_request,
  update_auth_email,
  update_auth_password,
} from '../controllers/auth_controller';
import { validate_user_auth } from '../middlewares/validate_user_auth';

const route = Router();

route
  .post(
    '/register',
    user_input_validation(auth_resignation_schema),
    registration_controller,
  )
  .post('/verify', validate_user_auth, email_verification_controller)
  .get('/resend_otp', validate_user_auth, send_otp_controller)
  .post(
    '/login',
    user_input_validation(auth_login_schema),
    login_user_controller,
  )
  .get('/logout', validate_user_auth, logout_user_controller)
  .put(
    '/email_update',
    validate_user_auth,
    user_input_validation(auth_email_update_schema),
    update_auth_email,
  )
  .put(
    '/password_update',
    validate_user_auth,
    user_input_validation(auth_password_update_schema),
    update_auth_password,
  )
  .post(
    '/reset_password_request',
    user_input_validation(reset_password_request_schema),
    reset_password_request,
  )
  .put(
    '/reset_password',
    user_input_validation(auth_password_reset_schema),
    reset_password,
  );

export default route;
