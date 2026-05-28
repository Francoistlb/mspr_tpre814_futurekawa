const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const pays = () => process.env.PAYS.toLowerCase();

const resolveEntrepot = async (code) => {
  const r = await pool.query(
    'SELECT * FROM entrepots WHERE code = ? AND pays = ?',
    [code, pays()]
  );
  return r.rows[0] || null;
};

router.post('/', async (req, res) => {
  const { id, entrepot, date_stockage, notes } = req.body;
  try {
    const e = await resolveEntrepot(entrepot);
    if (!e) return res.status(404).json({ error: `Entrepôt '${entrepot}' introuvable pour ${pays()}` });

    await pool.query(
      `INSERT INTO lots (id, entrepot_id, date_stockage, notes) VALUES (?, ?, ?, ?)`,
      [id, e.id, date_stockage || new Date().toISOString(), notes || null]
    );
    const inserted = await pool.query('SELECT * FROM lots WHERE id = ?', [id]);
    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, e.code AS entrepot_code, e.nom AS entrepot_nom
       FROM lots l
       JOIN entrepots e ON l.entrepot_id = e.id
       WHERE e.pays = ?
       ORDER BY l.date_stockage ASC`,
      [pays()]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, e.code AS entrepot_code, e.nom AS entrepot_nom
       FROM lots l
       JOIN entrepots e ON l.entrepot_id = e.id
       WHERE l.id = ? AND e.pays = ?`,
      [req.params.id, pays()]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Lot non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/statut', async (req, res) => {
  const { statut } = req.body;
  try {
    const info = await pool.query(
      `UPDATE lots SET statut = ?
       WHERE id = ?
         AND entrepot_id IN (SELECT id FROM entrepots WHERE pays = ?)`,
      [statut, req.params.id, pays()]
    );
    if (!info.changes) return res.status(404).json({ error: 'Lot non trouvé' });
    const updated = await pool.query('SELECT * FROM lots WHERE id = ?', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
