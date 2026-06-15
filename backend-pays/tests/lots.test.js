const request = require('supertest');

process.env.PAYS = 'bresil';
const app = require('../src/app');

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
  init: jest.fn()
}));

const { pool } = require('../src/db');

const ENTREPOT_MOCK = { id: 1, code: 'BR01', nom: 'Entrepot Sao Paulo', pays: 'bresil' };
const LOT_MOCK     = { id: 'LOT-BR-2025-007', entrepot_id: 1, entrepot_code: 'BR01', date_stockage: '2026-01-05', statut: 'conforme' };

describe('GET /health', () => {
  test('✅ Répond 200 avec status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /lots', () => {
  test('✅ Retourne liste FIFO (plus ancien en premier)', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 'LOT-BR-2024-001', date_stockage: '2024-06-01', statut: 'perime' },
        { id: 'LOT-BR-2025-007', date_stockage: '2026-01-05', statut: 'conforme' },
      ]
    });
    const res = await request(app).get('/lots');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe('LOT-BR-2024-001');
  });
});

describe('POST /lots', () => {
  test('✅ Crée un lot et retourne 201', async () => {
    // 1. resolveEntrepot → entrepôt trouvé
    pool.query.mockResolvedValueOnce({ rows: [ENTREPOT_MOCK] });
    // 2. INSERT lots
    pool.query.mockResolvedValueOnce({ changes: 1, lastID: 1 });
    // 3. SELECT après insertion
    pool.query.mockResolvedValueOnce({ rows: [LOT_MOCK] });

    const res = await request(app).post('/lots').send({
      id: 'LOT-BR-2025-007', entrepot: 'BR01', date_stockage: '2026-01-05'
    });
    expect(res.status).toBe(201);
    expect(res.body.statut).toBe('conforme');
  });

  test('❌ Retourne 404 si entrepôt inconnu', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/lots').send({
      id: 'LOT-BR-2025-099', entrepot: 'INCONNU'
    });
    expect(res.status).toBe(404);
  });
});

describe('GET /lots/:id', () => {
  test('✅ Retourne un lot existant', async () => {
    pool.query.mockResolvedValueOnce({ rows: [LOT_MOCK] });
    const res = await request(app).get('/lots/LOT-BR-2025-007');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('LOT-BR-2025-007');
  });

  test('❌ Retourne 404 si lot inexistant', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/lots/INEXISTANT');
    expect(res.status).toBe(404);
  });
});

describe('PUT /lots/:id/statut', () => {
  test('✅ Met à jour le statut en perime', async () => {
    pool.query.mockResolvedValueOnce({ changes: 1 });
    pool.query.mockResolvedValueOnce({ rows: [{ ...LOT_MOCK, statut: 'perime' }] });
    const res = await request(app).put('/lots/LOT-BR-2025-007/statut').send({ statut: 'perime' });
    expect(res.status).toBe(200);
    expect(res.body.statut).toBe('perime');
  });

  test('❌ Retourne 404 si lot inexistant', async () => {
    pool.query.mockResolvedValueOnce({ changes: 0 });
    const res = await request(app).put('/lots/INEXISTANT/statut').send({ statut: 'conforme' });
    expect(res.status).toBe(404);
  });
});
