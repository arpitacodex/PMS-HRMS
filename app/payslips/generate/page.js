"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Users, Search, ChevronDown, Eye,
  RefreshCw, CheckCircle2, AlertCircle, ArrowRight,
  Calendar, DollarSign, UserCheck,
} from "lucide-react";
import PageHeader from "@/components/payroll/PageHeader";
import StatusBadge from "@/components/payroll/StatusBadge";
import Drawer from "@/components/payroll/Drawer";
import {
  fetchAllUsers, fetchPayrollByUser,
  generatePayroll, MONTHS, fmt,
} from "@/lib/payrollApi";

// Current year/month defaults
const NOW = new Date();
const THIS_YEAR  = NOW.getFullYear();
const THIS_MONTH = NOW.getMonth() + 1;

// ── Employee Card ──────────────────────────────────────────────────────────
function EmployeeCard({ user, onGenerate, onView }) {
  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{user.first_name} {user.last_name}</p>
          <p className="text-xs text-gray-400">{user.employee_code} · {user.roles?.[0]?.display_name || "Employee"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onView(user)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Eye size={13} /> History
        </button>
        <button
          onClick={() => onGenerate(user)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          <Zap size={13} /> Generate
        </button>
      </div>
    </div>
  );
}

// ── Payroll History Mini-table ─────────────────────────────────────────────
function HistoryTable({ payrolls }) {
  if (!payrolls.length)
    return <p className="text-sm text-gray-400 text-center py-6">No payroll records yet</p>;
  return (
    <div className="space-y-2">
      {payrolls.map((p) => (
        <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">{MONTHS[p.month - 1]} {p.year}</p>
            <p className="text-xs text-gray-500">Net: ₹{fmt(p.net_salary)}</p>
          </div>
          <StatusBadge status={p.status} />
        </div>
      ))}
    </div>
  );
}

export default function GeneratePayrollPage() {
  const router = useRouter();
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [toast,       setToast]       = useState(null);

  // Generate drawer
  const [genDrawer,   setGenDrawer]   = useState(false);
  const [genTarget,   setGenTarget]   = useState(null);
  const [genForm,     setGenForm]     = useState({ month: THIS_MONTH, year: THIS_YEAR });
  const [genLoading,  setGenLoading]  = useState(false);
  const [genResult,   setGenResult]   = useState(null); // success result

  // History drawer
  const [histDrawer,  setHistDrawer]  = useState(false);
  const [histTarget,  setHistTarget]  = useState(null);
  const [histPayrolls, setHistPayrolls] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllUsers();
      const list = res.data || res.users || res || [];
      setUsers(list.filter((u) => u.status === "active"));
    } catch { showToast("Failed to load users", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u) => {
    const name = `${u.first_name} ${u.last_name} ${u.employee_code}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // Open generate drawer
  const openGenerate = (user) => {
    setGenTarget(user);
    setGenForm({ month: THIS_MONTH, year: THIS_YEAR });
    setGenResult(null);
    setGenDrawer(true);
  };

  // Open history drawer
  const openHistory = async (user) => {
    setHistTarget(user);
    setHistPayrolls([]);
    setHistDrawer(true);
    setHistLoading(true);
    try {
      const res = await fetchPayrollByUser(user.id);
      // Handle any backend shape: { data:[] } | { payrolls:[] } | []
      const list = Array.isArray(res) ? res : (res.data || res.payrolls || res.items || []);
      setHistPayrolls(list);
    } catch { showToast("Could not load history", "error"); }
    finally { setHistLoading(false); }
  };

  // Submit generate
  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    setGenResult(null);
    try {
      const res = await generatePayroll({
        user_id: genTarget.id,
        month: Number(genForm.month),
        year:  Number(genForm.year),
      });

      console.log("Generate payroll response:", res); // debug — remove after confirming

      // Robustly extract the payroll object from any backend shape:
      // { data: {...} } | { payroll: {...} } | { success, data } | the object itself
      const payrollObj =
        (res.data && typeof res.data === "object" && !Array.isArray(res.data) ? res.data : null) ||
        res.payroll ||
        (res.id && res.user_id ? res : null) ||  // backend returned the object directly
        null;

      // Treat as success if: explicit success flag OR we got a payroll object back
      const isSuccess = res.success === true || !!payrollObj;

      // Treat as explicit server-side failure: success=false with a message
      const isExplicitFailure = res.success === false && res.message;

      if (isSuccess && !isExplicitFailure) {
        setGenResult({ success: true, payroll: payrollObj || {} });
        showToast(`Payroll generated for ${genTarget.first_name}!`);
      } else {
        const errMsg = res.message || res.error || "Failed to generate payroll";
        setGenResult({ success: false, message: errMsg });
        showToast(errMsg, "error");
      }
    } catch (err) {
      console.error("Generate payroll error:", err);
      setGenResult({ success: false, message: err?.message || "Server error" });
      showToast(err?.message || "Server error", "error");
    } finally {
      setGenLoading(false);
    }
  };

  // Years range
  const yearOptions = Array.from({ length: 5 }, (_, i) => THIS_YEAR - 1 + i);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Generate Drawer ─────────────────────────────────────────────── */}
      <Drawer
        open={genDrawer}
        onClose={() => setGenDrawer(false)}
        title="Generate Payroll"
        subtitle={genTarget ? `${genTarget.first_name} ${genTarget.last_name} (${genTarget.employee_code})` : ""}
      >
        {genResult?.success ? (
          // ── Success state ────────────────────────────────────────────────
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Payroll Generated!</h3>
            <p className="text-sm text-gray-500 mb-6">
              {MONTHS[(genForm.month || THIS_MONTH) - 1]} {genForm.year} payroll has been processed successfully.
            </p>
            {genResult.payroll?.net_salary && (
              <div className="w-full bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 mb-1">Net Salary</p>
                <p className="text-2xl font-bold text-blue-600">₹{fmt(genResult.payroll.net_salary)}</p>
              </div>
            )}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setGenResult(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Generate Another
              </button>
              {genResult.payroll?.id && (
                <button
                  onClick={() => router.push(`/payslips/${genResult.payroll.id}`)}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  View Payroll <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        ) : genResult?.success === false ? (
          // ── Failure state — show friendly error + fix link ───────────────
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Generation Failed</h3>
            <p className="text-sm text-gray-500 mb-4">{genResult.message}</p>

            {/* Helpful hint for the most common error */}
            {(genResult.message?.toLowerCase().includes("salary structure") ||
              genResult.message?.toLowerCase().includes("no structure") ||
              genResult.message?.toLowerCase().includes("structure not found")) && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 text-left">
                <p className="text-xs font-semibold text-amber-800 mb-1">📋 How to fix this:</p>
                <p className="text-xs text-amber-700">
                  <strong>{genTarget?.first_name} {genTarget?.last_name}</strong> has no salary structure assigned.
                  Go to <strong>Salary → Assign Structure</strong> and assign a structure to this employee first.
                </p>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setGenResult(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
              {(genResult.message?.toLowerCase().includes("salary structure") ||
                genResult.message?.toLowerCase().includes("no structure") ||
                genResult.message?.toLowerCase().includes("structure not found")) && (
                <button
                  onClick={() => { setGenDrawer(false); router.push("/payroll/salary-structures/manage"); }}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Assign Structure <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Employee info */}
            {genTarget && (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                  {`${genTarget.first_name?.[0] || ""}${genTarget.last_name?.[0] || ""}`.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{genTarget.first_name} {genTarget.last_name}</p>
                  <p className="text-xs text-gray-500">{genTarget.employee_code} · {genTarget.email}</p>
                </div>
              </div>
            )}

            {/* Month */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Month</label>
              <div className="relative">
                <select
                  value={genForm.month}
                  onChange={(e) => setGenForm({ ...genForm, month: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year</label>
              <div className="relative">
                <select
                  value={genForm.year}
                  onChange={(e) => setGenForm({ ...genForm, year: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                >
                  {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Info note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2.5 text-xs text-blue-700">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <p>Payroll will be calculated based on the assigned salary structure. Make sure a structure is assigned before generating.</p>
            </div>

            <div className="pt-2 border-t border-gray-100 flex gap-3">
              <button type="button" onClick={() => setGenDrawer(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={genLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {genLoading ? (
                  <><RefreshCw size={14} className="animate-spin" /> Generating…</>
                ) : (
                  <><Zap size={14} /> Generate</>
                )}
              </button>
            </div>
          </form>
        )}
      </Drawer>

      {/* ── History Drawer ───────────────────────────────────────────────── */}
      <Drawer
        open={histDrawer}
        onClose={() => setHistDrawer(false)}
        title="Payroll History"
        subtitle={histTarget ? `${histTarget.first_name} ${histTarget.last_name}` : ""}
      >
        {histLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {histTarget && (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 mb-4 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                  {`${histTarget.first_name?.[0] || ""}${histTarget.last_name?.[0] || ""}`.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{histTarget.first_name} {histTarget.last_name}</p>
                  <p className="text-xs text-gray-500">{histPayrolls.length} payroll records</p>
                </div>
              </div>
            )}
            <HistoryTable payrolls={histPayrolls} />
            {histPayrolls.length > 0 && (
              <button
                onClick={() => {
                  setHistDrawer(false);
                  router.push(`/payslips/employee-history?userId=${histTarget?.id}`);
                }}
                className="w-full mt-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                View Full History <ArrowRight size={14} />
              </button>
            )}
          </>
        )}
      </Drawer>

      {/* Page Header */}
      <PageHeader
        icon={Zap}
        title="Generate Payroll"
        subtitle="Generate individual employee payroll for any period"
        breadcrumbs={[{ label: "Payslips", href: "/payslips" }, { label: "Generate Payroll" }]}
        actions={
        <button
        onClick={() => router.push("/payslips/all")}
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
        <Eye size={14} />
        View All Payrolls
      </button>
        }
      />

      {/* Info banner - Clean design */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">
            Generate Individual Payrolls
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            Select an employee and click Generate. Payroll is calculated using the assigned salary structure for the chosen month/year.
          </p>
        </div>
      </div>

      {/* Search and Employee List - Clean white card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees by name or code..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users size={14} />
            {filtered.length} employees
          </div>
        </div>

        {/* Employee list */}
        <div className="p-4 space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Users size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">No employees found</p>
            </div>
          ) : (
            filtered.map((user) => (
              <EmployeeCard
                key={user.id}
                user={user}
                onGenerate={openGenerate}
                onView={openHistory}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}