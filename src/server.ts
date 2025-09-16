import 'dotenv/config';
import app from './app';
import env_configs from './configs/env_config';

const port = env_configs.PORT || 8080;

app.listen(port, () => {
  console.log(`Server start at http://localhost:${port}`);
});
