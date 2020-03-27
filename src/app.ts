import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import httpErrors, { HttpError } from 'http-errors';
import cors from 'cors';
import morgan from 'morgan';
import { initializeApp } from './lib/Firebase';
import { isBodyInvalid } from './lib/DataValidator';
import { checkIfAuthorized } from './lib/AuthHelper';
import { eventRoutes } from './routes/event';
import { commentRoutes } from './routes/comment';
import { userEventRoutes } from './routes/user-event';
import { userRoutes } from './routes/user';
import { addUserRoutes } from './routes/add-user';
import { useTicketRoutes } from './routes/use-ticket';
import { LOGGER } from './lib/Logger';

const app = express();

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  app.use(morgan('short'));
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(checkIfAuthorized);
app.use(isBodyInvalid);

initializeApp();

app.use('/event', eventRoutes);
app.use('/comment', commentRoutes);
app.use('/user-event', userEventRoutes);
app.use('/user', userRoutes);
app.use('/add-user', addUserRoutes);
app.use('/use-ticket', useTicketRoutes);

app.use('/', (req, res, next) => {
  return next(
    httpErrors(404, `The ${req.method} request at '${req.path}' path cannot be resolved.`),
  );
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
  if (isProd) {
    LOGGER.error({
      method: req.method,
      url: req.path,
      auth: req.headers['authorization'],
      body: req.body,
      error: error.message,
    });
  }

  if (
    error.status !== 404 &&
    error.status !== 400 &&
    error.status !== 401 &&
    error.status !== 500
  ) {
    return res.status(500).send('Internal server error');
  }

  return res.status(error.status).send(error.message);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  LOGGER.debug(`Server started at http://localhost:${PORT}`);
});

export default app;
