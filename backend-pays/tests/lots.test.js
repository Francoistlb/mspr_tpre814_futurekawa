const request = require('supertest');

process.env.PAYS = 'Bresil';
const app = require('../src/app');

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
  init: jest.fn()
}));

const { pool } = require('../src/db');

describe('GET /health', () => {
  test('✅ Répond 200 avec status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /lots', () => {
  test('✅ Retourne liste FIFO', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 'BR-002', date_stockage: '2024-01-15', statut: 'conforme' },
        { id: 'BR-001', date_stockage: '2024-06-01', statut: 'conforme' },
      ]
    });
    const res = await request(app).get('/lots');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe('BR-002');
  });
});

describe('POST /lots', () => {
  test('✅ Crée un lot et retourne 201', async () => {
    const lot = { id: 'BR-001', pays: 'Bresil', entrepot: 'BR01', date_stockage: '2024-06-01' };
    pool.query.mockResolvedValueOnce({ rows: [{ ...lot, statut: 'conforme' }] });
    const res = await request(app).post('/lots').send(lot);
    expect(res.status).toBe(201);
    expect(res.body.statut).toBe('conforme');
  });
});

describe('GET /lots/:id', () => {
  test('✅ Retourne un lot existant', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 'BR-001', pays: 'Bresil', statut: 'conforme' }]
    });
    const res = await request(app).get('/lots/BR-001');
    expect(res.status).toBe(200);
  });

  test('❌ Retourne 404 si lot inexistant', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/lots/INEXISTANT');
    expect(res.status).toBe(404);
  });
});