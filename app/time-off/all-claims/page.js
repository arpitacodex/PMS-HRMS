"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye, CheckCircle, XCircle, Loader2, RefreshCw,
  Users, Clock, CheckCircle2, BadgeDollarSign, Filter,
  ChevronDown, MessageSquare, Search, SlidersHorizontal
} from "lucide-react";
import { authFetch, API_CLAIMS, isAdminOrHR, StatusBadge, fmt, fmtDate } from "@/components/claims/claimUtils";
import ViewClaimModal from "@/components/claims/ViewClaimModal";

/* ── Review Modal ─────────────────────────────────────────────────────────── */
function ReviewModal({ claim, onClose, onSuccess }) {
  const [status, setStatus] = useState("approved");
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setSaving(true);
    setErr("");
    try {
      const res = await authFetch(`${API_CLAIMS}/review/${claim.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review_comments: comments }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErr(data.message || "Review failed");
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
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md pointer-events-auto">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Review Claim #{claim.id}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {claim.user?.first_name} {claim.user?.last_name} — {fmt(claim.amount)} — {claim.claim_type?.name}
            </p>
          </div>
          <div className="p-6 space-y-4">
            {err && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {err}
              </div>
            )}
            {/* Decision */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: "approved", icon: CheckCircle, label: "Approve", bg: "bg-emerald-50 border-emerald-200 text-emerald-700", active: "bg-emerald-500 border-emerald-500 text-white" },
                { val: "rejected", icon: XCircle, label: "Reject", bg: "bg-red-50 border-red-200 text-red-600", active: "bg-red-500 border-red-500 text-white" },
              ].map(({ val, icon: Icon, label, bg, active }) => (
                <button
                  key={val}
                  onClick={() => setStatus(val)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all
                    ${status === val ? active : bg}`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
            {/* Comments */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <MessageSquare size={10} className="inline mr-1" />
                Comments <span className="font-normal normal-case text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add review notes…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 rounded-b-xl">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-medium transition-colors
                ${status === "approved" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}
                disabled:opacity-50`}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : `${status === "approved" ? "Approve" : "Reject"} Claim`}
            </button>
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
export default function AllClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewClaim, setViewClaim] = useState(null);
  const [reviewClaim, setReviewClaim] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
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
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await authFetch(`${API_CLAIMS}/${params}`);
      const data = await res.json();
      if (data.success) setClaims(data.data);
      else toast(data.message || "Failed to fetch", "error");
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const stats = {
    total: claims.length,
    pending: claims.filter((c) => c.status === "pending").length,
    approved: claims.filter((c) => c.status === "approved").length,
    paid: claims.filter((c) => c.status === "paid").length,
    totalAmt: claims.reduce((s, c) => s + Number(c.amount || 0), 0),
  };

  const filtered = claims.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.claim_type?.name?.toLowerCase().includes(q) ||
      `${c.user?.first_name} ${c.user?.last_name}`.toLowerCase().includes(q) ||
      c.project?.name?.toLowerCase().includes(q) ||
      String(c.id).includes(q)
    );
  });

  return (
   <div className="min-h-screen bg-gray-50 [color-scheme:light] text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight">All Claims</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Review and manage employee claims</p>
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
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Users, label: "Total Claims", value: stats.total, color: "text-orange-600", bg: "bg-orange-50" },
            { icon: Clock, label: "Pending Review", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50" },
            { icon: CheckCircle2, label: "Approved", value: stats.approved, color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: BadgeDollarSign, label: "Total Amount", value: fmt(stats.totalAmt), color: "text-blue-600", bg: "bg-blue-50" },
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

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee, type, project…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
          <div className="flex gap-1.5 bg-white border border-gray-200 rounded-lg p-1 overflow-x-auto shrink-0">
            {["all", "pending", "approved", "rejected", "paid"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize whitespace-nowrap transition-all
                  ${statusFilter === f ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 size={28} className="animate-spin text-orange-400" />
            <span className="text-sm">Loading claims…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold">No claims found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Employee", "Type", "Project", "Date", "Amount", "Status", "Applied", "Actions"].map((h) => (
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
                          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">
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
                      <td className="px-4 py-3 font-bold text-gray-700">{fmt(c.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(c.applied_at || c.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <ActionBtn icon={Eye} onClick={() => setViewClaim(c)} title="View" color="slate" />
                          {c.status === "pending" && isAdminOrHR() && (
                            <ActionBtn icon={CheckCircle} onClick={() => setReviewClaim(c)} title="Approve" color="green" />
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
                <AllClaimMobileCard
                  key={c.id}
                  claim={c}
                  onView={() => setViewClaim(c)}
                  onReview={() => setReviewClaim(c)}
                />
              ))}
            </div>

            <p className="text-xs text-gray-400 text-right">
              Showing {filtered.length} of {claims.length} claims
            </p>
          </>
        )}
      </main>

      {viewClaim && <ViewClaimModal claim={viewClaim} onClose={() => setViewClaim(null)} />}
      {reviewClaim && (
        <ReviewModal
          claim={reviewClaim}
          onClose={() => setReviewClaim(null)}
          onSuccess={() => {
            toast("Claim reviewed successfully");
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
    slate: "bg-gray-50 text-gray-500",
    orange: "bg-orange-50 text-orange-500",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
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

function AllClaimMobileCard({ claim: c, onView, onReview }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
            {(c.user?.first_name?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-700">
              {c.user ? `${c.user.first_name} ${c.user.last_name || ""}`.trim() : `User #${c.user_id}`}
            </p>
            <p className="text-xs text-gray-400">
              {c.claim_type?.name || "—"} • {fmtDate(c.claim_date)}
            </p>
          </div>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-700">{fmt(c.amount)}</span>
        <span className="text-xs text-gray-400">{c.project?.name || "No project"}</span>
      </div>
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium transition-colors"
        >
          <Eye size={12} /> View
        </button>
        {c.status === "pending" && isAdminOrHR() && (
          <button
            onClick={onReview}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-medium transition-colors"
          >
            <CheckCircle size={12} /> Review
          </button>
        )}
      </div>
    </div>
  );
}