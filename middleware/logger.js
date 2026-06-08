import pino from 'pino';
import pinoHttp from 'pino-http';
import { createHash } from 'crypto';

const isProd = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isProd ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

const hashIp = (ip) => {
  if (!ip) return 'unknown';
  return createHash('sha256').update(ip).digest('hex');
};

export const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/api/health'
  },
  customProps: (req, res) => ({
    ipHash: hashIp(req.ip || req.connection?.remoteAddress),
  }),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      // exclude Authorization header and body
      headers: {
        ...req.headers,
        authorization: undefined,
      }
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    })
  }
});
