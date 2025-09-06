import { Route } from "../types/route";
import { authRoutes } from "./authRoute";

export const allRoutes: Route[] = [
  ...authRoutes,
];



export class Router {
  private routes: Route[];

  constructor() {
    this.routes = allRoutes;
  }

  getRouteConfig(method: string, path: string): Route | undefined {
    return this.routes.find(
      (route) =>
        route.method.toUpperCase() === method.toUpperCase() &&
        this.matchPath(route.path, path)
    );
  }

  async handleRequest(
    event: any,
    requestId: string,
    startTime: number
  ) {
    const method = event.requestContext.http.method;
    const path = event.rawPath || event.requestContext.http.path;

    const route = this.getRouteConfig(method, path);
    if (!route) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "Route not found",
          requestId,
        }),
      };
    }

    return route.handler(event, requestId, startTime);
  }

  private matchPath(routePath: string, requestPath: string): boolean {
    // Simple path matcher (supports static paths + {id})
    const routeSegments = routePath.split("/");
    const reqSegments = requestPath.split("/");

    if (routeSegments.length !== reqSegments.length) return false;

    return routeSegments.every((seg, i) => {
      if (seg.startsWith("{") && seg.endsWith("}")) return true; // path param
      return seg === reqSegments[i];
    });
  }
}
