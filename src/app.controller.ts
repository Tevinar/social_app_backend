import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Minimal root controller kept from the Nest starter.
 *
 * Exposes the default `GET /` endpoint and delegates its response to the
 * application service.
 */
@Controller()
export class AppController {
  /**
   * Receives the service that owns the root endpoint response.
   *
   * @param appService Service responsible for the value returned by `GET /`.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Returns the payload served by the default root route.
   *
   * @returns The response body produced for `GET /`.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
