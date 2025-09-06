export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  name?: string;
  role?: string;
  lastLogin?: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  userId?: string;
  data?: any;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  role?: string;
  iat?: number;
  exp?: number;
}