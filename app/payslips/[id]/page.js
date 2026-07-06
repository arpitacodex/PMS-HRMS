"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText, ArrowLeft, RefreshCw, Trash2, CreditCard,
  CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  DollarSign, Calendar, User, Building2, Printer,
  ChevronDown, Clock, Banknote,
} from "lucide-react";
import PageHeader from "@/components/payroll/PageHeader";
import StatusBadge from "@/components/payroll/StatusBadge";
import Drawer from "@/components/payroll/Drawer";
import {
  fetchPayrollById, fetchPayrollDetails, fetchAllUsers,
  payPayroll, recalculatePayroll, deletePayroll,
  MONTHS, fmt, getRole, getToken, getUserId,
} from "@/lib/payrollApi";

// Fetch any single user by ID — works for own profile (all roles) or any user (admin/hr)
const BASE = "http://localhost:8080/api";
const fetchUserById = (uid) =>
  fetch(`${BASE}/auth/${uid}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  }).then((r) => r.json());

// ── Section Card ───────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, iconBg, iconColor, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={16} className={iconColor} />
        </div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Info Row ───────────────────────────────────────────────────────────────
function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-[#ff8c42] text-base" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className={`w-12 h-12 rounded-full ${danger ? "bg-red-100" : "bg-amber-100"} flex items-center justify-center mx-auto mb-4`}>
          <AlertCircle size={24} className={danger ? "text-red-500" : "text-amber-500"} />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 text-center">{message}</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollDetailPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [payroll,   setPayroll]   = useState(null);
  const [details,   setDetails]   = useState([]);
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState(null);
  const [confirm,   setConfirm]   = useState({ open: false, type: null });

  // Pay drawer
  const [payDrawer,  setPayDrawer]  = useState(false);
  const [payForm,    setPayForm]    = useState({ payment_mode: "bank_transfer", payment_reference: "", payment_date: "" });
  const [payLoading, setPayLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const role = getRole();
      const canFetchAllUsers = ["admin", "hr"].includes(role);

      const [pRes, dRes] = await Promise.all([
        fetchPayrollById(id),
        fetchPayrollDetails(id),
      ]);
      const p = pRes.data || pRes.payroll || pRes;
      setPayroll(p);
      setDetails(dRes.data || dRes.details || []);

      // Strategy:
      // - Admin/HR  → fetchAllUsers() to get the full list, then find by user_id
      // - Everyone  → fetchUserById(payroll.user_id) using /api/auth/:id
      //   (each user can read any profile via this endpoint; same one the Sidebar uses)
      try {
        if (canFetchAllUsers) {
          const uRes = await fetchAllUsers();
          const users = uRes.data || uRes.users || uRes || [];
          const found = users.find((u) => u.id === p?.user_id);
          setUser(found || null);
        } else {
          // Use /api/auth/:userId — same endpoint the Sidebar uses, works for all roles
          const targetId = p?.user_id;
          if (targetId) {
            const uRes = await fetchUserById(targetId);
            // Backend returns { success, user } or { data } or the user object directly
            const u = uRes?.user || uRes?.data || (uRes?.id ? uRes : null);
            setUser(u || null);
          } else {
            setUser(null);
          }
        }
      } catch {
        // Non-critical — payroll data still shows, user panel will just be sparse
        setUser(p?.user || p?.employee || null);
      }
    } catch {
      showToast("Failed to load payroll details", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handlePay = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      await payPayroll(id, payForm);
      showToast("Payroll marked as paid!");
      setPayDrawer(false);
      load();
    } catch { showToast("Payment failed", "error"); }
    finally { setPayLoading(false); }
  };

  const handleRecalculate = async () => {
    try {
      await recalculatePayroll(id);
      showToast("Payroll recalculated!");
      load();
    } catch { showToast("Recalculate failed", "error"); }
    setConfirm({ open: false });
  };

  const handleDelete = async () => {
    try {
      await deletePayroll(id);
      showToast("Payroll deleted");
      setTimeout(() => router.push("/payslips/all"), 1200);
    } catch { showToast("Delete failed", "error"); }
    setConfirm({ open: false });
  };

  // Split details into earnings and deductions.
  // IMPORTANT: always trust type/component_type first — amounts are stored as
  // positive numbers in the DB for both earnings AND deductions, so amount-sign
  // fallback is only used when no type field exists at all.
  const hasType = (d) => d.type || d.component_type;
  const earnings = details.filter((d) =>
    hasType(d)
      ? d.type === "earning"   || d.component_type === "earning"
      : Number(d.amount) >= 0   // only fall back to sign if no type field
  );
  const deductions = details.filter((d) =>
    hasType(d)
      ? d.type === "deduction" || d.component_type === "deduction"
      : Number(d.amount) < 0    // only fall back to sign if no type field
  );

  // Build full name robustly from whichever user object is available
  const resolveUserName = (u) => {
    if (!u) return null;
    const first = u.first_name || u.name || "";
    const last  = u.last_name  || "";
    const full  = [first, last].filter(Boolean).join(" ").trim();
    return full || null;
  };
  const userName =
    resolveUserName(user) ||
    resolveUserName(payroll?.user) ||
    (payroll?.user_id ? `Employee #${payroll.user_id}` : "Employee");

  // Helper accessors — user is now always the full profile fetched by /api/auth/:id
  const userEmployeeCode = user?.employee_code || user?.code || payroll?.user?.employee_code || `#${payroll?.user_id || ""}`;
  const userRole         = user?.roles?.[0]?.display_name || user?.roles?.[0]?.name || payroll?.user?.roles?.[0]?.display_name || "Employee";
  const userEmail        = user?.email || payroll?.user?.email || "—";

  // Role gate — employees can view & download only
  const role        = getRole();
  const canManage   = ["admin", "hr"].includes(role); // Mark Paid, Recalculate, Delete

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-48 bg-gray-100 rounded-2xl" />
              <div className="h-64 bg-gray-100 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-100 rounded-2xl" />
              <div className="h-32 bg-gray-100 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="min-h-screen bg-gray-50/60 p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Payroll not found</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-[#ff8c42] hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[70] px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
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
          ? "This will permanently delete this payroll record. This cannot be undone."
          : "This will delete and regenerate the payroll based on current salary structure."}
        danger={confirm.type === "delete"}
      />

      {/* Pay Drawer */}
      <Drawer
        open={payDrawer}
        onClose={() => setPayDrawer(false)}
        title="Mark as Paid"
        subtitle={`${userName} — ${MONTHS[(payroll.month || 1) - 1]} ${payroll.year}`}
      >
        <form onSubmit={handlePay} className="space-y-5">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Net Salary to Pay</p>
            <p className="text-3xl font-bold text-[#ff8c42]">₹{fmt(payroll.net_salary)}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Mode</label>
            <select value={payForm.payment_mode} onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42]">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Date <span className="text-red-400">*</span></label>
            <input type="date" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reference / Transaction ID</label>
            <input type="text" value={payForm.payment_reference} onChange={(e) => setPayForm({ ...payForm, payment_reference: e.target.value })}
              placeholder="e.g. TXN123456789"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42]" />
          </div>
          <div className="pt-2 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={() => setPayDrawer(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={payLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {payLoading ? <><RefreshCw size={14} className="animate-spin" /> Processing…</> : <><CreditCard size={14} /> Mark as Paid</>}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Header */}
      <PageHeader
        icon={FileText}
        title={`Payroll — ${MONTHS[(payroll.month || 1) - 1]} ${payroll.year}`}
        subtitle={`${userName} · Payroll ID #${payroll.id}`}
        breadcrumbs={[
          { label: "Payslips", href: "/payslips" },
          { label: "All Payrolls", href: "/payslips/all" },
          { label: `#${payroll.id}` },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            {canManage && payroll.status !== "paid" && (
              <button onClick={() => setPayDrawer(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm transition-colors">
                <CreditCard size={14} /> Mark Paid
              </button>
            )}
            {canManage && (
              <button onClick={() => setConfirm({ open: true, type: "recalculate" })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors">
                <RefreshCw size={14} /> Recalculate
              </button>
            )}
            {canManage && (
              <button onClick={() => setConfirm({ open: true, type: "delete" })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        }
      />

      {/* Hero summary strip */}
      <div className="bg-gradient-to-r from-[#0A0F1F] to-[#1a2340] rounded-2xl p-5 sm:p-6 mb-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff8c42] to-orange-400 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {userName.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">{userName}</p>
              <p className="text-white/50 text-xs mt-0.5">{userEmployeeCode} · {userRole}</p>
              <div className="mt-1"><StatusBadge status={payroll.status} /></div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-14 bg-white/15 mx-2" />

          {/* Salary figures */}
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="text-white/50 text-xs mb-0.5">Gross Salary</p>
              <p className="text-lg font-bold text-white/90">₹{fmt(payroll.gross_salary)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs mb-0.5">Total Deductions</p>
              <p className="text-lg font-bold text-red-300">-₹{fmt(payroll.total_deductions)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs mb-0.5">Net Salary</p>
              <p className="text-2xl font-bold text-[#ff8c42]">₹{fmt(payroll.net_salary)}</p>
            </div>
          </div>

          {payroll.payment_date && (
            <>
              <div className="hidden sm:block w-px h-14 bg-white/15 mx-2" />
              <div>
                <p className="text-white/50 text-xs mb-0.5">Paid On</p>
                <p className="font-semibold text-white">{new Date(payroll.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                <p className="text-white/40 text-xs capitalize">{payroll.payment_mode?.replace("_", " ")}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Breakdown */}
        <div className="lg:col-span-2 space-y-5">
          {/* Earnings */}
          <SectionCard title="Earnings" icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600">
            {details.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">No component breakdown available</p>
                <p className="text-xs text-gray-300 mt-1">The payroll was likely generated without detailed components</p>
              </div>
            ) : earnings.length === 0 ? (
              /* Fallback: show gross as a single earning row */
              <div className="flex items-center justify-between py-3 bg-emerald-50/50 rounded-xl px-4">
                <span className="text-sm font-medium text-gray-700">Gross Salary</span>
                <span className="text-sm font-bold text-emerald-700">₹{fmt(payroll.gross_salary)}</span>
              </div>
            ) : (
              <div className="space-y-1">
                {earnings.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{d.component_name || d.name || "Earning"}</p>
                      {d.description && <p className="text-xs text-gray-400">{d.description}</p>}
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">+₹{fmt(Math.abs(d.amount))}</span>
                  </div>
                ))}
                <div className="border-t border-dashed border-gray-200 mt-2 pt-3 flex items-center justify-between px-3">
                  <span className="text-sm font-bold text-gray-700">Total Earnings</span>
                  <span className="text-base font-bold text-emerald-700">₹{fmt(payroll.gross_salary)}</span>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Deductions */}
          <SectionCard title="Deductions" icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-500">
            {deductions.length === 0 ? (
              <div className="flex items-center justify-between py-3 bg-gray-50 rounded-xl px-4">
                <span className="text-sm text-gray-500">No deductions</span>
                <span className="text-sm font-bold text-gray-400">₹0.00</span>
              </div>
            ) : (
              <div className="space-y-1">
                {deductions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{d.component_name || d.name || "Deduction"}</p>
                      {d.description && <p className="text-xs text-gray-400">{d.description}</p>}
                    </div>
                    <span className="text-sm font-semibold text-red-500">-₹{fmt(Math.abs(d.amount))}</span>
                  </div>
                ))}
                <div className="border-t border-dashed border-gray-200 mt-2 pt-3 flex items-center justify-between px-3">
                  <span className="text-sm font-bold text-gray-700">Total Deductions</span>
                  <span className="text-base font-bold text-red-500">-₹{fmt(payroll.total_deductions)}</span>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Net Summary bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Net Salary</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">₹{fmt(payroll.net_salary)}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="text-gray-400">Gross</span>
                  <span className="font-semibold text-gray-700">₹{fmt(payroll.gross_salary)}</span>
                </div>
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="text-gray-400">Deductions</span>
                  <span className="font-semibold text-red-500">-₹{fmt(payroll.total_deductions)}</span>
                </div>
                <div className="w-full h-px bg-gray-200 my-1" />
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="text-gray-400">Net</span>
                  <span className="font-bold text-[#ff8c42]">₹{fmt(payroll.net_salary)}</span>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex text-xs text-gray-400 justify-between mb-1">
                <span>Deductions ratio</span>
                <span>{payroll.gross_salary > 0 ? ((payroll.total_deductions / payroll.gross_salary) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff8c42] to-red-400 rounded-full transition-all"
                  style={{ width: `${payroll.gross_salary > 0 ? Math.min((payroll.total_deductions / payroll.gross_salary) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Meta info */}
        <div className="space-y-5">
          {/* Employee Info */}
          <SectionCard title="Employee" icon={User} iconBg="bg-blue-50" iconColor="text-blue-600">
            <InfoRow label="Full Name"   value={userName} />
            <InfoRow label="Employee ID" value={userEmployeeCode} />
            <InfoRow label="Role"        value={userRole} />
            <InfoRow label="Email"       value={userEmail} />
          </SectionCard>

          {/* Payroll Info */}
          <SectionCard title="Payroll Details" icon={DollarSign} iconBg="bg-orange-50" iconColor="text-[#ff8c42]">
            <InfoRow label="Payroll ID"    value={`#${payroll.id}`} />
            <InfoRow label="Period"        value={`${MONTHS[(payroll.month || 1) - 1]} ${payroll.year}`} />
            <InfoRow label="Status"        value={<StatusBadge status={payroll.status} />} />
            <InfoRow label="Payment Mode"  value={payroll.payment_mode?.replace("_", " ") || "—"} />
            {payroll.payment_reference && <InfoRow label="Reference" value={payroll.payment_reference} />}
            {payroll.payment_date && (
              <InfoRow label="Paid On" value={new Date(payroll.payment_date).toLocaleDateString("en-IN")} />
            )}
            <InfoRow label="Processed At"
              value={payroll.processed_at
                ? new Date(payroll.processed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "—"} />
          </SectionCard>

          {/* Remarks */}
          {payroll.remarks && (
            <SectionCard title="Remarks" icon={AlertCircle} iconBg="bg-gray-50" iconColor="text-gray-500">
              <p className="text-sm text-gray-600">{payroll.remarks}</p>
            </SectionCard>
          )}

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
            {/* ✅ All roles — view & download */}
            <button onClick={() => window.print()}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors">
              <Printer size={15} /> Print / Download
            </button>
            {/* ❌ Employee cannot — admin/hr only */}
            {canManage && payroll.status !== "paid" && (
              <button onClick={() => setPayDrawer(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium transition-colors">
                <CreditCard size={15} /> Mark as Paid
              </button>
            )}
            {canManage && (
              <button onClick={() => setConfirm({ open: true, type: "recalculate" })}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium transition-colors">
                <RefreshCw size={15} /> Recalculate Payroll
              </button>
            )}
            {canManage && (
              <button onClick={() => setConfirm({ open: true, type: "delete" })}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors">
                <Trash2 size={15} /> Delete Payroll
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}