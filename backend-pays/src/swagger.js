const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FutureKawa API — Backend Pays',
      version: '1.0.0',
      description:
        'API REST d\'un pays producteur de café vert.\n\n' +
        'Gère les lots, les mesures IoT (température / humidité) et les alertes.\n\n' +
        '**Ports par pays :** Brésil → 8001 · Équateur → 8002 · Colombie → 8003',
    },
    servers: [
      { url: 'http://localhost:8001', description: 'Brésil' },
      { url: 'http://localhost:8002', description: 'Équateur' },
      { url: 'http://localhost:8003', description: 'Colombie' },
    ],
    tags: [
      { name: 'system',  description: 'Santé du service' },
      { name: 'lots',    description: 'Gestion des lots de café vert (FIFO)' },
      { name: 'mesures', description: 'Mesures IoT température / humidité' },
      { name: 'alertes', description: 'Alertes hors plage et péremption' },
    ],
    components: {
      schemas: {
        Lot: {
          type: 'object',
          properties: {
            id:             { type: 'string', example: 'LOT-BR-2025-007' },
            entrepot_id:    { type: 'integer', example: 1 },
            entrepot_code:  { type: 'string', example: 'BR01' },
            entrepot_nom:   { type: 'string', example: 'Entrepôt São Paulo' },
            date_stockage:  { type: 'string', format: 'date-time' },
            statut:         { type: 'string', enum: ['conforme', 'en_alerte', 'perime'] },
            notes:          { type: 'string', nullable: true },
          },
        },
        Mesure: {
          type: 'object',
          properties: {
            id:            { type: 'integer' },
            entrepot_id:   { type: 'integer' },
            entrepot_code: { type: 'string', example: 'BR01' },
            temperature:   { type: 'number', example: 28.5 },
            humidite:      { type: 'number', example: 54.2 },
            hors_plage:    { type: 'integer', enum: [0, 1] },
            timestamp:     { type: 'string', format: 'date-time' },
          },
        },
        Alerte: {
          type: 'object',
          properties: {
            id:                 { type: 'integer' },
            type:               { type: 'string', enum: ['hors_plage', 'peremption'] },
            entrepot_id:        { type: 'integer' },
            entrepot_code:      { type: 'string', example: 'BR01' },
            lot_id:             { type: 'string', nullable: true },
            message:            { type: 'string' },
            email_envoye:       { type: 'integer', enum: [0, 1] },
            email_destinataire: { type: 'string', format: 'email' },
            created_at:         { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
