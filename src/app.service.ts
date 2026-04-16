import { Injectable } from '@nestjs/common';

/**
 * Minimal application service kept from the Nest starter template.
 *
 * Owns the value returned by the default root endpoint.
 */
@Injectable()
export class AppService {
  /**
   * Returns the static payload served by `GET /`.
   *
   * @returns The default root response body.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
