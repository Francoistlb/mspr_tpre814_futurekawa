process.env.PAYS = 'bresil';
const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
  init: jest.fn()
}));

jest.mock('../src/alertes', () => ({
  verifierSeuils:     jest.fn().mockResolvedValue(undefined),
  verifierPeremption: jest.fn().mockResolvedValue(undefined)
}));

const { pool }           = require('../src/db');
const { verifierSeuils } = require('../src/alertes');

// Entrepôt Brésil avec seuils réels
const ENTREPOT_BRESIL = {
  id: 1, code: 'BR01', nom: 'Entrepot Sao Paulo', pays: 'bresil',
  temp_ideale: 29, hum_ideale: 55, tolerance_temp: 3, tolerance_hum: 2
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /mesures', () => {
  test('✅ Retourne les dernières mesures du pays', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, entrepot_code: 'BR01', temperature: 28.5, humidite: 54.2, timestamp: '2026-05-28T14:00:00' },
        { id: 2, entrepot_code: 'BR01', temperature: 29.1, humidite: 55.0, timestamp: '2026-05-28T14:30:00' },
      ]
    });
    const res = await request(app).get('/mesures');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

describe('POST /mesures', () => {
  test('✅ Insère une mesure conforme et retourne 201', async () => {
    // Temp 28°C / hum 54% → dans les seuils (29±3 / 55±2)
    pool.query.mockResolvedValueOnce({ rows: [ENTREPOT_BRESIL] }); // SELECT entrepot
    pool.query.mockResolvedValueOnce({ changes: 1, lastID: 1 });   // INSERT mesure
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, temperature: 28, humidite: 54 }] }); // SELECT mesure

    const res = await request(app).post('/mesures').send({
      entrepot: 'BR01', temperature: 28, humidite: 54
    });
    expect(res.status).toBe(201);
    expect(verifierSeuils).not.toHaveBeenCalled(); // dans les seuils → pas d'alerte
  });

  test('✅ Appelle verifierSeuils si mesure hors plage', async () => {
    // Temp 35°C → hors seuil (29±3 max=32)
    pool.query.mockResolvedValueOnce({ rows: [ENTREPOT_BRESIL] }); // SELECT entrepot
    pool.query.mockResolvedValueOnce({ changes: 1, lastID: 2 });   // INSERT mesure
    pool.query.mockResolvedValueOnce({ rows: [{ id: 2, temperature: 35, humidite: 54 }] }); // SELECT

    const res = await request(app).post('/mesures').send({
      entrepot: 'BR01', temperature: 35, humidite: 54
    });
    expect(res.status).toBe(201);
    expect(verifierSeuils).toHaveBeenCalledWith(
      ENTREPOT_BRESIL, 35, 54, 2
    );
  });

  test('❌ Retourne 404 si entrepôt inconnu', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/mesures').send({
      entrepot: 'INCONNU', temperature: 28, humidite: 54
    });
    expect(res.status).toBe(404);
  });
});

describe('GET /mesures/:lot_id', () => {
  test('✅ Retourne historique depuis la date de stockage', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ entrepot_id: 1, date_stockage: '2026-01-05T08:00:00' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, temperature: 28.5, humidite: 54.2, timestamp: '2026-05-28T14:00:00' },
          { id: 2, temperature: 29.1, humidite: 55.0, timestamp: '2026-05-28T14:30:00' },
        ]
      });
    const res = await request(app).get('/mesures/LOT-BR-2025-007');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('❌ Retourne 404 si lot inexistant', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/mesures/INEXISTANT');
    expect(res.status).toBe(404);
  });
});
