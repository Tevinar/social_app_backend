export enum EnvVariable {
  NodeEnv = 'NODE_ENV',
  LogLevel = 'LOG_LEVEL',

  port = 'PORT',
  ApiBaseUrl = 'API_BASE_URL',

  PostgresHost = 'POSTGRES_HOST',
  PostgresPort = 'POSTGRES_PORT',
  PostgresDb = 'POSTGRES_DB',
  PostgresUser = 'POSTGRES_USER',

  GoogleCloudProjectId = 'GOOGLE_CLOUD_PROJECT_ID',
  GcsBucketName = 'GCS_BUCKET_NAME',
  FakeGcsHost = 'FAKE_GCS_HOST',
  FakeGcsPort = 'FAKE_GCS_PORT',

  AuthAccessTtlMinutes = 'AUTH_ACCESS_TTL_MINUTES',
  AuthRefreshTtlDays = 'AUTH_REFRESH_TTL_DAYS',
}
