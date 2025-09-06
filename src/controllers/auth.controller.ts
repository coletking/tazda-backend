import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { registerUser, loginUser } from '../services/auth.service';
import { buildResponse, logger } from '../utils/user.utils';
import { AuthenticatedRequest } from '../middleware';

export class AuthController {
  static async register(
    event: AuthenticatedRequest,
    requestId: string,
    startTime: number
  ): Promise<APIGatewayProxyResultV2> {
    try {
      const registrationResult = await registerUser(event.parsedBody);
      
      logger.info('Registration successful', { 
        requestId, 
        userId: registrationResult.userId,
        duration: Date.now() - startTime 
      });

      return buildResponse(201, {
        success: true,
        message: registrationResult.message,
        data: {
          userId: registrationResult.userId
        }
      });

    } catch (error: any) {
      logger.error('Registration failed', { requestId, error: error.message });

      if (error.message.includes('Validation failed')) {
        return buildResponse(400, {
          success: false,
          message: 'Validation error',
          details: error.message
        });
      } else if (error.message.includes('already exists')) {
        return buildResponse(409, {
          success: false,
          message: error.message
        });
      } else {
        return buildResponse(500, {
          success: false,
          message: 'Registration failed. Please try again.'
        });
      }
    }
  }

  static async login(
    event: AuthenticatedRequest,
    requestId: string,
    startTime: number
  ): Promise<APIGatewayProxyResultV2> {
    try {
      const loginResult = await loginUser(event.parsedBody);
      
      logger.info('Login successful', { 
        requestId,
        duration: Date.now() - startTime 
      });

      return buildResponse(200, {
        success: true,
        message: loginResult.message,
        data: {
          token: loginResult.token,
          expiresIn: '24h'
        }
      });

    } catch (error: any) {
      logger.error('Login failed', { requestId, error: error.message });

      if (error.message.includes('Validation failed')) {
        return buildResponse(400, {
          success: false,
          message: 'Validation error',
          details: error.message
        });
      } else if (error.message.includes('Invalid email') || 
                 error.message.includes('inactive')) {
        return buildResponse(401, {
          success: false,
          message: error.message
        });
      } else {
        return buildResponse(500, {
          success: false,
          message: 'Login failed. Please try again.'
        });
      }
    }
  }

  
}