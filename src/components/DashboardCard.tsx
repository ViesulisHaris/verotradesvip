interface Props {
  title: string;
  value: string;
}

export default function DashboardCard({ title, value }: Props) {
  const isNegative = value.startsWith('-');
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-value" style={{ color: isNegative ? 'var(--rust-red)' : 'var(--dusty-gold)' }}>
        {value}
      </div>
    </div>
  );
}
