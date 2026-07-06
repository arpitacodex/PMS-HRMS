import { statusColor } from "@/lib/payrollApi";

export default function StatusBadge({ status }) {
  const c = statusColor(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
    </span>
  );
}