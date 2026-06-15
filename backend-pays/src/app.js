const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (req, res) => res.json(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [system]
 *     summary: Vérification de l'état du service
 *     responses:
 *       200:
 *         description: Service opérationnel
 *         content:
 *           application/json:
 *             example:
 *               status: ok
 *               pays: bresil
 */
app.get('/health', (req, res) => res.json({ status: 'ok', pays: process.env.PAYS }));

app.use('/lots',    require('./routes/lots'));
app.use('/mesures', require('./routes/mesures'));
app.use('/alertes', require('./routes/alertes'));

if (process.env.NODE_ENV !== 'production') {
  const { verifierPeremption } = require('./alertes');
  app.post('/dev/trigger-peremption', async (req, res) => {
    try {
      await verifierPeremption();
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = app;