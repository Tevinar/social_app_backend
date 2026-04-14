import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'prisma/config';

// Keep the database password in one place only: Docker and Prisma both read it
// from the local secret file instead of duplicating it in .env.
const password = readFileSync(
  join(process.cwd(), '.secrets/postgres_password.txt'),
  'utf8',
).trim();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: `postgresql://social_app_user:${encodeURIComponent(password)}@localhost:5432/social_app?schema=public`,
  },
});
