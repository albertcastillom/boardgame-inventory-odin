const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.PGHOST || "localhost",
      user: process.env.PGUSER,
      database: process.env.PGDATABASE || "boardgame_inventory",
      password: process.env.PGPASSWORD,
      port: Number(process.env.PGPORT) || 5432,
    });

    module.exports = {
        query: (text, params) => pool.query(text, params),
        pool
    };