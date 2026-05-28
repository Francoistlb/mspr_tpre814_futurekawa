// Donnees en dur — mirroir du schema BDD reel (cf. DOCS/db-schema.puml)
// Branchement futur sur l'API siege : remplacer les fonctions getter par des appels HTTP.

const NOW = new Date();

function daysAgo(d) {
  const t = new Date(NOW);
  t.setDate(t.getDate() - d);
  return t;
}

export const PAYS = [
  {
    code: 'bresil',
    label: 'Brésil',
    flag: 'BR',
    temp_ideale: 29.0,
    hum_ideale: 55.0,
    tolerance_temp: 3.0,
    tolerance_hum: 2.0,
    responsable_email: 'responsable.bresil@futurekawa.com'
  },
  {
    code: 'equateur',
    label: 'Équateur',
    flag: 'EQ',
    temp_ideale: 31.0,
    hum_ideale: 60.0,
    tolerance_temp: 3.0,
    tolerance_hum: 2.0,
    responsable_email: 'responsable.equateur@futurekawa.com'
  },
  {
    code: 'colombie',
    label: 'Colombie',
    flag: 'CO',
    temp_ideale: 26.0,
    hum_ideale: 80.0,
    tolerance_temp: 3.0,
    tolerance_hum: 2.0,
    responsable_email: 'responsable.colombie@futurekawa.com'
  }
];

export const ENTREPOTS = [
  { id: 1, code: 'BR01', nom: 'Entrepôt São Paulo',  exploitation: 'Fazenda Norte',  pays: 'bresil' },
  { id: 2, code: 'BR02', nom: 'Entrepôt Minas',      exploitation: 'Fazenda Sul',    pays: 'bresil' },
  { id: 3, code: 'EQ01', nom: 'Entrepôt Quito',      exploitation: 'Hacienda Andes', pays: 'equateur' },
  { id: 4, code: 'EQ02', nom: 'Entrepôt Guayaquil',  exploitation: 'Hacienda Costa', pays: 'equateur' },
  { id: 5, code: 'CO01', nom: 'Entrepôt Bogotá',     exploitation: 'Finca Sierra',   pays: 'colombie' },
  { id: 6, code: 'CO02', nom: 'Entrepôt Medellín',   exploitation: 'Finca Cauca',    pays: 'colombie' }
];

// Lots — id unique, statut ∈ { conforme | en_alerte | perime }
// Etales sur 18 mois pour montrer FIFO + peremption (>365j)
export const LOTS = [
  { id: 'BR-2023-014', entrepot_id: 1, date_stockage: daysAgo(420), statut: 'perime',    notes: 'Recolte saison seche' },
  { id: 'CO-2023-007', entrepot_id: 5, date_stockage: daysAgo(395), statut: 'perime',    notes: 'Lot Bogota Q2' },
  { id: 'EQ-2023-022', entrepot_id: 3, date_stockage: daysAgo(310), statut: 'en_alerte', notes: 'Derive humidite ponctuelle' },
  { id: 'BR-2024-001', entrepot_id: 1, date_stockage: daysAgo(270), statut: 'conforme',  notes: '' },
  { id: 'BR-2024-004', entrepot_id: 2, date_stockage: daysAgo(240), statut: 'conforme',  notes: '' },
  { id: 'CO-2024-011', entrepot_id: 6, date_stockage: daysAgo(210), statut: 'en_alerte', notes: 'Temperature haute semaine 32' },
  { id: 'EQ-2024-008', entrepot_id: 4, date_stockage: daysAgo(180), statut: 'conforme',  notes: '' },
  { id: 'BR-2024-019', entrepot_id: 1, date_stockage: daysAgo(150), statut: 'conforme',  notes: '' },
  { id: 'CO-2024-018', entrepot_id: 5, date_stockage: daysAgo(120), statut: 'conforme',  notes: '' },
  { id: 'EQ-2024-014', entrepot_id: 3, date_stockage: daysAgo(95),  statut: 'conforme',  notes: '' },
  { id: 'BR-2024-027', entrepot_id: 2, date_stockage: daysAgo(70),  statut: 'conforme',  notes: '' },
  { id: 'CO-2024-026', entrepot_id: 6, date_stockage: daysAgo(45),  statut: 'conforme',  notes: '' },
  { id: 'EQ-2024-021', entrepot_id: 4, date_stockage: daysAgo(30),  statut: 'conforme',  notes: '' },
  { id: 'BR-2024-033', entrepot_id: 1, date_stockage: daysAgo(15),  statut: 'conforme',  notes: 'Lot premium' },
  { id: 'CO-2024-031', entrepot_id: 5, date_stockage: daysAgo(5),   statut: 'conforme',  notes: 'Recente entree' }
];

// Generation deterministe de mesures pour un lot (1 mesure / jour depuis stockage)
// Retourne {timestamp, temperature, humidite, hors_plage}
function genMesures(lotId, paysCode, dateStockage, days) {
  const pays = PAYS.find((p) => p.code === paysCode);
  const tIdeal = pays.temp_ideale;
  const hIdeal = pays.hum_ideale;
  const tMin = tIdeal - pays.tolerance_temp;
  const tMax = tIdeal + pays.tolerance_temp;
  const hMin = hIdeal - pays.tolerance_hum;
  const hMax = hIdeal + pays.tolerance_hum;

  // PRNG deterministe (mulberry32) base sur l'id du lot
  let seed = 0;
  for (let i = 0; i < lotId.length; i++) seed = (seed * 31 + lotId.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const mesures = [];
  const step = Math.max(1, Math.floor(days / 60)); // max ~60 points pour ne pas surcharger le graph
  for (let d = 0; d <= days; d += step) {
    const ts = new Date(dateStockage);
    ts.setDate(ts.getDate() + d);
    // base + bruit + drift sinusoidal
    const drift = Math.sin(d / 9) * 1.4;
    const t = tIdeal + drift + (rand() - 0.5) * 1.6;
    const h = hIdeal + Math.cos(d / 11) * 1.6 + (rand() - 0.5) * 1.4;
    const hors = t < tMin || t > tMax || h < hMin || h > hMax;
    mesures.push({
      timestamp: ts.toISOString(),
      temperature: Math.round(t * 10) / 10,
      humidite: Math.round(h * 10) / 10,
      hors_plage: hors
    });
  }
  // Injection de derives volontaires pour les lots en alerte / perimes
  return mesures;
}

// Cache mesures par lot
const _mesuresCache = new Map();

export function getMesuresByLot(lotId) {
  if (_mesuresCache.has(lotId)) return _mesuresCache.get(lotId);
  const lot = LOTS.find((l) => l.id === lotId);
  if (!lot) return [];
  const entrepot = ENTREPOTS.find((e) => e.id === lot.entrepot_id);
  const days = Math.floor((NOW - lot.date_stockage) / (1000 * 60 * 60 * 24));
  let mesures = genMesures(lotId, entrepot.pays, lot.date_stockage, days);

  // Pour les lots en alerte : forcer quelques pics hors plage en fin de serie
  if (lot.statut === 'en_alerte') {
    const pays = PAYS.find((p) => p.code === entrepot.pays);
    for (let i = mesures.length - 5; i < mesures.length; i++) {
      if (i < 0) continue;
      mesures[i] = {
        ...mesures[i],
        temperature: Math.round((pays.temp_ideale + pays.tolerance_temp + 1.5) * 10) / 10,
        humidite: Math.round((pays.hum_ideale + pays.tolerance_hum + 1.2) * 10) / 10,
        hors_plage: true
      };
    }
  }
  _mesuresCache.set(lotId, mesures);
  return mesures;
}

// Alertes
export const ALERTES = [
  { id: 1, type: 'peremption', entrepot_id: 1, lot_id: 'BR-2023-014', message: 'Lot stocke depuis plus de 365 jours.',        email_envoye: true,  email_destinataire: 'responsable.bresil@futurekawa.com',   created_at: daysAgo(55) },
  { id: 2, type: 'peremption', entrepot_id: 5, lot_id: 'CO-2023-007', message: 'Lot stocke depuis plus de 365 jours.',        email_envoye: true,  email_destinataire: 'responsable.colombie@futurekawa.com', created_at: daysAgo(30) },
  { id: 3, type: 'hors_plage', entrepot_id: 3, lot_id: 'EQ-2023-022', message: 'Humidite hors plage : 64.2% (max 62%).',      email_envoye: true,  email_destinataire: 'responsable.equateur@futurekawa.com', created_at: daysAgo(12) },
  { id: 4, type: 'hors_plage', entrepot_id: 6, lot_id: 'CO-2024-011', message: 'Temperature hors plage : 30.1°C (max 29°C).', email_envoye: true,  email_destinataire: 'responsable.colombie@futurekawa.com', created_at: daysAgo(7) },
  { id: 5, type: 'hors_plage', entrepot_id: 6, lot_id: 'CO-2024-011', message: 'Temperature hors plage : 29.8°C (max 29°C).', email_envoye: false, email_destinataire: 'responsable.colombie@futurekawa.com', created_at: daysAgo(2) },
  { id: 6, type: 'hors_plage', entrepot_id: 3, lot_id: 'EQ-2023-022', message: 'Humidite hors plage : 63.1% (max 62%).',      email_envoye: true,  email_destinataire: 'responsable.equateur@futurekawa.com', created_at: daysAgo(1) }
];

// ---- Helpers (mimique d'une couche service / future API) -----------------

export function getPays() {
  return PAYS;
}

export function getPaysByCode(code) {
  return PAYS.find((p) => p.code === code) || null;
}

export function getEntrepotById(id) {
  return ENTREPOTS.find((e) => e.id === id) || null;
}

export function getEntrepotsByPays(paysCode) {
  return ENTREPOTS.filter((e) => e.pays === paysCode);
}

// FIFO : date_stockage ASC (les plus anciens d'abord)
export function getLots({ pays = null } = {}) {
  let lots = LOTS.map((l) => {
    const entrepot = getEntrepotById(l.entrepot_id);
    return {
      ...l,
      entrepot_code: entrepot.code,
      entrepot_nom: entrepot.nom,
      pays: entrepot.pays,
      pays_label: getPaysByCode(entrepot.pays).label,
      age_jours: Math.floor((NOW - l.date_stockage) / (1000 * 60 * 60 * 24))
    };
  });
  if (pays) lots = lots.filter((l) => l.pays === pays);
  lots.sort((a, b) => a.date_stockage - b.date_stockage);
  return lots;
}

export function getLotById(id) {
  const l = LOTS.find((x) => x.id === id);
  if (!l) return null;
  const entrepot = getEntrepotById(l.entrepot_id);
  const paysObj = getPaysByCode(entrepot.pays);
  return {
    ...l,
    entrepot,
    pays: paysObj,
    age_jours: Math.floor((NOW - l.date_stockage) / (1000 * 60 * 60 * 24))
  };
}

export function getAlertes({ pays = null, type = null } = {}) {
  let alertes = ALERTES.map((a) => {
    const entrepot = getEntrepotById(a.entrepot_id);
    return {
      ...a,
      entrepot_code: entrepot?.code,
      entrepot_nom: entrepot?.nom,
      pays: entrepot?.pays,
      pays_label: entrepot ? getPaysByCode(entrepot.pays).label : null
    };
  });
  if (pays) alertes = alertes.filter((a) => a.pays === pays);
  if (type) alertes = alertes.filter((a) => a.type === type);
  alertes.sort((a, b) => b.created_at - a.created_at);
  return alertes;
}

export function getAlertesByLot(lotId) {
  return getAlertes().filter((a) => a.lot_id === lotId);
}

export function getKpis() {
  const lots = getLots();
  return {
    total_lots: lots.length,
    lots_en_alerte: lots.filter((l) => l.statut === 'en_alerte').length,
    lots_perimes: lots.filter((l) => l.statut === 'perime').length,
    alertes_actives: ALERTES.length
  };
}

// Synthese par pays pour la home
export function getPaysStats(paysCode) {
  const lots = getLots({ pays: paysCode });
  const entrepots = getEntrepotsByPays(paysCode);
  const pays = getPaysByCode(paysCode);
  // Derniere mesure moyenne approximative : on prend la derniere du lot le plus recent
  const recent = lots[lots.length - 1];
  let derniere = null;
  if (recent) {
    const mesures = getMesuresByLot(recent.id);
    derniere = mesures[mesures.length - 1] || null;
  }
  const enAlerte = lots.filter((l) => l.statut === 'en_alerte').length;
  const perimes = lots.filter((l) => l.statut === 'perime').length;
  let etat = 'ok';
  if (perimes > 0) etat = 'critique';
  else if (enAlerte > 0) etat = 'attention';
  return {
    pays,
    nb_entrepots: entrepots.length,
    nb_lots: lots.length,
    nb_en_alerte: enAlerte,
    nb_perimes: perimes,
    derniere_mesure: derniere,
    etat
  };
}
