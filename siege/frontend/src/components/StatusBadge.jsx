const STATUTS = {
  conforme:  { label: 'Conforme',  cls: 'badge-ok' },
  en_alerte: { label: 'En alerte', cls: 'badge-warn' },
  perime:    { label: 'Périmé',    cls: 'badge-err' }
};

export default function StatusBadge({ statut }) {
  const conf = STATUTS[statut] || { label: statut, cls: 'badge-neutral' };
  return (
    <span className={`badge ${conf.cls}`}>
      <span className="dot" /> {conf.label}
    </span>
  );
}

export function AlerteTypeBadge({ type }) {
  if (type === 'peremption') {
    return <span className="badge badge-err"><span className="dot" /> Péremption</span>;
  }
  if (type === 'hors_plage') {
    return <span className="badge badge-warn"><span className="dot" /> Hors plage</span>;
  }
  return <span className="badge badge-neutral">{type}</span>;
}
