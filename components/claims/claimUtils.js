// ─── Auth helpers ────────────────────────────────────────────────────────────
export const getToken    = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");
export const getRole     = () => (typeof window !== "undefined" ? localStorage.getItem("role")  : "");
export const getUserId   = () => (typeof window !== "undefined" ? localStorage.getItem("userId") : "");
export const isAdminOrHR = () => ["admin", "hr", "project_manager"].includes((getRole() || "").toLowerCase());
export const isFinance   = () => ["admin", "hr", "finance"].includes((getRole() || "").toLowerCase());
export const isManager   = () => ["admin", "hr", "project_manager", "manager"].includes((getRole() || "").toLowerCase());

// ─── API base ────────────────────────────────────────────────────────────────
export const API_CLAIMS      = "http://localhost:8080/api/claims";
export const API_CLAIM_TYPES = "http://localhost:8080/api/claim-types";
export const API_PROJECTS    = "http://localhost:8080/api/projects";   // adjust if different

// ─── Auth fetch wrapper ──────────────────────────────────────────────────────
export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  return res;
}

// ─── Status config ───────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  pending:  { label: "Pending",  bg: "bg-amber-100",   text: "text-amber-700",  dot: "bg-amber-500"  },
  approved: { label: "Approved", bg: "bg-emerald-100", text: "text-emerald-700",dot: "bg-emerald-500" },
  rejected: { label: "Rejected", bg: "bg-rose-100",    text: "text-rose-600",   dot: "bg-rose-500"   },
  paid:     { label: "Paid",     bg: "bg-blue-100",    text: "text-blue-700",   dot: "bg-blue-500"   },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Format helpers ──────────────────────────────────────────────────────────
export const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";