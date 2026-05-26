const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifierSeuils } = require('../alertes');
const schema = process.env.PAYS.toLowerCase();

router.post('/', async (req, res) => {
  const { entrepot, temperature, humidite } = req.body;
  const result = await pool.query(
    `INSERT INTO ${schema}.mesures (entrepot, temperature, humidite)
     VALUES ($1,$2,$3) RETURNING *`,
    [entrepot, temperature, humidite]
  );
  await verifierSeuils(process.env.PAYS, temperature, humidite, entrepot);
  res.status(201).json(result.rows[0]);
});

router.get('/:lot_id', async (req, res) => {
  const lot = await pool.query(
    `SELECT entrepot, date_stockage FROM ${schema}.lots WHERE id=$1`,
    [req.params.lot_id]
  );
  if (!lot.rows.length) return res.status(404).json({ error: 'Lot non trouvé' });
  const { entrepot, date_stockage } = lot.rows[0];
  const mesures = await pool.query(
    `SELECT * FROM ${schema}.mesures
     WHERE entrepot=$1 AND timestamp >= $2
     ORDER BY timestamp ASC`,
    [entrepot, date_stockage]
  );
  res.json(mesures.rows);
});

module.exports = router;