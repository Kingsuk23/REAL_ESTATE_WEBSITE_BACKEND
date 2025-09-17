import { Router } from 'express';
import { user_input_validation } from '../middlewares/user_input_validation';
import { auth_resignation_schema } from '../utils/auth_validater';
import { registration_controller } from '../controllers/auth_controller';

const route = Router();

route.post(
  '/register',
  user_input_validation(auth_resignation_schema),
  registration_controller,
);

export default route;
