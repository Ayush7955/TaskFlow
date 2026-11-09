const pino = require('pino');

let loggerInstance;

const getLogger = () => {
  if (loggerInstance) return loggerInstance;

  const nodeEnv = process.env.NODE_ENV || 'development';

  loggerInstance = pino({
    level: nodeEnv === 'production' ? 'info' : 'debug',
    redact: {
      paths: [
        'req.headers.authorization',
        '*.password',
        '*.password_hash',
        '*.token',
        '*.token_hash',
        'req.headers.cookie',
      ],
      censor: '[REDACTED]',
    },
    ...(nodeEnv !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),
  });

  return loggerInstance;
};

module.exports = getLogger();

