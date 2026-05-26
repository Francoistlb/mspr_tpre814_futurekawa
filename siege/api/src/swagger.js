const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FutureKawa API — Siège",
      version: "1.0.0",
      description:
        "Backend central : agrège les données de tous les pays producteurs de café vert.\n\n" +
        "Appelle les APIs pays via HTTP avec tolérance aux pannes (timeout + réponse partielle).\n\n" +
        "**Pays configurés :** Brésil, Équateur, Colombie",
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Développement local",
      },
    ],
    tags: [
      { name: "system", description: "Santé et informations du service" },
      { name: "stocks", description: "Agrégation des lots de café vert" },
      { name: "mesures", description: "Délégation des mesures IoT (temp/humidité)" },
      { name: "alertes", description: "Agrégation des alertes actives" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
