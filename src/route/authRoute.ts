// routes/auth.routes.ts
import { AuthController } from '../controllers/auth.controller';
import { HealthController } from '../controllers/healthcheck.controller';
import { UserController } from '../controllers/user.controller';
import { Route } from '../types/route';

export const authRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/register',
    handler: AuthController.register,
    requiresAuth: false,
    rateLimitConfig: {
      windowMs: 300000, // 5 minutes
      maxRequests: 5    // 5 registration attempts per 5 minutes
    }
  },
  {
    method: 'POST',
    path: '/api/login',
    handler: AuthController.login,
    requiresAuth: false,
    rateLimitConfig: {
      windowMs: 300000, // 5 minutes
      maxRequests: 10   // 10 login attempts per 5 minutes
    }
  },
   {
      method: 'GET',
      path: '/api/health',
      handler: HealthController.check,
      requiresAuth: false,
      rateLimitConfig: {
        windowMs: 60000,  // 1 minute
        maxRequests: 100  // 100 health checks per minute
      }
    },

      {
        method: 'GET',
        path: '/api/user/{id}',
        handler: UserController.getProfile,
        requiresAuth: true,
        rateLimitConfig: {
          windowMs: 60000,  // 1 minute
          maxRequests: 30   // 30 requests per minute
        }
      },

    
];