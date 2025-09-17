import express from 'express';
import { centralized_error_handler } from './middlewares/centralized_error_handler';
import morgan from 'morgan';
import auth_route from './routes/auth_route';

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// morgan Middle ware to log request end point
app.use(morgan('dev'));

// auth router
app.use('/api/v1', auth_route);

// Error Handler Middleware
app.use(centralized_error_handler);

export default app;
