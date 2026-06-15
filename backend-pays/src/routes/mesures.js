const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifierSeuils } = require('../alertes');

const pays = () => process.env.PAYS.toLowerCase();

/**
 * @openapi
 * /mesures:
 *   get:
 *     tags: [mesures]
 *     summary: Dernières mesures IoT du pays (tous entrepôts)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 200
 *           maximum: 500
 *         description: Nombre maximum de mesures retournées
 *     responses:
 *       200:
 *         description: Mesures triées par timestamp ASC
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mesure'
 */
router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  try {
    const result = await pool.query(
      `SELECT m.*, e.code AS entrepot_code
       FROM mesures m
       JOIN entrepots e ON m.entrepot_id = e.id
       WHERE e.pays = ?
       ORDER BY m.timestamp DESC LIMIT ?`,
      [pays(), limit]
    );
    res.json(result.rows.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /mesures:
 *   post:
 *     tags: [mesures]
 *     summary: Enregistrer une mesure IoT manuellement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entrepot, temperature, humidite]
 *             properties:
 *               entrepot:    { type: string, example: "BR01" }
 *               temperature: { type: number, example: 28.5 }
 *               humidite:    { type: number, example: 54.2 }
 *     responses:
 *       201:
 *         description: Mesure enregistrée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mesure'
 *       404:
 *         description: Entrepôt introuvable
 */
router.post('/', async (req, res) => {
  const { entrepot, temperature, humidite } = req.body;
  try {
    const e = await pool.query(
      'SELECT * FROM entrepots WHERE code = ? AND pays = ?',
      [entrepot, pays()]
    );
    if (!e.rows.length) return res.status(404).json({ error: `Entrepôt '${entrepot}' introuvable` });
    const row = e.rows[0];

    const hors_plage =
      Math.abs(temperature - row.temp_ideale) > row.tolerance_temp ||
      Math.abs(humidite - row.hum_ideale) > row.tolerance_hum;

    const inserted = await pool.query(
      `INSERT INTO mesures (entrepot_id, temperature, humidite, hors_plage) VALUES (?, ?, ?, ?)`,
      [row.id, temperature, humidite, hors_plage ? 1 : 0]
    );

    if (hors_plage) {
      await verifierSeuils(row, temperature, humidite, inserted.lastID);
    }

    const mesure = await pool.query('SELECT * FROM mesures WHERE id = ?', [inserted.lastID]);
    res.status(201).json(mesure.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /mesures/{lot_id}:
 *   get:
 *     tags: [mesures]
 *     summary: Historique des mesures pour un lot (depuis sa date de stockage)
 *     description: >
 *       Retourne toutes les mesures de l'entrepôt du lot, depuis sa date d'entrée en stock.
 *       Permet de visualiser les conditions auxquelles ce lot a été exposé.
 *     parameters:
 *       - in: path
 *         name: lot_id
 *         required: true
 *         schema:
 *           type: string
 *         example: LOT-BR-2025-007
 *     responses:
 *       200:
 *         description: Mesures du lot (tableau vide si aucune donnée IoT)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mesure'
 *       404:
 *         description: Lot non trouvé
 */
router.get('/:lot_id', async (req, res) => {
  try {
    const lot = await pool.query(
      `SELECT l.entrepot_id, l.date_stockage
       FROM lots l
       JOIN entrepots e ON l.entrepot_id = e.id
       WHERE l.id = ? AND e.pays = ?`,
      [req.params.lot_id, pays()]
    );
    if (!lot.rows.length) return res.status(404).json({ error: 'Lot non trouvé' });

    const { entrepot_id, date_stockage } = lot.rows[0];
    const mesures = await pool.query(
      `SELECT * FROM mesures WHERE entrepot_id = ? AND timestamp >= ? ORDER BY timestamp ASC`,
      [entrepot_id, date_stockage]
    );
    res.json(mesures.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
