import { Router } from 'express';
import { validate_user_auth } from '../middlewares/validate_user_auth';
import {
  get_user_info,
  user_info_update,
  user_delete,
} from '../controllers/user_info_controller';
import { api_rate_limiter } from '../utils/utils';

const route = Router();

route
  .get('/user_info', api_rate_limiter, validate_user_auth, get_user_info)
  .put(
    '/user_info_update',
    api_rate_limiter,
    validate_user_auth,
    user_info_update,
  )
  .delete('/user_delete', api_rate_limiter, validate_user_auth, user_delete);

export default route;
