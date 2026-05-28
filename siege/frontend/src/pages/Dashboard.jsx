import { Link } from 'react-router-dom';
import KpiCard from '../components/KpiCard';
import { AlerteTypeBadge } from '../components/StatusBadge';
import { getKpis, getPays, getPaysStats, getAlertes } from '../data/mockData';
import { formatDateTime } from '../utils/format';

export default function Dashboard() {
  const kpis = getKpis();
  const pays = getPays();
  const alertesRecentes = getAlertes().slice(0, 5);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <div className="subtitle">Vue consolidée des stocks et conditions de stockage</div>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Lots en stock"    value={kpis.total_lots} hint="Tous pays confondus" />
        <KpiCard label="Lots en alerte"   value={kpis.lots_en_alerte} tone="warn" hint="Conditions hors plage" />
        <KpiCard label="Lots périmés"     value={kpis.lots_perimes}   tone="err"  hint="> 365 jours de stockage" />
        <KpiCard label="Alertes actives"  value={kpis.alertes_actives} tone={kpis.alertes_actives > 0 ? 'warn' : 'ok'} hint="Toutes alertes confondues" />
      </div>

      <section className="section">
        <h2 className="section-title">Par pays</h2>
        <div className="pays-grid">
          {pays.map((p) => {
            const s = getPaysStats(p.code);
            return (
              <div key={p.code} className={`pays-card state-${s.etat}`}>
                <div className="pays-card-head">
                  <h3>{p.label}</h3>
                  <span className="flag">{p.flag}</span>
                </div>
                <div className="pays-card-stats">
                  <div><span>Entrepôts</span><span>{s.nb_entrepots}</span></div>
                  <div><span>Lots</span><span>{s.nb_lots}</span></div>
                  <div>
                    <span>Dernière temp.</span>
                    <span>{s.derniere_mesure ? `${s.derniere_mesure.temperature}°C` : '—'}</span>
                  </div>
                  <div>
                    <span>Dernière hum.</span>
                    <span>{s.derniere_mesure ? `${s.derniere_mesure.humidite}%` : '—'}</span>
                  </div>
                  <div><span>Idéal</span><span>{p.temp_ideale}°C / {p.hum_ideale}%</span></div>
                  <div><span>Tolérance</span><span>±{p.tolerance_temp}°C / ±{p.tolerance_hum}%</span></div>
                </div>
                <div className="pays-card-state">
                  <span className="dot" />
                  {s.etat === 'ok' && 'Conditions nominales'}
                  {s.etat === 'attention' && `${s.nb_en_alerte} lot(s) en alerte`}
                  {s.etat === 'critique' && `${s.nb_perimes} lot(s) périmé(s)`}
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
                <li key={a.id}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
                    <AlerteTypeBadge type={a.type} />
                    <div className="alert-msg">
                      <strong>{a.pays_label}</strong> · {a.entrepot_code} · lot <Link to={`/lots/${a.lot_id}`}>{a.lot_id}</Link>
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
