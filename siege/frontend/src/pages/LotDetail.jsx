import { Link, useParams } from 'react-router-dom';
import StatusBadge, { AlerteTypeBadge } from '../components/StatusBadge';
import MesuresChart from '../components/MesuresChart';
import { getLotById, getMesuresByLot, getAlertesByLot } from '../data/mockData';
import { formatDate, formatDateTime } from '../utils/format';

export default function LotDetail() {
  const { id } = useParams();
  const lot = getLotById(id);

  if (!lot) {
    return (
      <>
        <Link to="/stocks" className="back-link">← Retour aux stocks</Link>
        <div className="card card-pad empty">
          Lot <strong>{id}</strong> introuvable.
        </div>
      </>
    );
  }

  const mesures = getMesuresByLot(lot.id);
  const alertes = getAlertesByLot(lot.id);
  const pays = lot.pays;

  return (
    <>
      <Link to="/stocks" className="back-link">← Retour aux stocks</Link>

      <div className="lot-header">
        <div className="lot-header-info">
          <h1>{lot.id}</h1>
          <div className="lot-meta">
            <div><span>Pays</span><span>{pays.label}</span></div>
            <div><span>Entrepôt</span><span>{lot.entrepot.code} — {lot.entrepot.nom}</span></div>
            <div><span>Exploitation</span><span>{lot.entrepot.exploitation}</span></div>
            <div><span>Date de stockage</span><span>{formatDate(lot.date_stockage)}</span></div>
            <div><span>Âge</span><span>{lot.age_jours} j</span></div>
          </div>
        </div>
        <div><StatusBadge statut={lot.statut} /></div>
      </div>

      <div className="charts-grid">
        <div className="card chart-box">
          <div className="chart-box-head">
            <h3>Température</h3>
            <span className="ideal">Idéal {pays.temp_ideale}°C · tolérance ±{pays.tolerance_temp}°C</span>
          </div>
          <MesuresChart
            mesures={mesures}
            kind="temp"
            ideal={pays.temp_ideale}
            tolerance={pays.tolerance_temp}
            unit="°C"
            color="#6f4e37"
          />
        </div>

        <div className="card chart-box">
          <div className="chart-box-head">
            <h3>Humidité</h3>
            <span className="ideal">Idéal {pays.hum_ideale}% · tolérance ±{pays.tolerance_hum}%</span>
          </div>
          <MesuresChart
            mesures={mesures}
            kind="hum"
            ideal={pays.hum_ideale}
            tolerance={pays.tolerance_hum}
            unit="%"
            color="#3b82f6"
          />
        </div>
      </div>

      <div className="card conditions-card">
        <div className="card-title">
          Conditions idéales — {pays.label}
          <span className="meta">{mesures.length} mesures sur {lot.age_jours} jours</span>
        </div>
        <div className="conditions-grid">
          <div><span>Température idéale</span><span>{pays.temp_ideale}°C</span></div>
          <div><span>Tolérance temp.</span><span>±{pays.tolerance_temp}°C</span></div>
          <div><span>Humidité idéale</span><span>{pays.hum_ideale}%</span></div>
          <div><span>Tolérance hum.</span><span>±{pays.tolerance_hum}%</span></div>
          <div><span>Responsable</span><span>{pays.responsable_email}</span></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-title">
          Alertes liées
          <span className="meta">{alertes.length} alerte(s)</span>
        </div>
        {alertes.length === 0 ? (
          <div className="empty">Aucune alerte sur ce lot.</div>
        ) : (
          <ul className="alert-list">
            {alertes.map((a) => (
              <li key={a.id}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
                  <AlerteTypeBadge type={a.type} />
                  <div className="alert-msg">{a.message}</div>
                </div>
                <div className="alert-meta">
                  {a.email_envoye ? '✓ email envoyé' : '⏳ en attente'} · {formatDateTime(a.created_at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
