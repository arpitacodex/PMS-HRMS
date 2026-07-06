"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, RefreshCw, Trash2, Eye, CreditCard,
  Search, ChevronDown, Users, DollarSign,
  TrendingUp, Clock, CheckCircle2,
} from "lucide-react";
import PageHeader from "@/components/payroll/PageHeader";
import StatusBadge from "@/components/payroll/StatusBadge";
import Drawer from "@/components/payroll/Drawer";
import {
  fetchAllPayrolls, fetchAllUsers, deletePayroll,
  payPayroll, recalculatePayroll,
  MONTHS, fmt, getToken,
} from "@/lib/payrollApi";

const BASE = "http://localhost:8080/api";

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border border-gray-200">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-2">{message}</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllPayrollsPage() {
  const router = useRouter();
  const [payrolls,    setPayrolls]    = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast,       setToast]       = useState(null);

  // Pay drawer state
  const [payDrawer,   setPayDrawer]   = useState(false);
  const [payTarget,   setPayTarget]   = useState(null);
  const [payForm,     setPayForm]     = useState({ payment_mode: "bank_transfer", payment_reference: "", payment_date: "" });
  const [payLoading,  setPayLoading]  = useState(false);
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter,  setYearFilter]  = useState("all");

  const getUserName = (userId) => {
    const u = users.find((x) => x.id === userId);
    return u ? `${u.first_name} ${u.last_name}` : `User #${userId}`;
  };

  const filtered = payrolls.filter((p) => {
    const name = getUserName(p.user_id).toLowerCase();
    const matchSearch =
      name.includes(search.toLowerCase()) ||
      String(p.id).includes(search) ||
      `${MONTHS[p.month - 1]} ${p.year}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchMonth  = monthFilter === "all" || p.month === Number(monthFilter);
    const matchYear   = yearFilter  === "all" || p.year  === Number(yearFilter);
    return matchSearch && matchStatus && matchMonth && matchYear;
  });
  
  const availableYears = [...new Set(payrolls.map((p) => p.year))].sort((a, b) => b - a);
  
  // Confirm modal
  const [confirm, setConfirm] = useState({ open: false, type: null, id: null });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.all([fetchAllPayrolls(), fetchAllUsers()]);
      setPayrolls(pRes.data || []);
      setUsers(uRes.data || uRes.users || uRes || []);
    } catch {
      showToast("Failed to load payrolls", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Stats
  const total      = payrolls.length;
  const paid       = payrolls.filter((p) => p.status === "paid").length;
  const processed  = payrolls.filter((p) => p.status === "processed").length;
  const totalNet   = payrolls.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);

  // Actions
  const handleDelete = async () => {
    try {
      await deletePayroll(confirm.id);
      showToast("Payroll deleted successfully");
      load();
    } catch { showToast("Delete failed", "error"); }
    setConfirm({ open: false });
  };

  const handleRecalculate = async () => {
    try {
      await recalculatePayroll(confirm.id);
      showToast("Payroll recalculated successfully");
      load();
    } catch { showToast("Recalculate failed", "error"); }
    setConfirm({ open: false });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      await payPayroll(payTarget.id, payForm);
      showToast("Payroll marked as paid!");
      setPayDrawer(false);
      load();
    } catch { showToast("Payment failed", "error"); }
    finally { setPayLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[70] px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={confirm.type === "delete" ? handleDelete : handleRecalculate}
        title={confirm.type === "delete" ? "Delete Payroll?" : "Recalculate Payroll?"}
        message={confirm.type === "delete"
          ? "This action is irreversible. The payroll record will be permanently deleted."
          : "This will delete and regenerate the payroll. Continue?"}
        danger={confirm.type === "delete"}
      />

      {/* Pay Drawer */}
      <Drawer
        open={payDrawer}
        onClose={() => setPayDrawer(false)}
        title="Mark as Paid"
        subtitle={payTarget ? `${getUserName(payTarget.user_id)} — ${MONTHS[payTarget.month - 1]} ${payTarget.year}` : ""}
      >
        <form onSubmit={handlePay} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Net Salary</label>
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
              <p className="text-xl font-bold text-orange-500">₹{fmt(payTarget?.net_salary)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Mode</label>
            <select
              value={payForm.payment_mode}
              onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Date</label>
            <input
              type="date"
              value={payForm.payment_date}
              onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reference / Transaction ID</label>
            <input
              type="text"
              value={payForm.payment_reference}
              onChange={(e) => setPayForm({ ...payForm, payment_reference: e.target.value })}
              placeholder="e.g. TXN123456"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white"
            />
          </div>

          <div className="pt-2 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={() => setPayDrawer(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={payLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {payLoading ? "Processing…" : "Mark as Paid"}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Page Header */}
      <PageHeader
        icon={BarChart3}
        title="All Payrolls"
        subtitle="Manage and view all employee payroll records"
        breadcrumbs={[{ label: "Payslips", href: "/payslips" }, { label: "All Payrolls" }]}
        actions={
<button
  onClick={load}
  className="
    flex items-center gap-2
    px-3.5 py-2
    rounded-lg
    border border-gray-200 dark:border-gray-700
    bg-white dark:bg-gray-800
    text-sm font-medium
    text-gray-700 dark:text-gray-200
    hover:bg-gray-50 dark:hover:bg-gray-700
    transition-colors shadow-sm
  "
>
  <RefreshCw size={14} />
  Refresh
</button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Payrolls"   value={total}           icon={BarChart3}    iconBg="bg-blue-50"    iconColor="text-blue-600"    sub="All records"          />
        <StatCard label="Paid"             value={paid}            icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" sub="Completed payments"   />
        <StatCard label="Processed"        value={processed}       icon={Clock}        iconBg="bg-amber-50"   iconColor="text-amber-600"   sub="Awaiting payment"    />
        <StatCard label="Total Net Payout" value={`₹${fmt(totalNet)}`} icon={DollarSign} iconBg="bg-orange-50" iconColor="text-orange-500" sub="Across all payrolls" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, month…"
              className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white"
            />
          </div>

          {/* Month dropdown */}
          <div className="relative">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="pl-3 pr-8 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white min-w-[140px]"
            >
              <option value="all">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Year dropdown */}
          <div className="relative">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="pl-3 pr-8 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white min-w-[120px]"
            >
              <option value="all">All Years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="processed">Processed</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Results count */}
        <div className="px-4 pb-3 text-xs text-gray-400 border-t border-gray-100 pt-3">{filtered.length} results</div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100 bg-gray-50">
                {["#","Employee","Period","Gross","Deductions","Net Salary","Status","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
         </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No payroll records found</td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3.5 text-gray-400 text-xs font-mono">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getUserName(p.user_id).charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{getUserName(p.user_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-4 py-3.5 text-gray-700 font-medium">₹{fmt(p.gross_salary)}</td>
                    <td className="px-4 py-3.5 text-red-500">-₹{fmt(p.total_deductions)}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800">₹{fmt(p.net_salary)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/payslips/${p.id}`)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors" title="View">
                          <Eye size={14} />
                        </button>
                        {p.status !== "paid" && (
                          <button
                            onClick={() => { setPayTarget(p); setPayForm({ payment_mode: "bank_transfer", payment_reference: "", payment_date: "" }); setPayDrawer(true); }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors" title="Mark Paid">
                            <CreditCard size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirm({ open: true, type: "recalculate", id: p.id })}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-amber-500 hover:bg-amber-50 transition-colors" title="Recalculate">
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={() => setConfirm({ open: true, type: "delete", id: p.id })}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No payroll records found</p>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white text-sm font-bold">
                      {getUserName(p.user_id).charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{getUserName(p.user_id)}</p>
                      <p className="text-xs text-gray-400">{MONTHS[p.month - 1]} {p.year}</p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-md px-2 py-1.5">
                    <p className="text-[10px] text-gray-400">Gross</p>
                    <p className="text-xs font-semibold text-gray-700">₹{fmt(p.gross_salary)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-md px-2 py-1.5">
                    <p className="text-[10px] text-gray-400">Deductions</p>
                    <p className="text-xs font-semibold text-red-500">-₹{fmt(p.total_deductions)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-md px-2 py-1.5">
                    <p className="text-[10px] text-gray-400">Net</p>
                    <p className="text-xs font-bold text-orange-500">₹{fmt(p.net_salary)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/payslips/${p.id}`)}
                    className="flex-1 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye size={12} /> View
                  </button>
                  {p.status !== "paid" && (
                    <button
                      onClick={() => { setPayTarget(p); setPayForm({ payment_mode: "bank_transfer", payment_reference: "", payment_date: "" }); setPayDrawer(true); }}
                      className="flex-1 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <CreditCard size={12} /> Pay
                    </button>
                  )}
                  <button
                    onClick={() => setConfirm({ open: true, type: "delete", id: p.id })}
                    className="py-1.5 px-3 rounded-md bg-red-50 border border-red-100 text-xs font-medium text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}