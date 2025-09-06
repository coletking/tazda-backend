import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { buildResponse } from '../utils/user.utils';


export class HealthController {
  static async check(): Promise<APIGatewayProxyResultV2> {
    return buildResponse(200, {
      success: true,
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      service: 'user-auth-service',
      version: '1.0.0',
      uptime: process.uptime()
    });
  }
}