import { useState } from 'react';
import { Link } from 'react-router-dom';
import PaysSelector from '../components/PaysSelector';
import StatusBadge from '../components/StatusBadge';
import { getLots } from '../data/mockData';
import { formatDate } from '../utils/format';

export default function Stocks() {
  const [pays, setPays] = useState(null);
  const lots = getLots({ pays });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Stocks</h1>
          <div className="subtitle">Lots triés par date de stockage (FIFO — plus ancien d'abord)</div>
        </div>
        <PaysSelector value={pays} onChange={setPays} />
      </div>

      <div className="table-wrap">
        {lots.length === 0 ? (
          <div className="empty">Aucun lot pour ce pays.</div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Pays</th>
                <th>Entrepôt</th>
                <th>Date stockage</th>
                <th className="cell-num">Âge</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lots.map((l) => {
                let rowCls = '';
                if (l.statut === 'en_alerte') rowCls = 'row-warn';
                if (l.statut === 'perime')    rowCls = 'row-err';
                return (
                  <tr key={l.id} className={rowCls}>
                    <td className="cell-mono">{l.id}</td>
                    <td>{l.pays_label}</td>
                    <td>
                      {l.entrepot_code}
                      <span className="cell-muted"> — {l.entrepot_nom}</span>
                    </td>
                    <td>{formatDate(l.date_stockage)}</td>
                    <td className="cell-num">{l.age_jours} j</td>
                    <td><StatusBadge statut={l.statut} /></td>
                    <td>
                      <Link to={`/lots/${l.id}`} className="btn btn-sm">
                        Détail →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
