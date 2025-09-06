
import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedRequest } from '../middleware';

export interface Route {
  method: string;
  path: string;
  handler: (event: AuthenticatedRequest, requestId: string, startTime: number) => Promise<APIGatewayProxyResultV2>;
  requiresAuth: boolean;
  rateLimitConfig?: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface RouteConfig {
  windowMs: number;
  maxRequests: number;
}