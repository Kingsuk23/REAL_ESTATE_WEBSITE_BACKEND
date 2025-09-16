import 'dotenv/config';
import { error_Handler } from './utils/error_handler';

process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
  throw reason;
});

process.on('uncaughtException', (error: Error) => {
  error_Handler.handle_error(error);
  if (!error_Handler.is_trusted_error(error)) {
    process.exit(1);
  }
});

import app from './app';
import env_configs from './configs/env_config';

const port = env_configs.PORT;

app.listen(port, () => {
  console.log(`Server start at http://localhost:${port}`);
});
