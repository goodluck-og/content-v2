export function StatCard({
  value,
  label,
  accentClass = "text-lime",
}: {
  value: string;
  label: string;
  accentClass?: string;
}) {
  return (
    <div className="flex-1 bg-teal/20 rounded-card px-4 py-4">
      <p className="text-white text-2xl font-bold">{value}</p>
      <p className={`text-xs mt-1 ${accentClass}`}>{label}</p>
    </div>
  );
}
