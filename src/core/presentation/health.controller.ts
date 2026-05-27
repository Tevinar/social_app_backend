import { Controller, Get } from '@nestjs/common';

/**
 * Minimal health endpoint used by Kubernetes and the GKE load balancer.
 *
 * The route intentionally stays lightweight and dependency-free so it can
 * return a fast HTTP 200 response whenever the HTTP server is up.
 */
@Controller()
export class HealthController {
  /**
   * Reports that the process is serving HTTP requests.
   *
   * @returns Stable JSON payload suitable for readiness and load-balancer
   *          health checks.
   */
  @Get('health')
  getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
