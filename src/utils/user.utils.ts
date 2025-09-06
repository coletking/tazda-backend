import { APIGatewayProxyResultV2 } from 'aws-lambda';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { RegistrationData, LoginData, JWTPayload } from '../types/user.type';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Validation schemas
const registrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(1, 'Name is required').optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Logger utility
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message: string, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// JWT utilities
export const generateToken = (userId: string, email: string, name?: string, role?: string): string => {
  const payload: JWTPayload = {
    userId,
    email,
    name,
    role: role || 'user'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'user-auth-service',
    audience: 'user-auth-clients'
  });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'user-auth-service',
      audience: 'user-auth-clients'
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Validation utilities
export const validateRegistrationData = (data: unknown): RegistrationData => {
  try {
    return registrationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => err.message).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw new Error('Invalid registration data format');
  }
};

export const validateLoginData = (data: unknown): LoginData => {
  try {
    return loginSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => err.message).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw new Error('Invalid login data format');
  }
};

// Response builder utility
export const buildResponse = (
  statusCode: number,
  body: any,
  headers?: Record<string, string>
): APIGatewayProxyResultV2 => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };

  return {
    statusCode,
    headers: { ...defaultHeaders, ...headers },
    body: JSON.stringify(body)
  };
};