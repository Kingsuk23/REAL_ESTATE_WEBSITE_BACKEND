import { Router } from 'express';
import { user_input_validation } from '../middlewares/user_input_validation';
import {
  auth_login_schema,
  auth_resignation_schema,
} from '../utils/auth_validater';
import {
  registration_controller,
  otp_validation_controller,
  resend_otp_controller,
  login_user_controller,
  logout_user_controller,
} from '../controllers/auth_controller';
import { validate_user_auth } from '../middlewares/validate_user_auth';

const route = Router();

route
  .post(
    '/register',
    user_input_validation(auth_resignation_schema),
    registration_controller,
  )
  .post('/verify', validate_user_auth, otp_validation_controller)
  .post('/resend_otp', validate_user_auth, resend_otp_controller)
  .post(
    '/login',
    user_input_validation(auth_login_schema),
    login_user_controller,
  )
  .get('/logout', validate_user_auth, logout_user_controller);

export default route;
