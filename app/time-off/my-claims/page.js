"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Eye, Pencil, Trash2, Loader2, RefreshCw,
  Receipt, CheckCircle2, Clock, XCircle, BadgeDollarSign, Filter
} from "lucide-react";
import { authFetch, API_CLAIMS, StatusBadge, fmt, fmtDate } from "@/components/claims/claimUtils";
import ViewClaimModal from "@/components/claims/ViewClaimModal";
import ClaimDrawer from "@/components/claims/ClaimDrawer";

/* ── Toast ────────────────────────────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-5 sm:right-5 sm:left-auto z-[100] flex flex-col gap-2 max-w-full sm:max-w-xs pointer-events-none">
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

/* ── Delete Confirm ───────────────────────────────────────────────────────── */
function DeleteConfirm({ claim, onConfirm, onCancel, loading }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-sm pointer-events-auto text-center space-y-4 border border-gray-200">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Trash2 size={20} className="text-red-500 sm:text-2xl" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm sm:text-base">Delete Claim #{claim.id}?</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Only pending claims can be deleted. This cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 sm:py-2.5 rounded-lg border border-gray-200 text-gray-600 text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs sm:text-sm font-medium transition-colors"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    orange: { bg: "bg-orange-50", icon: "text-orange-500", val: "text-orange-600" },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-500",  val: "text-amber-600" },
    green:  { bg: "bg-emerald-50", icon: "text-emerald-500", val: "text-emerald-600" },
    blue:   { bg: "bg-blue-50",   icon: "text-blue-500",   val: "text-blue-600" },
    rose:   { bg: "bg-red-50",    icon: "text-red-500",    val: "text-red-600" },
  };
  const c = colors[color] || colors.orange;
  return (
    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-3">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={c.icon} />
      </div>
      <div>
        <p className={`text-base sm:text-xl font-bold ${c.val}`}>{value}</p>
        <p className="text-[10px] sm:text-xs text-gray-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function MyClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState({ open: false, data: null });
  const [viewClaim, setViewClaim] = useState(null);
  const [deleteClaim, setDeleteClaim] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [toasts, setToasts] = useState([]);
  const [projects, setProjects] = useState([]);

  const toast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message: msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_CLAIMS}/my-claims`);
      const data = await res.json();
      if (data.success) setClaims(data.data);
      else toast(data.message || "Failed to fetch", "error");
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await authFetch("http://localhost:8080/api/project/all");
        const data = await res.json();
        if (data.success) {
          setProjects(data.data);
        }
      } catch (err) {
        console.error("Project fetch error:", err);
      }
    };
    fetchProjects();
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(`${API_CLAIMS}/delete/${deleteClaim.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast("Claim deleted successfully");
        setDeleteClaim(null);
        fetchClaims();
      } else {
        toast(data.message || "Delete failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDrawerSuccess = (_, mode) => {
    toast(mode === "edit" ? "Claim updated!" : "Claim submitted!");
    fetchClaims();
  };

  // Stats
  const stats = {
    total: claims.length,
    pending: claims.filter((c) => c.status === "pending").length,
    approved: claims.filter((c) => c.status === "approved").length,
    paid: claims.filter((c) => c.status === "paid").length,
    rejected: claims.filter((c) => c.status === "rejected").length,
    totalAmt: claims.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount || 0), 0),
  };

  const filtered = filter === "all" ? claims : claims.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 [color-scheme:light] text-gray-900">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
              <Receipt size={16} className="text-white sm:text-lg" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 tracking-tight">My Claims</h1>
              <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">Track your reimbursement requests</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={fetchClaims}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            >
              <RefreshCw size={13} className="sm:text-sm" />
            </button>
            <button
              onClick={() => setDrawer({ open: true, data: null })}
              className="flex items-center gap-1.5 sm:gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <Plus size={14} className="sm:text-sm" />
              <span className="hidden sm:inline">Apply Claim</span>
              <span className="sm:hidden">Apply</span>
            </button>
          </div>
        </div>
      </div>

   <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-gray-50">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <StatCard icon={Receipt} label="Total" value={stats.total} color="orange" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color="amber" />
          <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} color="green" />
          <StatCard icon={BadgeDollarSign} label="Paid" value={stats.paid} color="blue" />
          <StatCard icon={XCircle} label="Rejected" value={stats.rejected} color="rose" />
        </div>

        {/* Paid summary */}
        {stats.totalAmt > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg p-3 sm:p-4 lg:p-5 flex items-center justify-between text-white shadow-md">
            <div>
              <p className="text-orange-100 text-[10px] sm:text-xs lg:text-sm font-medium">Total Reimbursed</p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold mt-0.5 sm:mt-1">{fmt(stats.totalAmt)}</p>
            </div>
            <BadgeDollarSign size={28} className="text-orange-200 opacity-60 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
          </div>
        )}

        {/* Filter tabs */}
        <div className="overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="flex gap-1.5 bg-white border border-gray-200 rounded-lg p-1 w-fit min-w-full sm:min-w-0">
            {["all", "pending", "approved", "rejected", "paid"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium capitalize whitespace-nowrap transition-all
                  ${filter === f 
                    ? "bg-orange-500 text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"}`}
              >
                {f} {f !== "all" && <span className="ml-0.5 sm:ml-1 opacity-70">({stats[f] ?? 0})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Table / Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-24 gap-3 text-gray-400">
            <Loader2 size={24} className="animate-spin text-orange-400 sm:w-7 sm:h-7" />
            <span className="text-xs sm:text-sm">Loading claims…</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onApply={() => setDrawer({ open: true, data: null })} filtered={filter !== "all"} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Type", "Project", "Date", "Amount", "Status", "Applied On", "Actions"].map((h) => (
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
                        <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                          {c.claim_type?.name || `Type #${c.claim_type_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs sm:text-sm">{c.project?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs sm:text-sm">{fmtDate(c.claim_date)}</td>
                      <td className="px-4 py-3 font-bold text-gray-800 text-xs sm:text-sm">{fmt(c.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-[10px] sm:text-xs">{fmtDate(c.applied_at || c.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <ActionBtn icon={Eye} onClick={() => setViewClaim(c)} title="View" color="slate" />
                          {c.status === "pending" && (
                            <>
                              <ActionBtn icon={Pencil} onClick={() => setDrawer({ open: true, data: c })} title="Edit" color="orange" />
                              <ActionBtn icon={Trash2} onClick={() => setDeleteClaim(c)} title="Delete" color="rose" />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden w-full space-y-3">
              {filtered.map((c) => (
                <MobileCard
                  key={c.id}
                  claim={c}
                  onView={() => setViewClaim(c)}
                  onEdit={() => setDrawer({ open: true, data: c })}
                  onDelete={() => setDeleteClaim(c)}
                />
              ))}
            </div>
            
            <p className="text-[10px] sm:text-xs text-gray-400 text-right">
              Showing {filtered.length} of {claims.length} claims
            </p>
          </>
        )}
      </main>

      {/* Drawer */}
      <ClaimDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, data: null })}
        onSuccess={handleDrawerSuccess}
        editData={drawer.data}
        projects={projects}
      />

      {/* Modals */}
      {viewClaim && <ViewClaimModal claim={viewClaim} onClose={() => setViewClaim(null)} />}
      {deleteClaim && <DeleteConfirm claim={deleteClaim} onConfirm={handleDelete} onCancel={() => setDeleteClaim(null)} loading={deleting} />}

      <Toast toasts={toasts} />
    </div>
  );
}

function ActionBtn({ icon: Icon, onClick, title, color }) {
  const colors = {
    slate: "bg-gray-50 hover:bg-gray-100 text-gray-500",
    orange: "bg-orange-50 hover:bg-orange-100 text-orange-500",
    rose: "bg-red-50 hover:bg-red-100 text-red-500",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-colors ${colors[color]}`}
    >
      <Icon size={11} className="sm:text-xs" />
    </button>
  );
}

function MobileCard({ claim: c, onView, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 space-y-2 sm:space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
            {c.claim_type?.name || `Type #${c.claim_type_id}`}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
            {c.project?.name || "No project"} • {fmtDate(c.claim_date)}
          </p>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-base sm:text-lg font-bold text-gray-800">{fmt(c.amount)}</span>
        <span className="text-[10px] sm:text-xs text-gray-400">{fmtDate(c.applied_at || c.created_at)}</span>
      </div>
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] sm:text-xs font-medium transition-colors"
        >
          <Eye size={12} /> View
        </button>
        {c.status === "pending" && (
          <>
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-600 text-[11px] sm:text-xs font-medium transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-500 text-[11px] sm:text-xs font-medium transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onApply, filtered }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-3 sm:gap-4">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 rounded-lg flex items-center justify-center">
        <Receipt size={24} className="text-orange-400 sm:w-7 sm:h-7" />
      </div>
      <div className="text-center px-4">
        <p className="font-semibold text-gray-700 text-sm sm:text-base">
          {filtered ? "No claims match this filter" : "No claims yet"}
        </p>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          {filtered ? "Try a different status filter" : "Submit your first reimbursement claim"}
        </p>
      </div>
      {!filtered && (
        <button
          onClick={onApply}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} className="sm:text-sm" /> Apply Claim
        </button>
      )}
    </div>
  );
}