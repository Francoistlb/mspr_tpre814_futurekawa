import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import StatusBadge, { AlerteTypeBadge } from '../components/StatusBadge';
import MesuresChart from '../components/MesuresChart';
import { PAYS } from '../data/mockData';
import { fetchStocks, fetchMesures, fetchAlertes } from '../api';
import { formatDate, formatDateTime } from '../utils/format';

export default function LotDetail() {
  const { id } = useParams();
  const [lot,     setLot]     = useState(null);
  const [mesures, setMesures] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetchStocks()
      .then((lots) => {
        const found = lots.find((l) => l.id === id);
        if (!found) { setError('Lot introuvable'); return; }
        setLot(found);
        return Promise.all([
          fetchMesures(found.pays, found.id),
          fetchAlertes(),
        ]).then(([m, a]) => ({ lot: found, mesures: m, alertes: a }));
      })
      .then((res) => {
        if (!res) return;
        const { lot, mesures: m, alertes: a } = res;
        setMesures(m);
        // Alertes liées : par lot_id direct OU par entrepôt depuis la date de stockage
        const dateStockage = new Date(lot.date_stockage);
        setAlertes(a.filter((al) =>
          al.lot_id === id ||
          (al.entrepot_code === lot.entrepot_code && new Date(al.created_at) >= dateStockage)
        ));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <><Link to="/stocks" className="back-link">← Retour aux stocks</Link><div className="empty">Chargement...</div></>;
  if (error || !lot) return (
    <>
      <Link to="/stocks" className="back-link">← Retour aux stocks</Link>
      <div className="card card-pad empty">Lot <strong>{id}</strong> introuvable.</div>
    </>
  );

  const paysInfo = PAYS.find((p) => p.code === lot.pays);

  return (
    <>
      <Link to="/stocks" className="back-link">← Retour aux stocks</Link>

      <div className="lot-header">
        <div className="lot-header-info">
          <h1>{lot.id}</h1>
          <div className="lot-meta">
            <div><span>Pays</span><span>{lot.pays_label}</span></div>
            <div><span>Entrepôt</span><span>{lot.entrepot_code} — {lot.entrepot_nom}</span></div>
            <div><span>Date de stockage</span><span>{formatDate(lot.date_stockage)}</span></div>
            <div><span>Âge</span><span>{lot.age_jours} j</span></div>
            {lot.notes && <div><span>Notes</span><span>{lot.notes}</span></div>}
          </div>
        </div>
        <div><StatusBadge statut={lot.statut} /></div>
      </div>

      {paysInfo && (
        <div className="charts-grid">
          <div className="card chart-box">
            <div className="chart-box-head">
              <h3>Température</h3>
              <span className="ideal">Idéal {paysInfo.temp_ideale}°C · tolérance ±{paysInfo.tolerance_temp}°C</span>
            </div>
            <MesuresChart
              mesures={mesures}
              kind="temp"
              ideal={paysInfo.temp_ideale}
              tolerance={paysInfo.tolerance_temp}
              unit="°C"
              color="#6f4e37"
            />
          </div>

          <div className="card chart-box">
            <div className="chart-box-head">
              <h3>Humidité</h3>
              <span className="ideal">Idéal {paysInfo.hum_ideale}% · tolérance ±{paysInfo.tolerance_hum}%</span>
            </div>
            <MesuresChart
              mesures={mesures}
              kind="hum"
              ideal={paysInfo.hum_ideale}
              tolerance={paysInfo.tolerance_hum}
              unit="%"
              color="#3b82f6"
            />
          </div>
        </div>
      )}

      {paysInfo && (
        <div className="card conditions-card">
          <div className="card-title">
            Conditions idéales — {paysInfo.label}
            <span className="meta">{mesures.length} mesure(s) enregistrée(s)</span>
          </div>
          <div className="conditions-grid">
            <div><span>Température idéale</span><span>{paysInfo.temp_ideale}°C</span></div>
            <div><span>Tolérance temp.</span><span>±{paysInfo.tolerance_temp}°C</span></div>
            <div><span>Humidité idéale</span><span>{paysInfo.hum_ideale}%</span></div>
            <div><span>Tolérance hum.</span><span>±{paysInfo.tolerance_hum}%</span></div>
            <div><span>Responsable</span><span>{paysInfo.responsable_email}</span></div>
          </div>
        </div>
      )}

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
              <li key={`${a.pays}-${a.id}`}>
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
