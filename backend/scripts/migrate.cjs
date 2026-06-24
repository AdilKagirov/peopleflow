const { readFile, readdir } = require('node:fs/promises');
const path = require('node:path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const migrationsDir = path.resolve(__dirname, '../../database/migrations');
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  await pool.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  for (const file of files) {
    const applied = await pool.query(
      'select 1 from schema_migrations where name = $1',
      [file],
    );
    if (applied.rowCount) continue;

    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(await readFile(path.join(migrationsDir, file), 'utf8'));
      await client.query('insert into schema_migrations (name) values ($1)', [file]);
      await client.query('commit');
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

