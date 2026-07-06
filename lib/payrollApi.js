const BASE = "http://localhost:8080/api";

export const getToken  = () => typeof window !== "undefined" ? localStorage.getItem("token")  : "";
export const getUserId = () => typeof window !== "undefined" ? localStorage.getItem("userId") : "";
export const getRole   = () => typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── Generic response unwrappers ────────────────────────────────────────────
export function unwrapOne(res) {
  if (!res) return null;
  if (res.data && !Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data) && res.data.length) return res.data[0];
  if (res.payroll) return res.payroll;
  if (res.id != null && res.user_id != null) return res;
  return null;
}

export function unwrapMany(res) {
  if (!res) return [];
  if (Array.isArray(res.data))    return res.data;
  if (Array.isArray(res.users))   return res.users;
  if (Array.isArray(res.details)) return res.details;
  if (Array.isArray(res))         return res;
  return [];
}

// ── Payroll API ────────────────────────────────────────────────────────────
export const fetchAllPayrolls    = ()    => fetch(`${BASE}/payrolls`,                  { headers: authHeaders() }).then(r => r.json());
export const fetchMyPayrolls     = ()    => fetch(`${BASE}/payrolls/my`,               { headers: authHeaders() }).then(r => r.json());
export const fetchPayrollById    = (id)  => fetch(`${BASE}/payrolls/${id}`,            { headers: authHeaders() }).then(r => r.json());
export const fetchPayrollDetails = (id)  => fetch(`${BASE}/payrolls/details/${id}`,   { headers: authHeaders() }).then(r => r.json());
export const fetchPayrollByUser  = (uid) => fetch(`${BASE}/payrolls/user/${uid}`,      { headers: authHeaders() }).then(r => r.json());
export const fetchAllUsers       = ()    => fetch(`${BASE}/auth/all`,                  { headers: authHeaders() }).then(r => r.json());

export const generatePayroll = (payload) =>
  fetch(`${BASE}/payrolls/generate`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
  }).then(r => r.json());

// Bulk generate — backend endpoint is commented out, so we call /generate per user
export const generateBulkPayroll = async (userIds, month, year, onProgress) => {
  const results = [];
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    try {
      const res = await fetch(`${BASE}/payrolls/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ user_id: userId, month, year }),
      }).then(r => r.json());
      results.push({ userId, success: true, data: res });
    } catch (err) {
      results.push({ userId, success: false, error: err?.message || "Failed" });
    }
    if (onProgress) onProgress(i + 1, userIds.length, results[results.length - 1]);
  }
  return results;
};

export const recalculatePayroll = (id) =>
  fetch(`${BASE}/payrolls/recalculate/${id}`, {
    method: "POST", headers: authHeaders(),
  }).then(r => r.json());

export const payPayroll = (id, payload) =>
  fetch(`${BASE}/payrolls/${id}/pay`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
  }).then(r => r.json());

export const deletePayroll = (id) =>
  fetch(`${BASE}/payrolls/delete/${id}`, {
    method: "DELETE", headers: authHeaders(),
  }).then(r => r.json());

// ── Helpers ────────────────────────────────────────────────────────────────
export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const statusColor = (status) => {
  switch (status) {
    case "paid":      return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
    case "processed": return { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    };
    case "pending":   return { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   };
    case "failed":    return { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500"     };
    default:          return { bg: "bg-gray-50",    text: "text-gray-700",    dot: "bg-gray-400"    };
  }
};

export const fmt = (val) =>
  Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });