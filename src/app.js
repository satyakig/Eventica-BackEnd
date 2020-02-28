import express from 'express';
import bodyParser from 'body-parser';
import httpErrors from 'http-errors';
import cors from 'cors';
import morgan from 'morgan';
import { initializeApp } from './lib/Firebase';
import { isBodyInvalid } from './lib/DataValidator';
import { checkIfAuthorized } from './lib/AuthHelper';
import { eventRoutes } from './routes/event';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('short'));
app.use(isBodyInvalid);
app.use(checkIfAuthorized);

initializeApp();

app.use('/event', eventRoutes);

app.use('/', (req, res, next) => {
  return next(httpErrors(404, `The request '${req.method} ${req.path}' cannot be resolved.`));
});

app.use((error, req, res, next) => {
  return res.status(error.status).send(error.message);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.debug(`Server started at http://localhost:${PORT}`);
});

export default app;
