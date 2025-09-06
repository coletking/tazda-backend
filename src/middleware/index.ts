
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { buildResponse, logger, verifyToken } from '../utils/user.utils';
import { JWTPayload } from '../types/user.type';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface AuthenticatedRequest extends APIGatewayProxyEventV2 {
  user?: JWTPayload;
  parsedBody?: any;
}

const MAX_BODY_SIZE = 524288000;

export const bodySizeLimiter = (
  event: APIGatewayProxyEventV2
): APIGatewayProxyResultV2 | null => {
  if (event.body) {
    const bodySize = Buffer.byteLength(event.body, 'utf8');
    if (bodySize > MAX_BODY_SIZE) {
      logger.warn('Request body too large', {
        size: bodySize,
        maxSize: MAX_BODY_SIZE,
        sourceIp: event.requestContext.http.sourceIp
      });
      return buildResponse(413, {
        success: false,
        message: 'Request body too large. Maximum size is 500MB.'
      });
    }
  }
  return null;
};

export const bodyParser = (
  event: APIGatewayProxyEventV2
): { parsedBody: any; error: APIGatewayProxyResultV2 | null } => {
  let parsedBody = {};
  
  if (event.body) {
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      logger.error('Invalid JSON in request body', {
        error: parseError,
        sourceIp: event.requestContext.http.sourceIp
      });
      return {
        parsedBody: {},
        error: buildResponse(400, {
          success: false,
          message: 'Invalid JSON format in request body'
        })
      };
    }
  }
  
  return { parsedBody, error: null };
};

export const rateLimiter = (
  event: APIGatewayProxyEventV2,
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 100
): APIGatewayProxyResultV2 | null => {
  const clientId = event.requestContext.http.sourceIp;
  const now = Date.now();
  const windowStart = now - windowMs;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < windowStart) {
      rateLimitStore.delete(key);
    }
  }
  
  const entry = rateLimitStore.get(clientId);
  
  if (!entry) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + windowMs
    });
    return null;
  }
  
  if (entry.resetTime < now) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
    return null;
  }
  
  if (entry.count >= maxRequests) {
    logger.warn('Rate limit exceeded', {
      clientId,
      count: entry.count,
      maxRequests
    });
    return buildResponse(429, {
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    });
  }
  
  entry.count++;
  return null;
};

export const authenticate = (
  event: APIGatewayProxyEventV2
): { user: JWTPayload | null; error: APIGatewayProxyResultV2 | null } => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: buildResponse(401, {
        success: false,
        message: 'Authorization token required'
      })
    };
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decodedToken = verifyToken(token);
    return { user: decodedToken, error: null };
  } catch (error) {
    logger.warn('Token verification failed', {
      error: (error as Error).message,
      sourceIp: event.requestContext.http.sourceIp
    });
    return {
      user: null,
      error: buildResponse(401, {
        success: false,
        message: 'Invalid or expired token'
      })
    };
  }
};


export const handleCORS = (
  event: APIGatewayProxyEventV2
): APIGatewayProxyResultV2 | null => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return buildResponse(200, { message: 'OK' });
  }
  return null;
};


export const applyMiddleware = (
  event: APIGatewayProxyEventV2,
  middlewares: Array<(event: APIGatewayProxyEventV2) => APIGatewayProxyResultV2 | null>
): APIGatewayProxyResultV2 | null => {
  for (const middleware of middlewares) {
    const result = middleware(event);
    if (result) return result;
  }
  return null;
};