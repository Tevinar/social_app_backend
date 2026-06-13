import { config as loadEnv } from 'dotenv';
import * as Sentry from '@sentry/nestjs';
import { EnvVariable } from '../../../core/config/env-variable';
import { Environment } from '../../../core/config/environment';

// This module is imported before the Nest bootstrap so Sentry is initialized
// as early as possible, including for startup failures that happen before the
// app and its DI-managed logger are fully available.

// This DSN is intentionally configured as a code constant for this app because
// the Sentry project is expected to stay stable across environments.
const SENTRY_DSN =
  'https://6333800f05404896c1a2ce807f53b244@o4511479941627904.ingest.de.sentry.io/4511479975247952';

loadEnv({ path: '.env' });

if (process.env[EnvVariable.AppEnv] !== Environment.Local) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env[EnvVariable.AppEnv] ?? Environment.Local,
    release: process.env[EnvVariable.SentryRelease],
    tracesSampleRate: readTracesSampleRate(),
  });
}

/**
 * Reads the Sentry trace sample rate from the environment in a safe way.
 *
 * Sentry expects a numeric sampling ratio between `0` and `1`. This helper
 * validates the configured value and falls back to `0` when the variable is
 * missing or malformed so application startup never fails because of tracing
 * configuration.
 *
 * @returns A valid Sentry trace sample rate between `0` and `1`.
 */
function readTracesSampleRate(): number {
  const rawValue = process.env[EnvVariable.SentryTracesSampleRate];

  if (rawValue === undefined) {
    return 0;
  }

  const parsedValue = Number(rawValue);

  if (Number.isFinite(parsedValue) && parsedValue >= 0 && parsedValue <= 1) {
    return parsedValue;
  }

  return 0;
}
