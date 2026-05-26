import dotenv from "dotenv";

dotenv.config();
const mqtt = require('mqtt');
const { pool } = require('./db');
const { verifierSeuils } = require('./alertes');

const demarrerConsumer = () => {
  const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`);

  client.on('connect', () => {
    console.log('MQTT connecté');
    client.subscribe(process.env.MQTT_TOPIC);
  });

  client.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      await pool.query(
        `INSERT INTO mesures (entrepot, temperature, humidite, timestamp)
         VALUES ($1, $2, $3, $4)`,
        [data.entrepot, data.temp, data.hum, data.ts || new Date()]
      );
      await verifierSeuils(process.env.PAYS, data.temp, data.hum, data.entrepot);
    } catch (err) {
      console.error('Erreur message MQTT:', err.message);
    }
  });

  client.on('error', (err) => console.error('Erreur MQTT:', err.message));
  client.on('offline', () => console.warn('MQTT hors ligne, reconnexion...'));
};

module.exports = { demarrerConsumer };