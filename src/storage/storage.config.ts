/**
 * Reads a required environment variable and fails fast when it is missing.
 *
 * @param name Name of the environment variable to read.
 * @returns The resolved environment variable value.
 */
function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Builds the custom storage endpoint used when a local GCS-compatible server is
 * configured through environment variables.
 *
 * @returns The emulator endpoint, or `undefined` when no custom host/port is
 * configured.
 */
function getStorageApiEndpoint(): string | undefined {
  const host = process.env.GCS_HOST;
  const port = process.env.GCS_PORT;

  return host && port ? `https://${host}:${port}` : undefined;
}

/**
 * Runtime storage configuration used to connect the application to either
 * fake-gcs-server locally or real Google Cloud Storage in production.
 */
export const storageConfig = {
  projectId: requireEnv('GCS_PROJECT_ID'),
  bucketName: requireEnv('GCS_BUCKET_NAME'),
  apiEndpoint: getStorageApiEndpoint(),
} as const;
