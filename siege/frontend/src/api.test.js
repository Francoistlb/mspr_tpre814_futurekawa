import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchStocks, fetchAlertes, fetchMesures, fetchMesuresPays } from './api';

// Réponse siege typique pour /siege/stocks
const STOCKS_RESPONSE = {
  total_pays: 3,
  pays_ok: 3,
  pays_en_erreur: 0,
  resultats: [
    {
      pays: 'bresil', code: 'BR', status: 'ok',
      data: [
        { id: 'LOT-BR-2025-007', entrepot_id: 1, entrepot_code: 'BR01', entrepot_nom: 'Entrepot Sao Paulo', date_stockage: '2026-01-05T08:00:00', statut: 'conforme', notes: '' },
        { id: 'LOT-BR-2024-001', entrepot_id: 1, entrepot_code: 'BR01', entrepot_nom: 'Entrepot Sao Paulo', date_stockage: '2024-06-01T08:00:00', statut: 'perime',   notes: '' },
      ]
    },
    {
      pays: 'equateur', code: 'EQ', status: 'ok',
      data: [
        { id: 'LOT-EQ-2025-002', entrepot_id: 3, entrepot_code: 'EQ01', entrepot_nom: 'Entrepot Quito', date_stockage: '2025-11-20T08:00:00', statut: 'conforme', notes: '' },
      ]
    },
    { pays: 'colombie', code: 'CO', status: 'error', error: 'Timeout (>3s)' },
  ]
};

const ALERTES_RESPONSE = {
  total_pays: 3, pays_ok: 2, pays_en_erreur: 1,
  resultats: [
    {
      pays: 'bresil', code: 'BR', status: 'ok',
      data: [
        { id: 1, type: 'hors_plage', entrepot_code: 'BR01', lot_id: 'LOT-BR-2025-019', message: 'Temperature hors plage.', email_envoye: 1, created_at: '2026-04-15T09:12:00' },
        { id: 2, type: 'peremption', entrepot_code: 'BR01', lot_id: 'LOT-BR-2024-001', message: 'Lot stocke depuis plus de 365 jours.', email_envoye: 1, created_at: '2026-01-03T08:00:00' },
      ]
    },
    { pays: 'equateur', code: 'EQ', status: 'ok', data: [] },
    { pays: 'colombie', code: 'CO', status: 'error', error: 'Timeout' },
  ]
};

const MESURES_RESPONSE = {
  pays: 'bresil', code: 'BR', status: 'ok',
  data: [
    { id: 1, entrepot_code: 'BR01', temperature: 28.5, humidite: 54.2, timestamp: '2026-05-28T14:00:00' },
    { id: 2, entrepot_code: 'BR01', temperature: 29.1, humidite: 55.0, timestamp: '2026-05-28T14:30:00' },
  ]
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

// ─── fetchStocks ──────────────────────────────────────────────────────────────

describe('fetchStocks()', () => {
  it('retourne tous les lots enrichis avec pays et age_jours, triés FIFO', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => STOCKS_RESPONSE });

    const lots = await fetchStocks();

    // Pays en erreur (colombie) exclu
    expect(lots.every(l => l.pays !== 'colombie')).toBe(true);

    // Enrichissement présent
    expect(lots[0]).toHaveProperty('pays');
    expect(lots[0]).toHaveProperty('pays_label');
    expect(lots[0]).toHaveProperty('age_jours');

    // Tri FIFO : plus ancien en premier
    const dates = lots.map(l => new Date(l.date_stockage).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
  });

  it('exclut les pays en erreur sans planter', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => STOCKS_RESPONSE });
    const lots = await fetchStocks();
    // 2 lots Brésil + 1 Équateur = 3 (Colombie en erreur exclue)
    expect(lots.length).toBe(3);
  });

  it('lève une erreur si le serveur répond non-OK', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(fetchStocks()).rejects.toThrow('HTTP 503');
  });
});

// ─── fetchAlertes ─────────────────────────────────────────────────────────────

describe('fetchAlertes()', () => {
  it('retourne les alertes enrichies avec pays_label, triées par date desc', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ALERTES_RESPONSE });

    const alertes = await fetchAlertes();

    expect(alertes.length).toBe(2); // colombie en erreur exclue
    expect(alertes[0]).toHaveProperty('pays_label');
    expect(alertes[0]).toHaveProperty('pays', 'bresil');

    // Tri décroissant (plus récente en premier)
    const dates = alertes.map(a => new Date(a.created_at).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });

  it('retourne tableau vide si tous les pays sont en erreur', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        resultats: [
          { pays: 'bresil',   status: 'error', error: 'down' },
          { pays: 'equateur', status: 'error', error: 'down' },
          { pays: 'colombie', status: 'error', error: 'down' },
        ]
      })
    });
    const alertes = await fetchAlertes();
    expect(alertes).toEqual([]);
  });
});

// ─── fetchMesures ─────────────────────────────────────────────────────────────

describe('fetchMesures()', () => {
  it('retourne les mesures d\'un lot', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => MESURES_RESPONSE });

    const mesures = await fetchMesures('bresil', 'LOT-BR-2025-007');

    expect(fetch).toHaveBeenCalledWith('/siege/mesures/bresil/LOT-BR-2025-007');
    expect(mesures.length).toBe(2);
    expect(mesures[0].temperature).toBe(28.5);
  });

  it('encode correctement les lot_id avec tirets', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => MESURES_RESPONSE });
    await fetchMesures('bresil', 'LOT-BR-2025-007');
    expect(fetch).toHaveBeenCalledWith('/siege/mesures/bresil/LOT-BR-2025-007');
  });

  it('retourne tableau vide si le pays est en erreur', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ pays: 'colombie', status: 'error', error: 'Timeout' })
    });
    const mesures = await fetchMesures('colombie', 'LOT-CO-2025-001');
    expect(mesures).toEqual([]);
  });
});

// ─── fetchMesuresPays ─────────────────────────────────────────────────────────

describe('fetchMesuresPays()', () => {
  it('appelle le bon endpoint avec le paramètre limit', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => MESURES_RESPONSE });

    const mesures = await fetchMesuresPays('bresil', 100);

    expect(fetch).toHaveBeenCalledWith('/siege/mesures/bresil?limit=100');
    expect(mesures.length).toBe(2);
  });

  it('utilise limit=200 par défaut', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => MESURES_RESPONSE });
    await fetchMesuresPays('equateur');
    expect(fetch).toHaveBeenCalledWith('/siege/mesures/equateur?limit=200');
  });
});
