process.env.PAYS = 'Bresil';
const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
  init: jest.fn()
}));

const { pool } = require('../src/db');

describe('Logique FIFO — tri par date de stockage ASC', () => {
  test('✅ Le lot le plus ancien apparaît en premier', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 'BR-003', date_stockage: '2023-01-01', statut: 'conforme' },
        { id: 'BR-001', date_stockage: '2024-03-15', statut: 'conforme' },
        { id: 'BR-002', date_stockage: '2024-06-01', statut: 'conforme' },
      ]
    });
    const res = await request(app).get('/lots');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe('BR-003'); // 2023 → le plus ancien
    expect(res.body[2].id).toBe('BR-002'); // 2024-06 → le plus récent
  });

  test('✅ Liste vide retourne tableau vide', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/lots');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('✅ Un seul lot retourne tableau d\'un élément', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 'BR-001', date_stockage: '2024-01-01', statut: 'conforme' }]
    });
    const res = await request(app).get('/lots');
    expect(res.body.length).toBe(1);
  });
});