const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const init = async () => {
  const schema = process.env.PAYS.toLowerCase(); // bresil, equateur, colombie

  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${schema}.lots (
      id VARCHAR PRIMARY KEY,
      pays VARCHAR NOT NULL,
      exploitation VARCHAR,
      entrepot VARCHAR NOT NULL,
      date_stockage DATE NOT NULL,
      statut VARCHAR DEFAULT 'conforme'
    );
    CREATE TABLE IF NOT EXISTS ${schema}.mesures (
      id SERIAL PRIMARY KEY,
      entrepot VARCHAR NOT NULL,
      temperature FLOAT NOT NULL,
      humidite FLOAT NOT NULL,
      timestamp TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log(`Schéma "${schema}" initialisé`);
};

module.exports = { pool, init };