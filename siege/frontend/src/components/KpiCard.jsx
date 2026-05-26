export default function KpiCard({ label, value, hint, tone }) {
  const cls = tone ? `kpi kpi-${tone}` : 'kpi';
  return (
    <div className={cls}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}
