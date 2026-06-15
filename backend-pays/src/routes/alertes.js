const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * @openapi
 * /alertes:
 *   get:
 *     tags: [alertes]
 *     summary: Toutes les alertes du pays (hors plage + péremption)
 *     description: >
 *       Retourne les alertes générées automatiquement par le moteur d'alerte :
 *       dépassement de seuils IoT (hors_plage) ou lot stocké depuis plus de 365 jours (peremption).
 *     responses:
 *       200:
 *         description: Liste des alertes triées par date décroissante
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Alerte'
 *             example:
 *               - id: 1
 *                 type: hors_plage
 *                 entrepot_id: 1
 *                 entrepot_code: BR01
 *                 lot_id: LOT-BR-2025-019
 *                 message: "Temperature hors plage : 33.1°C (max 32°C)."
 *                 email_envoye: 1
 *                 email_destinataire: responsable.bresil@futurekawa.com
 *                 created_at: "2026-04-15T09:12:00"
 */
router.get('/', async (req, res) => {
  const pays = process.env.PAYS.toLowerCase();
  try {
    const result = await pool.query(
      `SELECT a.*, e.code AS entrepot_code, e.nom AS entrepot_nom
       FROM alertes a
       LEFT JOIN entrepots e ON a.entrepot_id = e.id
       WHERE e.pays = ?
       ORDER BY a.created_at DESC`,
      [pays]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
