const mqtt = require('mqtt');
const { pool } = require('./db');
const { verifierSeuils } = require('./alertes');
require('dotenv').config();

const demarrerConsumer = () => {
  const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`);

  client.on('connect', () => {
    console.log('MQTT connecté');
    client.subscribe(process.env.MQTT_TOPIC);
  });

  client.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      const pays = process.env.PAYS.toLowerCase();

      const e = await pool.query(
        'SELECT * FROM entrepots WHERE code = $1 AND pays = $2',
        [data.entrepot, pays]
      );
      if (!e.rows.length) {
        console.warn(`MQTT: entrepôt inconnu '${data.entrepot}' pour ${pays}`);
        return;
      }
      const entrepot = e.rows[0];

      const hors_plage =
        Math.abs(data.temp - entrepot.temp_ideale) > entrepot.tolerance_temp ||
        Math.abs(data.hum - entrepot.hum_ideale) > entrepot.tolerance_hum;

      const mesure = await pool.query(
        `INSERT INTO mesures (entrepot_id, temperature, humidite, hors_plage, timestamp)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [entrepot.id, data.temp, data.hum, hors_plage, data.ts || new Date()]
      );

      if (hors_plage) {
        await verifierSeuils(entrepot, data.temp, data.hum, mesure.rows[0].id);
      }
    } catch (err) {
      console.error('Erreur message MQTT:', err.message);
    }
  });

  client.on('error', (err) => console.error('Erreur MQTT:', err.message));
  client.on('offline', () => console.warn('MQTT hors ligne, reconnexion...'));
};

module.exports = { demarrerConsumer };
