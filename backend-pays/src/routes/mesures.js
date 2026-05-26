const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifierSeuils } = require('../alertes');

const pays = () => process.env.PAYS.toLowerCase();

router.post('/', async (req, res) => {
  const { entrepot, temperature, humidite } = req.body;
  try {
    const e = await pool.query(
      'SELECT * FROM entrepots WHERE code = $1 AND pays = $2',
      [entrepot, pays()]
    );
    if (!e.rows.length) return res.status(404).json({ error: `Entrepôt '${entrepot}' introuvable` });
    const row = e.rows[0];

    const hors_plage =
      Math.abs(temperature - row.temp_ideale) > row.tolerance_temp ||
      Math.abs(humidite - row.hum_ideale) > row.tolerance_hum;

    const result = await pool.query(
      `INSERT INTO mesures (entrepot_id, temperature, humidite, hors_plage)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [row.id, temperature, humidite, hors_plage]
    );

    if (hors_plage) {
      await verifierSeuils(row, temperature, humidite, result.rows[0].id);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:lot_id', async (req, res) => {
  try {
    const lot = await pool.query(
      `SELECT l.entrepot_id, l.date_stockage
       FROM lots l
       JOIN entrepots e ON l.entrepot_id = e.id
       WHERE l.id = $1 AND e.pays = $2`,
      [req.params.lot_id, pays()]
    );
    if (!lot.rows.length) return res.status(404).json({ error: 'Lot non trouvé' });

    const { entrepot_id, date_stockage } = lot.rows[0];
    const mesures = await pool.query(
      `SELECT * FROM mesures
       WHERE entrepot_id = $1 AND timestamp >= $2
       ORDER BY timestamp ASC`,
      [entrepot_id, date_stockage]
    );
    res.json(mesures.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
