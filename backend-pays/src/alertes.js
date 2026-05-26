const nodemailer = require('nodemailer');
require('dotenv').config();

const SEUILS = {
  Bresil:   { temp: 29, hum: 55 },
  Equateur: { temp: 31, hum: 60 },
  Colombie: { temp: 26, hum: 80 },
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
});

const envoyerEmail = async (sujet, corps) => {
  await transporter.sendMail({
    from: 'alertes@futurekawa.com',
    to: process.env.RESPONSABLE_EMAIL,
    subject: sujet,
    text: corps,
  });
  console.log(`Email envoyé : ${sujet}`);
};

const verifierSeuils = async (pays, temperature, humidite, entrepot) => {
  const s = SEUILS[pays];
  if (!s) return;
  const tempOk = Math.abs(temperature - s.temp) <= 3;
  const humOk  = Math.abs(humidite - s.hum) <= 2;
  if (!tempOk || !humOk) {
    await envoyerEmail(
      `[ALERTE] Conditions hors seuils — ${entrepot}`,
      `Entrepôt: ${entrepot}\nTempérature: ${temperature}°C (idéal: ${s.temp}°C ±3)\nHumidité: ${humidite}% (idéal: ${s.hum}% ±2)`
    );
  }
};

const verifierPeremption = async (pool) => {
  const schema = process.env.PAYS.toLowerCase();
  const result = await pool.query(`
    SELECT id, entrepot, date_stockage FROM ${schema}.lots
    WHERE date_stockage < NOW() - INTERVAL '365 days'
    AND statut != 'perime'
  `);
  for (const lot of result.rows) {
    await pool.query(
      `UPDATE ${schema}.lots SET statut='perime' WHERE id=$1`, [lot.id]
    );
    await envoyerEmail(
      `[ALERTE] Lot périmé — ${lot.id}`,
      `Le lot ${lot.id} (entrepôt: ${lot.entrepot}) est stocké depuis plus de 365 jours.`
    );
  }
};

module.exports = { verifierSeuils, verifierPeremption };