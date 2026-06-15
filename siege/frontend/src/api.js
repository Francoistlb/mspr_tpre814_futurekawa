import { PAYS } from './data/mockData';

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

function enrichLot(lot, pays, paysLabel) {
  const age = Math.floor((Date.now() - new Date(lot.date_stockage)) / 86400000);
  return { ...lot, pays, pays_label: paysLabel, age_jours: age };
}

function enrichAlerte(alerte, pays, paysLabel) {
  return { ...alerte, pays, pays_label: paysLabel };
}

// Tous les lots de tous les pays, triés FIFO
export async function fetchStocks() {
  const json = await get('/siege/stocks');
  return json.resultats
    .flatMap((r) => {
      if (r.status !== 'ok') return [];
      const paysInfo = PAYS.find((p) => p.code === r.pays);
      return r.data.map((lot) => enrichLot(lot, r.pays, paysInfo?.label ?? r.pays));
    })
    .sort((a, b) => new Date(a.date_stockage) - new Date(b.date_stockage));
}

// Toutes les alertes de tous les pays, triées par date desc
export async function fetchAlertes() {
  const json = await get('/siege/alertes');
  return json.resultats
    .flatMap((r) => {
      if (r.status !== 'ok') return [];
      const paysInfo = PAYS.find((p) => p.code === r.pays);
      return r.data.map((a) => enrichAlerte(a, r.pays, paysInfo?.label ?? r.pays));
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Mesures IoT d'un lot (via siège)
export async function fetchMesures(pays, lotId) {
  const json = await get(`/siege/mesures/${pays}/${encodeURIComponent(lotId)}`);
  return json.status === 'ok' ? json.data : [];
}

// Dernières mesures IoT d'un pays entier (pour graphiques dashboard)
export async function fetchMesuresPays(pays, limit = 200) {
  const json = await get(`/siege/mesures/${pays}?limit=${limit}`);
  return json.status === 'ok' ? json.data : [];
}
