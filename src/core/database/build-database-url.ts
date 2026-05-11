/**
 * Input required to assemble a PostgreSQL connection string.
 */
export type BuildDatabaseUrlParams = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

/**
 * Builds the PostgreSQL connection string consumed by Postgres.js.
 *
 * @param params Normalized database connection settings.
 * @returns A PostgreSQL connection string ready to be passed to Postgres.js.
 */
export function buildDatabaseUrl(params: BuildDatabaseUrlParams): string {
  return `postgresql://${params.username}:${encodeURIComponent(params.password)}@${params.host}:${params.port}/${params.database}`;
}
