import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

interface ErrorResponse {
  success: boolean;
  message: string;
  stack?: string;
  errors?: any;
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    const message = messages.join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please login again.';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please login again.';
    error = { message, statusCode: 401 };
  }

  const response: ErrorResponse = {
    success: false,
    message: error.message || 'Server Error',
  };

  // Add stack trace in development mode
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Add validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(error.statusCode || 500).json(response);
};

export default errorHandler;
