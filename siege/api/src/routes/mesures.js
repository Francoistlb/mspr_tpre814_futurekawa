const { Router } = require("express");
const config = require("../config");
const { fetchPays } = require("../utils/httpClient");

const router = Router();

/**
 * @openapi
 * /siege/mesures/{pays}/{lot_id}:
 *   get:
 *     tags: [mesures]
 *     summary: Historique des mesures IoT d'un lot
 *     description: >
 *       Délègue la requête vers l'API du pays concerné.
 *       Retourne l'historique température/humidité pour le lot demandé.
 *     parameters:
 *       - in: path
 *         name: pays
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bresil, equateur, colombie]
 *         description: Pays producteur
 *       - in: path
 *         name: lot_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du lot (ex. BR-001)
 *     responses:
 *       200:
 *         description: Mesures du lot
 *       404:
 *         description: Pays inconnu
 *       503:
 *         description: API pays indisponible
 */
router.get("/mesures/:pays/:lot_id", async (req, res) => {
  const { pays, lot_id } = req.params;

  if (!config.pays[pays]) {
    return res.status(404).json({
      error: `Pays inconnu : "${pays}"`,
      pays_valides: Object.keys(config.pays),
    });
  }

  const resultat = await fetchPays(pays, `/mesures/${lot_id}`);

  if (resultat.status === "error") {
    return res.status(503).json(resultat);
  }

  res.json(resultat);
});

module.exports = router;
