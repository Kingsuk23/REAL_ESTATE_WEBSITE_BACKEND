import express from 'express';
import {
  centralized_error_handler,
  try_catch_handler,
} from './middlewares/centralized_error_handler';
import morgan from 'morgan';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// morgan Middle ware to log request end point
app.use(morgan('dev'));

app.get(
  '/get',
  try_catch_handler((req, res) => {
    res.status(StatusCodes.OK).send(getReasonPhrase(StatusCodes.OK));
  }),
);

// Error Handler Middleware
app.use(centralized_error_handler);

export default app;
