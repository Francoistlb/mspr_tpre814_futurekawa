import { PAYS } from '../data/mockData';

export default function PaysSelector({ value, onChange, includeAll = true }) {
  return (
    <div className="pays-selector" role="tablist">
      {includeAll && (
        <button
          className={value === null ? 'active' : ''}
          onClick={() => onChange(null)}
          role="tab"
          aria-selected={value === null}
        >
          Tous
        </button>
      )}
      {PAYS.map((p) => (
        <button
          key={p.code}
          className={value === p.code ? 'active' : ''}
          onClick={() => onChange(p.code)}
          role="tab"
          aria-selected={value === p.code}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
