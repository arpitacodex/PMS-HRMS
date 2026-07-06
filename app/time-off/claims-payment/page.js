"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BadgeDollarSign, Eye, CheckCircle2, XCircle,
  Loader2, RefreshCw, Search, AlertTriangle,
  TrendingUp, Clock, Wallet, Receipt
} from "lucide-react";
import { authFetch, API_CLAIMS, isFinance, StatusBadge, fmt, fmtDate } from "@/components/claims/claimUtils";
import ViewClaimModal from "@/components/claims/ViewClaimModal";

/* ── Confirm Pay Modal ────────────────────────────────────────────────────── */
function ConfirmPayModal({ claim, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setSaving(true);
    setErr("");
    try {
      const res = await authFetch(`${API_CLAIMS}/mark-paid/${claim.id}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErr(data.message || "Failed to mark as paid");
      }
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm pointer-events-auto">
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <BadgeDollarSign size={26} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Mark as Paid</h3>
              <p className="text-gray-500 text-sm mt-1">
                Confirm payment of <strong className="text-gray-800">{fmt(claim.amount)}</strong> to{" "}
                <strong className="text-gray-800">
                  {claim.user ? `${claim.user.first_name} ${claim.user.last_name || ""}`.trim() : `User #${claim.user_id}`}
                </strong>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Claim #{claim.id} — {claim.claim_type?.name}
              </p>
            </div>

            {err && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                <AlertTriangle size={14} className="shrink-0" /> {err}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-left">
              <div className="flex items-start gap-2 text-amber-700 text-xs">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>This action is irreversible. The claim status will be changed to <strong>Paid</strong>.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-medium transition-colors"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Processing…" : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Toast ────────────────────────────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium pointer-events-auto
            ${t.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
        >
          {t.type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function ClaimsPaymentPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewClaim, setViewClaim] = useState(null);
  const [payClaim, setPayClaim] = useState(null);
  const [filter, setFilter] = useState("approved"); // default to approved
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState([]);

  const toast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message: msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both approved + paid for this page
      const [approvedRes, paidRes] = await Promise.all([
        authFetch(`${API_CLAIMS}/?status=approved`),
        authFetch(`${API_CLAIMS}/?status=paid`),
      ]);
      const [approvedData, paidData] = await Promise.all([approvedRes.json(), paidRes.json()]);
      const all = [
        ...(approvedData.success ? approvedData.data : []),
        ...(paidData.success ? paidData.data : []),
      ];
      setClaims(all);
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const stats = {
    pendingPayment: claims.filter((c) => c.status === "approved").length,
    paid: claims.filter((c) => c.status === "paid").length,
    pendingAmount: claims.filter((c) => c.status === "approved").reduce((s, c) => s + Number(c.amount || 0), 0),
    paidAmount: claims.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount || 0), 0),
  };

  const filtered = claims.filter((c) => {
    const matchFilter = filter === "all" || c.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.claim_type?.name?.toLowerCase().includes(q) ||
      `${c.user?.first_name} ${c.user?.last_name}`.toLowerCase().includes(q) ||
      String(c.id).includes(q);
    return matchFilter && matchSearch;
  });

  return (
   <div className="min-h-screen bg-gray-50 [color-scheme:light] text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
              <Wallet size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight">
                Claims Payment
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Process approved claim disbursements</p>
            </div>
          </div>
          <button
            onClick={fetchClaims}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

   <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-gray-50">
        {/* Stats banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Clock, label: "Awaiting Payment", value: stats.pendingPayment, color: "text-amber-600", bg: "bg-amber-50" },
            { icon: BadgeDollarSign, label: "Pending Amount", value: fmt(stats.pendingAmount), color: "text-orange-600", bg: "bg-orange-50" },
            { icon: CheckCircle2, label: "Paid Claims", value: stats.paid, color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: TrendingUp, label: "Total Disbursed", value: fmt(stats.paidAmount), color: "text-blue-600", bg: "bg-blue-50" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pending payment highlight */}
        {stats.pendingPayment > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg p-4 sm:p-5 flex items-center justify-between text-white shadow-md">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Pending Disbursement</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{fmt(stats.pendingAmount)}</p>
              <p className="text-emerald-100 text-xs mt-1">
                {stats.pendingPayment} approved claim{stats.pendingPayment > 1 ? "s" : ""} awaiting payment
              </p>
            </div>
            <BadgeDollarSign size={48} className="text-emerald-200 opacity-60" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee, claim type…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>
          <div className="flex gap-1.5 bg-white border border-gray-200 rounded-lg p-1 shrink-0">
            {[
              { key: "approved", label: "Awaiting" },
              { key: "paid", label: "Paid" },
              { key: "all", label: "All" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all
                  ${filter === key ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 size={28} className="animate-spin text-emerald-400" />
            <span className="text-sm">Loading payment data…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Wallet size={24} className="text-emerald-400" />
            </div>
            <p className="text-gray-600 font-semibold">No claims to show</p>
            <p className="text-gray-400 text-sm">
              {filter === "approved" ? "No approved claims awaiting payment" : "Try a different filter"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Employee", "Claim Type", "Project", "Claim Date", "Amount", "Approved By", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{c.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold shrink-0">
                            {(c.user?.first_name?.[0] || "?").toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-700">
                            {c.user ? `${c.user.first_name} ${c.user.last_name || ""}`.trim() : `User #${c.user_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{c.claim_type?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{c.project?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{fmtDate(c.claim_date)}</td>
                      <td className="px-4 py-3 font-bold text-gray-700 text-base">{fmt(c.amount)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {c.reviewer ? `${c.reviewer.first_name}` : "—"}
                        {c.reviewed_at && <span className="block text-gray-400">{fmtDate(c.reviewed_at)}</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <ActionBtn icon={Eye} onClick={() => setViewClaim(c)} title="View" color="slate" />
                          {c.status === "approved" && isFinance() && (
                            <ActionBtn icon={BadgeDollarSign} onClick={() => setPayClaim(c)} title="Mark Paid" color="green" />
                          )}
                        </div>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((c) => (
                <PaymentMobileCard
                  key={c.id}
                  claim={c}
                  onView={() => setViewClaim(c)}
                  onPay={() => setPayClaim(c)}
                />
              ))}
            </div>

            <p className="text-xs text-gray-400 text-right">Showing {filtered.length} claims</p>
          </>
        )}
      </main>

      {viewClaim && <ViewClaimModal claim={viewClaim} onClose={() => setViewClaim(null)} />}
      {payClaim && (
        <ConfirmPayModal
          claim={payClaim}
          onClose={() => setPayClaim(null)}
          onSuccess={() => {
            toast("Claim marked as paid!");
            fetchClaims();
          }}
        />
      )}
      <Toast toasts={toasts} />
    </div>
  );
}

function ActionBtn({ icon: Icon, onClick, title, color }) {
  const colors = {
    slate: "bg-gray-50 hover:bg-gray-100 text-gray-500",
    green: "bg-emerald-50 hover:bg-emerald-100 text-emerald-600",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${colors[color]}`}
    >
      <Icon size={13} />
    </button>
  );
}

function PaymentMobileCard({ claim: c, onView, onPay }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">
            {(c.user?.first_name?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-700">
              {c.user ? `${c.user.first_name} ${c.user.last_name || ""}`.trim() : `User #${c.user_id}`}
            </p>
            <p className="text-xs text-gray-400">{c.claim_type?.name || "—"} • #{c.id}</p>
          </div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2.5">
        <span className="text-xs text-gray-500">Amount</span>
        <span className="text-lg font-bold text-gray-700">{fmt(c.amount)}</span>
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium transition-colors"
        >
          <Eye size={12} /> View
        </button>
        {c.status === "approved" && isFinance() && (
          <button
            onClick={onPay}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <BadgeDollarSign size={12} /> Mark Paid
          </button>
        )}
      </div>
    </div>
  );
}