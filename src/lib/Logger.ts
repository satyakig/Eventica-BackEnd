import bunyan from 'bunyan';
import { LoggingBunyan } from '@google-cloud/logging-bunyan';

function makeBunyanLogger() {
  const loggingBunyan = new LoggingBunyan();

  return bunyan.createLogger({
    name: (process.env.NAME as string) || 'app-engine',
    serializers: {
      req: require('bunyan-express-serializer'),
      res: bunyan.stdSerializers.res,
      err: bunyan.stdSerializers.err,
    },
    streams: [{ stream: process.stdout, level: 'debug' }, loggingBunyan.stream('debug')],
  });
}

const logger = process.env.NODE_ENV === 'production' ? makeBunyanLogger() : console;

export const LOGGER = logger;
