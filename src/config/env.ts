import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CORS_ORIGIN: string;
  MAX_FILE_SIZE: number;
}

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const env: EnvConfig = {
  PORT: parseInt(getEnvVariable('PORT', '5000'), 10),
  NODE_ENV: getEnvVariable('NODE_ENV', 'development'),
  MONGODB_URI: getEnvVariable('MONGODB_URI'),
  JWT_SECRET: getEnvVariable('JWT_SECRET'),
  JWT_EXPIRE: getEnvVariable('JWT_EXPIRE', '24h'),
  CLOUDINARY_CLOUD_NAME: getEnvVariable('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: getEnvVariable('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: getEnvVariable('CLOUDINARY_API_SECRET'),
  CORS_ORIGIN: getEnvVariable('CORS_ORIGIN', 'http://localhost:3000'),
  MAX_FILE_SIZE: parseInt(getEnvVariable('MAX_FILE_SIZE', '5242880'), 10),
};

export default env;
