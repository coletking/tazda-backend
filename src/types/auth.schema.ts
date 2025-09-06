import { z } from 'zod';

export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface RegistrationData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
