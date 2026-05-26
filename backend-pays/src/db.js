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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lots (
      id VARCHAR PRIMARY KEY,
      pays VARCHAR NOT NULL,
      exploitation VARCHAR,
      entrepot VARCHAR NOT NULL,
      date_stockage DATE NOT NULL,
      statut VARCHAR DEFAULT 'conforme'
    );
    CREATE TABLE IF NOT EXISTS mesures (
      id SERIAL PRIMARY KEY,
      entrepot VARCHAR NOT NULL,
      temperature FLOAT NOT NULL,
      humidite FLOAT NOT NULL,
      timestamp TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Base de données initialisée');
};

module.exports = { pool, init };