require('dotenv').config();
const app = require('./app');
const { init, pool } = require('./db');
const { demarrerConsumer } = require('./mqtt');
const { verifierPeremption } = require('./alertes');

const PORT = process.env.PORT || 3000;

const start = async () => {
  await init();
  demarrerConsumer();
  setInterval(() => verifierPeremption(pool), 60 * 60 * 1000);
  app.listen(PORT, () => {
    console.log(`Backend ${process.env.PAYS} démarré sur le port ${PORT}`);
  });
};

start();