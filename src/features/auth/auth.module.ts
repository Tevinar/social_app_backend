import { Module } from '@nestjs/common';

/**
 * Authentication feature module.
 *
 * Owns the application's authentication and identity entry points. This module
 * is responsible for composing auth-specific controllers, application services,
 * guards, and infrastructure adapters as the feature grows.
 *
 * Other feature modules should depend only on the auth-facing services exported
 * here, not on auth internals.
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class AuthModule {}
