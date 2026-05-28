import { useState } from 'react';
import { Link } from 'react-router-dom';
import PaysSelector from '../components/PaysSelector';
import { AlerteTypeBadge } from '../components/StatusBadge';
import { getAlertes } from '../data/mockData';
import { formatDateTime } from '../utils/format';

export default function Alertes() {
  const [pays, setPays] = useState(null);
  const [type, setType] = useState('');
  const alertes = getAlertes({ pays, type: type || null });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Alertes</h1>
          <div className="subtitle">
            Dérives de conditions (hors plage) et lots dépassant 365 jours de stockage (péremption)
          </div>
        </div>
        <PaysSelector value={pays} onChange={setPays} />
      </div>

      <div className="filter-bar">
        <span className="filter-label">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tous</option>
          <option value="hors_plage">Hors plage</option>
          <option value="peremption">Péremption</option>
        </select>
        <span className="cell-muted">— {alertes.length} résultat(s)</span>
      </div>

      <div className="table-wrap">
        {alertes.length === 0 ? (
          <div className="empty">Aucune alerte ne correspond aux filtres.</div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Pays</th>
                <th>Entrepôt</th>
                <th>Lot</th>
                <th>Message</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {alertes.map((a) => (
                <tr key={a.id} className={a.type === 'peremption' ? 'row-err' : 'row-warn'}>
                  <td>{formatDateTime(a.created_at)}</td>
                  <td><AlerteTypeBadge type={a.type} /></td>
                  <td>{a.pays_label}</td>
                  <td>{a.entrepot_code}</td>
                  <td className="cell-mono">
                    <Link to={`/lots/${a.lot_id}`}>{a.lot_id}</Link>
                  </td>
                  <td>{a.message}</td>
                  <td>
                    {a.email_envoye
                      ? <span className="badge badge-ok"><span className="dot" /> Envoyé</span>
                      : <span className="badge badge-neutral">En attente</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
