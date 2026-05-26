const { Router } = require("express");
const { fetchAllPays } = require("../utils/httpClient");

const router = Router();

/**
 * @openapi
 * /siege/alertes:
 *   get:
 *     tags: [alertes]
 *     summary: Alertes actives de tous les pays
 *     description: >
 *       Agrège les alertes actives de tous les pays en parallèle.
 *       Les pays indisponibles sont signalés dans la réponse sans bloquer les autres.
 *     responses:
 *       200:
 *         description: Alertes agrégées
 *         content:
 *           application/json:
 *             example:
 *               total_pays: 3
 *               pays_ok: 3
 *               pays_en_erreur: 0
 *               resultats:
 *                 - pays: bresil
 *                   code: BR
 *                   status: ok
 *                   data: []
 */
router.get("/alertes", async (req, res) => {
  const resultats = await fetchAllPays("/alertes");
  const pays_ok = resultats.filter((r) => r.status === "ok").length;

  res.json({
    total_pays: resultats.length,
    pays_ok,
    pays_en_erreur: resultats.length - pays_ok,
    resultats,
  });
});

module.exports = router;
