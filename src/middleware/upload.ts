import fs from 'fs';
import path from 'path';
import multer from 'multer';

import logger from '../config/logger';
import { SERVICE_MESSAGES, formatMessage, createErrorMessage } from '../constants/messages';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  logger.info('File filter check', {
    name: file.originalname,
    mime: file.mimetype,
    size: file.size
  });

  const allowedExtensions = /\.(pdf|doc|docx)$/i;
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const hasValidExtension = allowedExtensions.test(file.originalname);
  const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);

  if (hasValidExtension && hasValidMimeType) {
    cb(null, true);
  } else {
    const error = new Error(
      `${formatMessage(SERVICE_MESSAGES.FILE.UNSUPPORTED_FORMAT)}. Dosya: ${file.originalname}, MIME: ${file.mimetype}`
    );
    logger.error(createErrorMessage(SERVICE_MESSAGES.FILE.UNSUPPORTED_FORMAT, error));
    cb(error);
  }
};

export const cvUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter,
});