import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import KpiCard from '../components/KpiCard';
import { AlerteTypeBadge } from '../components/StatusBadge';
import MesuresChart from '../components/MesuresChart';
import { PAYS } from '../data/mockData';
import { fetchStocks, fetchAlertes, fetchMesuresPays } from '../api';
import { formatDateTime } from '../utils/format';

function computeKpis(lots, alertes) {
  return {
    total_lots:      lots.length,
    lots_en_alerte:  lots.filter((l) => l.statut === 'en_alerte').length,
    lots_perimes:    lots.filter((l) => l.statut === 'perime').length,
    alertes_actives: alertes.length,
  };
}

function computePaysStats(paysCode, lots) {
  const lotsP   = lots.filter((l) => l.pays === paysCode);
  const entrepots = [...new Set(lotsP.map((l) => l.entrepot_code))];
  const enAlerte  = lotsP.filter((l) => l.statut === 'en_alerte').length;
  const perimes   = lotsP.filter((l) => l.statut === 'perime').length;
  let etat = 'ok';
  if (perimes > 0)   etat = 'critique';
  else if (enAlerte > 0) etat = 'attention';
  return { nb_entrepots: entrepots.length, nb_lots: lotsP.length, nb_en_alerte: enAlerte, nb_perimes: perimes, etat };
}

export default function Dashboard() {
  const [lots,          setLots]         = useState([]);
  const [alertes,       setAlertes]      = useState([]);
  const [mesuresParPays, setMesures]     = useState({});
  const [paysActif,     setPaysActif]    = useState(PAYS[0].code);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState(null);

  useEffect(() => {
    Promise.all([
      fetchStocks(),
      fetchAlertes(),
      ...PAYS.map((p) => fetchMesuresPays(p.code).then((data) => ({ code: p.code, data }))),
    ])
      .then(([l, a, ...mesResults]) => {
        setLots(l);
        setAlertes(a);
        const map = {};
        mesResults.forEach(({ code, data }) => { map[code] = data; });
        setMesures(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty">Chargement...</div>;
  if (error)   return <div className="empty" style={{ color: 'var(--err)' }}>Erreur : {error}</div>;

  const kpis           = computeKpis(lots, alertes);
  const alertesRecentes = alertes.slice(0, 5);
  const paysActifInfo  = PAYS.find((p) => p.code === paysActif);
  const mesuresActives = mesuresParPays[paysActif] || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <div className="subtitle">Vue consolidée des stocks et conditions de stockage</div>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Lots en stock"   value={kpis.total_lots}       hint="Tous pays confondus" />
        <KpiCard label="Lots en alerte"  value={kpis.lots_en_alerte}   tone="warn" hint="Conditions hors plage" />
        <KpiCard label="Lots périmés"    value={kpis.lots_perimes}      tone="err"  hint="> 365 jours de stockage" />
        <KpiCard label="Alertes actives" value={kpis.alertes_actives}   tone={kpis.alertes_actives > 0 ? 'warn' : 'ok'} hint="Toutes alertes confondues" />
      </div>

      <section className="section">
        <h2 className="section-title">Par pays</h2>
        <div className="pays-grid">
          {PAYS.map((p) => {
            const s = computePaysStats(p.code, lots);
            return (
              <div key={p.code} className={`pays-card state-${s.etat}`}>
                <div className="pays-card-head">
                  <h3>{p.label}</h3>
                  <span className="flag">{p.flag}</span>
                </div>
                <div className="pays-card-stats">
                  <div><span>Entrepôts</span><span>{s.nb_entrepots}</span></div>
                  <div><span>Lots</span><span>{s.nb_lots}</span></div>
                  <div><span>Idéal</span><span>{p.temp_ideale}°C / {p.hum_ideale}%</span></div>
                  <div><span>Tolérance</span><span>±{p.tolerance_temp}°C / ±{p.tolerance_hum}%</span></div>
                </div>
                <div className="pays-card-state">
                  <span className="dot" />
                  {s.etat === 'ok'        && 'Conditions nominales'}
                  {s.etat === 'attention' && `${s.nb_en_alerte} lot(s) en alerte`}
                  {s.etat === 'critique'  && `${s.nb_perimes} lot(s) périmé(s)`}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Graphiques IoT par pays ---- */}
      <section className="section">
        <div className="card">
          <div className="card-title">
            Conditions IoT — mesures capteurs
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {PAYS.map((p) => (
                <button
                  key={p.code}
                  onClick={() => setPaysActif(p.code)}
                  className={`btn btn-sm${paysActif === p.code ? ' btn-active' : ''}`}
                >
                  {p.flag}
                </button>
              ))}
            </div>
          </div>

          {mesuresActives.length === 0 ? (
            <div className="empty">Aucune mesure IoT enregistrée pour {paysActifInfo?.label}.</div>
          ) : (
            <div className="charts-grid" style={{ marginTop: '1rem' }}>
              <div className="chart-box">
                <div className="chart-box-head">
                  <h3>Température — {paysActifInfo?.label}</h3>
                  <span className="ideal">
                    Idéal {paysActifInfo?.temp_ideale}°C · ±{paysActifInfo?.tolerance_temp}°C
                  </span>
                </div>
                <MesuresChart
                  mesures={mesuresActives}
                  kind="temp"
                  ideal={paysActifInfo?.temp_ideale}
                  tolerance={paysActifInfo?.tolerance_temp}
                  unit="°C"
                  color="#6f4e37"
                />
              </div>

              <div className="chart-box">
                <div className="chart-box-head">
                  <h3>Humidité — {paysActifInfo?.label}</h3>
                  <span className="ideal">
                    Idéal {paysActifInfo?.hum_ideale}% · ±{paysActifInfo?.tolerance_hum}%
                  </span>
                </div>
                <MesuresChart
                  mesures={mesuresActives}
                  kind="hum"
                  ideal={paysActifInfo?.hum_ideale}
                  tolerance={paysActifInfo?.tolerance_hum}
                  unit="%"
                  color="#3b82f6"
                />
              </div>
            </div>
          )}

          <div className="cell-muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
            {mesuresActives.length} mesure(s) — entrepôts :{' '}
            {[...new Set(mesuresActives.map((m) => m.entrepot_code))].join(', ') || '—'}
          </div>
        </div>
      </section>

      {/* ---- Alertes récentes ---- */}
      <section className="section">
        <div className="card">
          <div className="card-title">
            Alertes récentes
            <Link to="/alertes" className="meta">Voir tout →</Link>
          </div>
          {alertesRecentes.length === 0 ? (
            <div className="empty">Aucune alerte active.</div>
          ) : (
            <ul className="alert-list">
              {alertesRecentes.map((a) => (
                <li key={`${a.pays}-${a.id}`}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
                    <AlerteTypeBadge type={a.type} />
                    <div className="alert-msg">
                      <strong>{a.pays_label}</strong> · {a.entrepot_code}
                      {a.lot_id && <> · lot <Link to={`/lots/${encodeURIComponent(a.lot_id)}`}>{a.lot_id}</Link></>}
                      <div className="cell-muted" style={{ fontSize: '0.78rem' }}>{a.message}</div>
                    </div>
                  </div>
                  <div className="alert-meta">{formatDateTime(a.created_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
