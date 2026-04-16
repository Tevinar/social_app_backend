import 'dotenv/config';
import postgres from 'postgres';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDatabaseUrl } from '../../src/database/database.config';

/**
 * Applies SQL migration files in filename order and records each successful
 * execution in `schema_migrations`.
 */
async function main() {
  // Open one shared client for the migration process.
  const sql = postgres(getDatabaseUrl());

  try {
    // Track applied migrations in the database so each file runs only once.
    await sql.unsafe(`
      create table if not exists schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    // Load previously applied migration names into a set for fast lookups.
    const applied = await sql<{ name: string }[]>`
      select name
      from schema_migrations
      order by name asc
    `;

    const appliedNames = new Set(applied.map((row) => row.name));

    // Treat the migrations directory as the source of truth for schema history.
    const migrationsDir = join(process.cwd(), 'database', 'migrations');

    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      // Prefix filenames like 001_, 002_, ... so lexical order is migration order.
      .sort();

    // Apply only the SQL files that have not been recorded yet.
    for (const file of files) {
      if (appliedNames.has(file)) {
        console.log(`skip ${file}`);
        continue;
      }

      const path = join(migrationsDir, file);
      const migrationSql = readFileSync(path, 'utf8');

      console.log(`apply ${file}`);

      await sql.begin(async (trx) => {
        // Run the migration SQL and mark it as applied atomically. If either
        // statement fails, the transaction rolls back and the file stays pending.
        await trx.unsafe(migrationSql);

        await trx`
          insert into schema_migrations (name)
          values (${file})
        `;
      });
    }
  } finally {
    // Always close the client so the script can exit cleanly.
    await sql.end();
  }
}

// Surface the error to the console and return a failing process exit code.
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
