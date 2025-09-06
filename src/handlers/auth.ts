// handlers/auth.handler.ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { 
  applyMiddleware, 
  handleCORS, 
  bodySizeLimiter, 
  bodyParser, 
  rateLimiter,
  authenticate,
  AuthenticatedRequest 
} from "../middleware";
import { buildResponse, logger } from "../utils/user.utils";
import { Router } from "../route";

const router = new Router();

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  context.callbackWaitsForEmptyEventLoop = false;

  const requestId = context.awsRequestId;
  const startTime = Date.now();

  logger.info("Auth handler invocation started", {
    requestId,
    method: event.requestContext.http.method,
    path: event.requestContext.http.path,
    sourceIp: event.requestContext.http.sourceIp,
    userAgent: event.headers["user-agent"],
  });

  try {

    const corsResult = handleCORS(event);
    if (corsResult) return corsResult;

   
    const method = event.requestContext.http.method;
    const path = event.rawPath || event.requestContext.http.path;
    const routeConfig = router.getRouteConfig(method, path);


    const middlewareResult = applyMiddleware(event, [
      bodySizeLimiter,
      routeConfig?.rateLimitConfig
        ? (e) =>
            rateLimiter(
              e,
              routeConfig.rateLimitConfig!.windowMs,
              routeConfig.rateLimitConfig!.maxRequests
            )
        : (e) => rateLimiter(e, 60000, 50), // default: 50 req/min
    ]);
    if (middlewareResult) return middlewareResult;


    const { parsedBody, error: parseError } = bodyParser(event);
    if (parseError) return parseError;

    let user = null;
    if (routeConfig?.requiresAuth) {
      const { user: authenticatedUser, error: authError } = authenticate(event);
      if (authError) return authError;
      user = authenticatedUser;
    }

    const authenticatedEvent: AuthenticatedRequest = {
      ...event,
      parsedBody,
      user: user || undefined,
    };


    const result = await router.handleRequest(authenticatedEvent, requestId, startTime);
    return result;
  } catch (error: any) {
    logger.error("Unhandled error in auth handler", {
      requestId,
      error: error.message,
      stack: error.stack,
    });

    return buildResponse(500, {
      success: false,
      message: "Internal server error",
      requestId,
    });
  } finally {
    logger.info("Auth handler invocation completed", {
      requestId,
      duration: Date.now() - startTime,
    });
  }
};
