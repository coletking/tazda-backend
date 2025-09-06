import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { registerUser, loginUser } from '../services/auth.service';
import { buildResponse, logger } from '../utils/user.utils';
import { AuthenticatedRequest } from '../middleware';

export class UserController {
  static async getProfile(
    event: AuthenticatedRequest,
    requestId: string
  ): Promise<APIGatewayProxyResultV2> {
    try {
      if (!event.user) {
        return buildResponse(401, {
          success: false,
          message: 'Authentication required'
        });
      }

      const pathParameters = event.pathParameters || {};
      const requestedUserId = pathParameters.id;

      // Users can only access their own profile
      if (requestedUserId && requestedUserId !== event.user.userId) {
        logger.warn('Unauthorized profile access attempt', {
          requestId,
          requestedUserId,
          actualUserId: event.user.userId
        });
        return buildResponse(403, {
          success: false,
          message: 'Access denied. You can only access your own profile.'
        });
      }

      // Return user profile (excluding sensitive information)
      const userProfile = {
        userId: event.user.userId,
        email: event.user.email,
        name: event.user.name,
        role: event.user.role,
        lastLogin: new Date().toISOString()
      };

      logger.info('User profile retrieved', {
        requestId,
        userId: event.user.userId
      });

      return buildResponse(200, {
        success: true,
        message: 'User profile retrieved successfully',
        data: userProfile
      });

    } catch (error: any) {
      logger.error('Get profile error', { requestId, error: error.message });
      return buildResponse(500, {
        success: false,
        message: 'Failed to retrieve user profile'
      });
    }
  }

  static async updateProfile(
    event: AuthenticatedRequest,
    requestId: string
  ): Promise<APIGatewayProxyResultV2> {
    try {
      if (!event.user) {
        return buildResponse(401, {
          success: false,
          message: 'Authentication required'
        });
      }

      // Implementation for profile updates
      // This would integrate with your auth service
      
      return buildResponse(200, {
        success: true,
        message: 'Profile update feature coming soon'
      });

    } catch (error: any) {
      logger.error('Update profile error', { requestId, error: error.message });
      return buildResponse(500, {
        success: false,
        message: 'Failed to update user profile'
      });
    }
  }
}