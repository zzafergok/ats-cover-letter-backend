import { Response } from 'express';

import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400
): void => {
  const response: ApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
};

export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): void => {
  sendError(res, message, 404);
};

export const sendServerError = (
  res: Response,
  message: string = 'Internal server error'
): void => {
  sendError(res, message, 500);
};

// Generic response creator for standalone usage
export const createResponse = <T = any>(
  success: boolean,
  message?: string,
  data?: T,
  errors?: any[]
): ApiResponse<T> => {
  if (success) {
    return {
      success: true,
      message,
      data,
    };
  } else {
    return {
      success: false,
      message,
      error: message,
      errors,
    };
  }
};
