"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Eye, Download, TrendingUp,
  Wallet, Calendar, CheckCircle2, Clock,
  Search, ChevronDown,
} from "lucide-react";
import PageHeader from "@/components/payroll/PageHeader";
import StatusBadge from "@/components/payroll/StatusBadge";
import { fetchMyPayrolls, MONTHS, fmt } from "@/lib/payrollApi";

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function MyPayslipsPage() {
  const router    = useRouter();
  const [payrolls, setPayrolls] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [yearFilter, setYearFilter] = useState("all");
  const [search,      setSearch]     = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

const years   = [...new Set(payrolls.map((p) => p.year))].sort((a, b) => b - a);

const filtered = payrolls.filter((p) => {
  const period = `${MONTHS[p.month - 1]} ${p.year}`.toLowerCase();
  const matchSearch = period.includes(search.toLowerCase()) ||
    String(p.id).includes(search);
  const matchMonth = monthFilter === "all" || p.month === Number(monthFilter);
  const matchYear  = yearFilter  === "all" || p.year  === Number(yearFilter);
  return matchSearch && matchMonth && matchYear;
});
  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyPayrolls();
      setPayrolls(res.data || []);
    } catch {
      showToast("Failed to load payslips");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Stats
  const totalPaid  = payrolls.filter((p) => p.status === "paid").length;
  const latestNet  = payrolls[0]?.net_salary || 0;
  const totalEarned = payrolls.filter((p) => p.status === "paid").reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
  const pending    = payrolls.filter((p) => p.status !== "paid").length;

  // Year filter options
  // const years = [...new Set(payrolls.map((p) => p.year))].sort((a, b) => b - a);
  // const filtered = yearFilter === "all" ? payrolls : payrolls.filter((p) => p.year === Number(yearFilter));

  // Most recent payslip for the hero card
  const latest = payrolls[0];

  return (
    <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.msg}
        </div>
      )}

      <PageHeader
        icon={FileText}
        title="My Payslips"
        subtitle="Your payroll history and salary records"
        breadcrumbs={[{ label: "Payslips", href: "/payslips" }, { label: "My Payslips" }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Latest Net Salary" value={`₹${fmt(latestNet)}`}    icon={Wallet}       iconBg="bg-orange-50"  iconColor="text-[#ff8c42]" sub={latest ? `${MONTHS[latest.month - 1]} ${latest.year}` : "—"} />
        <StatCard label="Total Payslips"    value={payrolls.length}          icon={FileText}     iconBg="bg-blue-50"   iconColor="text-blue-600"   sub="All time"            />
        <StatCard label="Paid"              value={totalPaid}                icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" sub="Completed"          />
        <StatCard label="Total Earned"      value={`₹${fmt(totalEarned)}`}  icon={TrendingUp}   iconBg="bg-purple-50" iconColor="text-purple-600"  sub="Paid payslips only" />
      </div>

      {/* Latest payslip hero card */}
      {!loading && latest && (
        <div className="bg-gradient-to-r from-[#0A0F1F] to-[#1a2340] rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Latest Payslip</p>
              <h2 className="text-2xl font-bold">{MONTHS[latest.month - 1]} {latest.year}</h2>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <p className="text-white/50 text-xs">Gross Salary</p>
                  <p className="font-semibold text-white/80">₹{fmt(latest.gross_salary)}</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-white/50 text-xs">Deductions</p>
                  <p className="font-semibold text-red-300">-₹{fmt(latest.total_deductions)}</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-white/50 text-xs">Net Salary</p>
                  <p className="text-xl font-bold text-[#ff8c42]">₹{fmt(latest.net_salary)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={latest.status} />
              <button
                onClick={() => router.push(`/payslips/${latest.id}`)}
                className="flex items-center gap-2 bg-[#ff8c42] hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                <Eye size={15} /> View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Filter bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 gap-3 flex-wrap">
          <p className="text-sm font-semibold text-black">Payroll History</p>
          <div className="flex items-center gap-3">
            {/* Filter bar */}
<div className="p-4 border-b border-gray-100">
  <div className="flex flex-col sm:flex-row gap-3">
    {/* Search */}
    <div className="relative flex-1">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by month, year, or ID…"
        className="w-full pl-9 pr-4 py-2.5 text-sm text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42]"
      />
    </div>

    {/* Month dropdown */}
    <div className="relative">
      <select
        value={monthFilter}
        onChange={(e) => setMonthFilter(e.target.value)}
        className="pl-3 pr-8 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42] bg-white min-w-[140px]"
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
        className="pl-3 pr-8 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42] bg-white min-w-[120px]"
      >
        <option value="all">All Years</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>

  {/* Results count */}
  <p className="text-xs text-gray-400 mt-2">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
</div>
            {/* <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42]"
            >
              <option value="all">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select> */}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["#", "Period", "Gross Salary", "Deductions", "Net Salary", "Payment Date", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap border-b border-gray-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No payslips found</td></tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {MONTHS[p.month - 1]} {p.year}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">₹{fmt(p.gross_salary)}</td>
                    <td className="px-4 py-3.5 text-red-500">-₹{fmt(p.total_deductions)}</td>
                    <td className="px-4 py-3.5 font-bold text-gray-900">₹{fmt(p.net_salary)}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => router.push(`/payslips/${p.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No payslips found</p>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-gray-400" />
                    <span className="font-semibold text-gray-800 text-sm">{MONTHS[p.month - 1]} {p.year}</span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-400">Gross</p>
                    <p className="text-xs font-semibold text-gray-700">₹{fmt(p.gross_salary)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-400">Deductions</p>
                    <p className="text-xs font-semibold text-red-500">-₹{fmt(p.total_deductions)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-400">Net</p>
                    <p className="text-xs font-bold text-[#ff8c42]">₹{fmt(p.net_salary)}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/payslips/${p.id}`)}
                  className="w-full py-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-medium text-blue-600 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                >
                  <Eye size={14} /> View Details
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}