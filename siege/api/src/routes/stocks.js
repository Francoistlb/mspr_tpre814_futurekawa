const { Router } = require("express");
const config = require("../config");
const { fetchPays, fetchAllPays } = require("../utils/httpClient");

const router = Router();

/**
 * @openapi
 * /siege/stocks:
 *   get:
 *     tags: [stocks]
 *     summary: Stocks de tous les pays (agrégation FIFO)
 *     description: >
 *       Interroge en parallèle les APIs des 3 pays et consolide les résultats.
 *       Si un pays est down ou timeout, une réponse partielle est retournée
 *       avec `status: "error"` pour ce pays. Les autres pays sont toujours inclus.
 *     responses:
 *       200:
 *         description: Résultats agrégés (partiels si un pays est indisponible)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_pays:
 *                   type: integer
 *                 pays_ok:
 *                   type: integer
 *                 pays_en_erreur:
 *                   type: integer
 *                 resultats:
 *                   type: array
 *                   items:
 *                     type: object
 *             example:
 *               total_pays: 3
 *               pays_ok: 2
 *               pays_en_erreur: 1
 *               resultats:
 *                 - pays: bresil
 *                   code: BR
 *                   status: ok
 *                   data: []
 *                 - pays: equateur
 *                   code: EQ
 *                   status: error
 *                   error: "Timeout (>3s)"
 *                 - pays: colombie
 *                   code: CO
 *                   status: ok
 *                   data: []
 */
router.get("/stocks", async (req, res) => {
  const resultats = await fetchAllPays("/lots");
  const pays_ok = resultats.filter((r) => r.status === "ok").length;

  res.json({
    total_pays: resultats.length,
    pays_ok,
    pays_en_erreur: resultats.length - pays_ok,
    resultats,
  });
});

/**
 * @openapi
 * /siege/stocks/{pays}:
 *   get:
 *     tags: [stocks]
 *     summary: Stocks d'un seul pays
 *     parameters:
 *       - in: path
 *         name: pays
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bresil, equateur, colombie]
 *         description: Identifiant du pays
 *     responses:
 *       200:
 *         description: Lots du pays demandé
 *       404:
 *         description: Pays inconnu
 */
router.get("/stocks/:pays", async (req, res) => {
  const { pays } = req.params;

  if (!config.pays[pays]) {
    return res.status(404).json({
      error: `Pays inconnu : "${pays}"`,
      pays_valides: Object.keys(config.pays),
    });
  }

  const resultat = await fetchPays(pays, "/lots");
  res.json(resultat);
});

module.exports = router;
