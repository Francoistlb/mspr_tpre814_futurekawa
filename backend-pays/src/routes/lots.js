const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.post('/', async (req, res) => {
  const { id, pays, exploitation, entrepot, date_stockage } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO lots (id, pays, exploitation, entrepot, date_stockage)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, pays, exploitation, entrepot, date_stockage]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const result = await pool.query(`SELECT * FROM lots ORDER BY date_stockage ASC`);
  res.json(result.rows);
});

router.get('/:id', async (req, res) => {
  const result = await pool.query(`SELECT * FROM lots WHERE id=$1`, [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Lot non trouvé' });
  res.json(result.rows[0]);
});

router.put('/:id/statut', async (req, res) => {
  const { statut } = req.body;
  const result = await pool.query(
    `UPDATE lots SET statut=$1 WHERE id=$2 RETURNING *`,
    [statut, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Lot non trouvé' });
  res.json(result.rows[0]);
});

module.exports = router;