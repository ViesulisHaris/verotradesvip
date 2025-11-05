interface Props {
  title: string;
  value: string;
}

export default function DashboardCard({ title, value }: Props) {
  const isNegative = value.startsWith('-');
  return (
    <div className="glass p-5 rounded-xl">
      <h3 className="text-sm font-medium text-white/80">{title}</h3>
      <p className={`mt-2 text-2xl font-bold ${isNegative ? 'text-red-400' : 'text-green-400'}`}>{value}</p>
    </div>
  );
}
