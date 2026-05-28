const nodemailer = require('nodemailer');
const { pool } = require('./db');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
});

const envoyerEmail = async (sujet, corps) => {
  try {
    await transporter.sendMail({
      from: 'alertes@futurekawa.com',
      to: process.env.RESPONSABLE_EMAIL,
      subject: sujet,
      text: corps,
    });
    console.log(`Email envoyé : ${sujet}`);
  } catch (err) {
    console.error(`Erreur email : ${err.message}`);
  }
};

const verifierSeuils = async (entrepot, temperature, humidite, mesure_id) => {
  const message =
    `Entrepôt: ${entrepot.code} (${entrepot.nom})\n` +
    `Température: ${temperature}°C (idéal: ${entrepot.temp_ideale}°C ±${entrepot.tolerance_temp})\n` +
    `Humidité: ${humidite}% (idéal: ${entrepot.hum_ideale}% ±${entrepot.tolerance_hum})`;

  await pool.query(
    `INSERT INTO alertes (type, entrepot_id, mesure_id, message, email_envoye, email_destinataire)
     VALUES ('hors_plage', ?, ?, ?, 1, ?)`,
    [entrepot.id, mesure_id || null, message, process.env.RESPONSABLE_EMAIL]
  );

  await envoyerEmail(`[ALERTE] Conditions hors seuils — ${entrepot.code}`, message);
};

const verifierPeremption = async () => {
  const pays = process.env.PAYS.toLowerCase();
  const result = await pool.query(
    `SELECT l.id, l.entrepot_id, e.code, e.nom
     FROM lots l
     JOIN entrepots e ON l.entrepot_id = e.id
     WHERE e.pays = ?
       AND l.date_stockage < datetime('now', '-365 days')
       AND l.statut != 'perime'`,
    [pays]
  );

  for (const lot of result.rows) {
    await pool.query(`UPDATE lots SET statut = 'perime' WHERE id = ?`, [lot.id]);

    const message = `Le lot ${lot.id} (entrepôt: ${lot.code} — ${lot.nom}) est stocké depuis plus de 365 jours.`;

    await pool.query(
      `INSERT INTO alertes (type, lot_id, entrepot_id, message, email_envoye, email_destinataire)
       VALUES ('peremption', ?, ?, ?, 1, ?)`,
      [lot.id, lot.entrepot_id, message, process.env.RESPONSABLE_EMAIL]
    );

    await envoyerEmail(`[ALERTE] Lot périmé — ${lot.id}`, message);
  }
};

module.exports = { verifierSeuils, verifierPeremption };
