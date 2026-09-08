const path = require('path');
const fs = require('fs');
const net = require('net');
const { Client } = require('pg');

async function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function ensureUtf8Database(port = 54329) {
  const client = new Client({
    connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`,
  });

  try {
    await client.connect();
    const res = await client.query(
      `SELECT datname, pg_encoding_to_char(encoding) as enc FROM pg_database WHERE datname = 'shakil_global_recruitment'`
    );

    if (res.rows.length === 0 || res.rows[0].enc !== 'UTF8') {
      if (res.rows.length > 0) {
        console.log(`Recreating database "shakil_global_recruitment" with UTF8 encoding...`);
        // Terminate any active connections to drop safely
        await client.query(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = 'shakil_global_recruitment'
            AND pid <> pg_backend_pid();
        `);
        await client.query(`DROP DATABASE IF EXISTS shakil_global_recruitment`);
      }
      await client.query(
        `CREATE DATABASE shakil_global_recruitment WITH ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' template=template0`
      );
      console.log(`✅ Database "shakil_global_recruitment" ready with UTF8 encoding.`);
    } else {
      console.log(`✅ Database "shakil_global_recruitment" verified with UTF8 encoding.`);
    }
  } catch (err) {
    console.error('Error ensuring UTF8 database:', err.message);
  } finally {
    await client.end();
  }
}

async function startEmbeddedPostgres(port = 54329) {
  const dataDir = path.resolve(__dirname, '../.postgres_data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let EmbeddedPostgres;
  try {
    const epModule = require('embedded-postgres');
    EmbeddedPostgres = epModule.default || epModule.EmbeddedPostgres || epModule;
  } catch (err) {
    console.error('embedded-postgres package is not installed:', err.message);
    process.exit(1);
  }

  const pg = new EmbeddedPostgres({
    port,
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    persistent: true,
  });

  console.log(`Starting Embedded PostgreSQL on port ${port}...`);
  try {
    await pg.initialise();
  } catch (err) {
    // If already initialised, continue
  }

  await pg.start();
  console.log(`✅ Embedded PostgreSQL running at 127.0.0.1:${port}`);

  await ensureUtf8Database(port);

  return pg;
}

async function main() {
  const port = 54329;
  const running = await isPortOpen(port);

  if (running) {
    console.log(`PostgreSQL is active on port ${port}. Ensuring UTF8 database...`);
    await ensureUtf8Database(port);
    return;
  }

  const pg = await startEmbeddedPostgres(port);

  process.on('SIGINT', async () => {
    console.log('\nStopping Embedded PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nStopping Embedded PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });

  console.log('Database daemon active. Press Ctrl+C to stop.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal DB runner error:', err);
    process.exit(1);
  });
}

module.exports = { isPortOpen, startEmbeddedPostgres, ensureUtf8Database };
