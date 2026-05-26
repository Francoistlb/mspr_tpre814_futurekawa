process.env.PAYS = 'Bresil';
const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
  init: jest.fn()
}));

jest.mock('../src/alertes', () => ({
  verifierSeuils: jest.fn().mockResolvedValue(undefined),
  verifierPeremption: jest.fn().mockResolvedValue(undefined)
}));

const { pool } = require('../src/db');
const { verifierSeuils } = require('../src/alertes');

describe('POST /mesures', () => {
  test('✅ Insère une mesure et retourne 201', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, entrepot: 'BR01', temperature: 28, humidite: 54, timestamp: new Date() }]
    });
    const res = await request(app).post('/mesures').send({
      entrepot: 'BR01', temperature: 28, humidite: 54
    });
    expect(res.status).toBe(201);
    expect(res.body.entrepot).toBe('BR01');
  });

  test('✅ Appelle verifierSeuils après insertion', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 2, entrepot: 'BR01', temperature: 35, humidite: 58 }]
    });
    await request(app).post('/mesures').send({
      entrepot: 'BR01', temperature: 35, humidite: 58
    });
    expect(verifierSeuils).toHaveBeenCalled();
  });
});

describe('GET /mesures/:lot_id', () => {
  test('✅ Retourne historique pour un lot existant', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ entrepot: 'BR01', date_stockage: '2024-01-01' }]
      })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, temperature: 28, humidite: 54, timestamp: '2024-01-02' },
          { id: 2, temperature: 30, humidite: 56, timestamp: '2024-01-03' },
        ]
      });
    const res = await request(app).get('/mesures/BR-001');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('❌ Retourne 404 si lot inexistant', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/mesures/INEXISTANT');
    expect(res.status).toBe(404);
  });
});