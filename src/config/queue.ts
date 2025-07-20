// src/config/queue.ts
import Queue from 'bull';
import redisClient from './redis';
import logger from './logger';

export const emailQueue = new Queue('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

export const cvProcessingQueue = new Queue('cv-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

emailQueue.on('completed', (job) => {
  logger.info(`Email job ${job.id} tamamlandı`);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`Email job ${job.id} başarısız:`, err);
});

cvProcessingQueue.on('completed', (job) => {
  logger.info(`CV processing job ${job.id} tamamlandı`);
});

cvProcessingQueue.on('failed', (job, err) => {
  logger.error(`CV processing job ${job.id} başarısız:`, err);
});
