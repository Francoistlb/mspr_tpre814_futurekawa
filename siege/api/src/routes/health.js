const { Router } = require("express");
const config = require("../config");

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [system]
 *     summary: Santé du service siège
 *     responses:
 *       200:
 *         description: Service opérationnel
 *         content:
 *           application/json:
 *             example:
 *               status: ok
 *               service: siege
 *               version: "1.0.0"
 *               pays_configures: [bresil, equateur, colombie]
 *               timeout_ms: 3000
 */
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "siege",
    version: "1.0.0",
    pays_configures: Object.keys(config.pays),
    timeout_ms: config.timeout,
  });
});

module.exports = router;
