const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const healthRouter = require("./routes/health");
const stocksRouter = require("./routes/stocks");
const mesuresRouter = require("./routes/mesures");
const alertesRouter = require("./routes/alertes");
const config = require("./config");

const app = express();

// ---- Middlewares ----
app.use(cors());
app.use(express.json());

// ---- Swagger UI ----
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (req, res) => res.json(swaggerSpec));

// ---- Routes ----
app.use("/", healthRouter);
app.use("/siege", stocksRouter);
app.use("/siege", mesuresRouter);
app.use("/siege", alertesRouter);

// ---- 404 catch-all ----
app.use((req, res) => {
  res.status(404).json({
    error: "Route introuvable",
    path: req.originalUrl,
    docs: "/docs",
  });
});

// ---- Démarrage ----
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`🚀 FutureKawa Siège API — port ${config.port}`);
    console.log(`📄 Swagger UI : http://localhost:${config.port}/docs`);
    console.log(`🌍 Pays configurés : ${Object.keys(config.pays).join(", ")}`);
    console.log(`⏱️  Timeout par pays : ${config.timeout}ms`);
  });
}

module.exports = app; // export pour les tests
