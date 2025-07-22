import cors = require('cors');
import { SERVICE_MESSAGES, formatMessage } from '../constants/messages';

const allowedOrigins = [
  'https://www.starkon-kanban.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
];

const corsOptions: cors.CorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `${formatMessage(SERVICE_MESSAGES.CORS.ORIGIN_NOT_ALLOWED)}: ${origin}`
        )
      );
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

export const corsMiddleware = cors(corsOptions);
