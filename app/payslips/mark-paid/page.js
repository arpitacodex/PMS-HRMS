"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard, Search, RefreshCw, CheckCircle2,
  Clock, DollarSign, ChevronDown, Eye, AlertCircle,
  Banknote, Building2, Smartphone, FileText,
} from "lucide-react";
import PageHeader from "@/components/payroll/PageHeader";
import StatusBadge from "@/components/payroll/StatusBadge";
import Drawer from "@/components/payroll/Drawer";
import {
  fetchAllPayrolls, fetchAllUsers, payPayroll,
  MONTHS, fmt,
} from "@/lib/payrollApi";

const PAYMENT_MODES = [
  { value: "bank_transfer", label: "Bank Transfer", icon: Building2 },
  { value: "cash",          label: "Cash",          icon: Banknote    },
  { value: "upi",           label: "UPI",           icon: Smartphone  },
  { value: "cheque",        label: "Cheque",        icon: FileText    },
];

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function MarkAsPaidPage() {
  const router = useRouter();
  const [payrolls,    setPayrolls]    = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [toast,       setToast]       = useState(null);

  // Pay drawer
  const [drawer,      setDrawer]      = useState(false);
  const [target,      setTarget]      = useState(null);
  const [payMode,     setPayMode]     = useState("bank_transfer");
  const [payDate,     setPayDate]     = useState(new Date().toISOString().split("T")[0]);
  const [payRef,      setPayRef]      = useState("");
  const [payLoading,  setPayLoading]  = useState(false);

  // Success animation
  const [justPaid,    setJustPaid]    = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.all([fetchAllPayrolls(), fetchAllUsers()]);
      const all = pRes.data || [];
      // Only show unpaid payrolls (processed / pending)
      setPayrolls(all.filter((p) => p.status !== "paid"));
      setUsers(uRes.data || uRes.users || uRes || []);
    } catch {
      showToast("Failed to load payrolls", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getUserName = (userId) => {
    const u = users.find((x) => x.id === userId);
    return u ? `${u.first_name} ${u.last_name}` : `User #${userId}`;
  };
  const getUserCode = (userId) => {
    const u = users.find((x) => x.id === userId);
    return u?.employee_code || "";
  };

  // Stats
  const totalUnpaid    = payrolls.length;
  const totalPending   = payrolls.filter((p) => p.status === "pending").length;
  const totalProcessed = payrolls.filter((p) => p.status === "processed").length;
  const totalDue       = payrolls.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);

  // Filter
  const filtered = payrolls.filter((p) => {
    const name = getUserName(p.user_id).toLowerCase();
    return (
      name.includes(search.toLowerCase()) ||
      String(p.id).includes(search) ||
      `${MONTHS[p.month - 1]} ${p.year}`.toLowerCase().includes(search.toLowerCase())
    );
  });

  const openDrawer = (p) => {
    setTarget(p);
    setPayMode("bank_transfer");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayRef("");
    setDrawer(true);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      await payPayroll(target.id, {
        payment_mode:      payMode,
        payment_date:      payDate,
        payment_reference: payRef,
      });
      setJustPaid(target.id);
      showToast(`₹${fmt(target.net_salary)} paid to ${getUserName(target.user_id)}!`);
      setDrawer(false);
      setTimeout(() => {
        setJustPaid(null);
        load();
      }, 1800);
    } catch {
      showToast("Payment failed. Please try again.", "error");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[70] px-5 py-3.5 rounded-lg shadow-lg text-sm font-medium text-white flex items-center gap-2
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.type !== "error" && <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Pay Drawer */}
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Process Payment"
        subtitle={target ? `${getUserName(target.user_id)} · ${MONTHS[(target.month || 1) - 1]} ${target.year}` : ""}
        width="max-w-md"
      >
        {target && (
          <form onSubmit={handlePay} className="space-y-5">
            {/* Amount hero - Orange gradient */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 backdrop-blur-sm">
                {getUserName(target.user_id).charAt(0)}
              </div>
              <p className="font-semibold text-white">{getUserName(target.user_id)}</p>
              <p className="text-white/70 text-xs mb-3">{getUserCode(target.user_id)}</p>
              <p className="text-white/60 text-xs uppercase tracking-wider">Net Salary to Pay</p>
              <p className="text-3xl font-bold text-white mt-1">₹{fmt(target.net_salary)}</p>
              <p className="text-white/50 text-xs mt-2">{MONTHS[(target.month || 1) - 1]} {target.year}</p>
            </div>

            {/* Payment Mode — card selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_MODES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPayMode(value)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-lg border text-sm font-medium transition-all
                      ${payMode === value
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Payment Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Transaction Reference
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder={payMode === "upi" ? "UPI Transaction ID" : payMode === "cheque" ? "Cheque Number" : "Transaction / Reference ID"}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
            </div>

            {/* Breakdown summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm border border-gray-100">
              <div className="flex justify-between text-gray-500">
                <span>Gross Salary</span>
                <span className="font-medium text-gray-700">₹{fmt(target.gross_salary)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Deductions</span>
                <span className="font-medium text-red-500">-₹{fmt(target.total_deductions)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-700">Net to Pay</span>
                <span className="font-bold text-orange-600">₹{fmt(target.net_salary)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setDrawer(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={payLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
                {payLoading
                  ? <><RefreshCw size={14} className="animate-spin" /> Processing…</>
                  : <><CreditCard size={14} /> Confirm Payment</>}
              </button>
            </div>
          </form>
        )}
      </Drawer>

      {/* Page Header */}
      <PageHeader
        icon={CreditCard}
        iconBg="bg-orange-50"
        iconColor="text-orange-600"
        title="Mark as Paid"
        subtitle="Process payments for completed payrolls"
        breadcrumbs={[{ label: "Payslips", href: "/payslips" }, { label: "Mark as Paid" }]}
        actions={
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Unpaid Payrolls"  value={totalUnpaid}          icon={CreditCard}   iconBg="bg-orange-50"  iconColor="text-orange-500"  sub="Awaiting payment"  />
        <StatCard label="Processed"        value={totalProcessed}       icon={CheckCircle2} iconBg="bg-orange-50"    iconColor="text-orange-500"   sub="Ready to pay"      />
        <StatCard label="Pending"          value={totalPending}         icon={Clock}        iconBg="bg-orange-50"   iconColor="text-orange-500"  sub="In queue"          />
        <StatCard label="Total Due"        value={`₹${fmt(totalDue)}`} icon={DollarSign}   iconBg="bg-orange-50" iconColor="text-orange-500" sub="Net salary total" />
      </div>

      {/* Payrolls list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee, period..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
            />
          </div>
          <p className="text-xs text-gray-400 flex-shrink-0">{filtered.length} results</p>
        </div>

        {/* Empty state — all paid */}
        {!loading && payrolls.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <p className="text-base font-semibold text-gray-600">All payrolls are paid!</p>
            <p className="text-sm text-gray-400 mt-1">No pending payments at the moment.</p>
          </div>
        )}

        {/* Desktop table */}
        {(loading || payrolls.length > 0) && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["#", "Employee", "Period", "Gross", "Deductions", "Net Salary", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">No results match your search</td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-b border-gray-100 transition-colors hover:bg-gray-50
                        ${justPaid === p.id ? "bg-emerald-50/50" : ""}`}
                    >
                      <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-semibold flex-shrink-0">
                            {getUserName(p.user_id).charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{getUserName(p.user_id)}</p>
                            <p className="text-[11px] text-gray-400">{getUserCode(p.user_id)}</p>
                          </div>
                        </div>
                        </td>
                      <td className="px-4 py-3.5 text-gray-600">{MONTHS[p.month - 1]} {p.year}</td>
                      <td className="px-4 py-3.5 text-gray-700">₹{fmt(p.gross_salary)}</td>
                      <td className="px-4 py-3.5 text-red-500">-₹{fmt(p.total_deductions)}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">₹{fmt(p.net_salary)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3.5">
                        {justPaid === p.id ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 size={14} /> Paid!
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/payslips/${p.id}`)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-colors"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => openDrawer(p)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-semibold transition-all whitespace-nowrap shadow-sm"
                            >
                              <CreditCard size={13} /> Pay Now
                            </button>
                          </div>
                        )}
                        </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile cards */}
        {(loading || payrolls.length > 0) && (
          <div className="sm:hidden divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">No results match your search</p>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className={`p-4 transition-colors ${justPaid === p.id ? "bg-emerald-50/50" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-semibold">
                        {getUserName(p.user_id).charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{getUserName(p.user_id)}</p>
                        <p className="text-xs text-gray-500">{MONTHS[p.month - 1]} {p.year}</p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100">
                      <p className="text-[10px] text-gray-400">Gross</p>
                      <p className="text-xs font-semibold text-gray-700">₹{fmt(p.gross_salary)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100">
                      <p className="text-[10px] text-gray-400">Deductions</p>
                      <p className="text-xs font-semibold text-red-500">-₹{fmt(p.total_deductions)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg px-2 py-1.5 border border-orange-100">
                      <p className="text-[10px] text-gray-400">Net</p>
                      <p className="text-xs font-bold text-orange-600">₹{fmt(p.net_salary)}</p>
                    </div>
                  </div>
                  {justPaid === p.id ? (
                    <div className="py-2 rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-600 flex items-center justify-center gap-2">
                      <CheckCircle2 size={15} /> Payment Processed!
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/payslips/${p.id}`)}
                        className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors">
                        <Eye size={12} /> View
                      </button>
                      <button onClick={() => openDrawer(p)}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold flex items-center justify-center gap-1 hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm">
                        <CreditCard size={12} /> Pay Now
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}