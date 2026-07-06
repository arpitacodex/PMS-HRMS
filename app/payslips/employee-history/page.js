"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  History, Search, ChevronDown, Eye, Users,
  DollarSign, CheckCircle2, Clock, TrendingUp,
  RefreshCw, Calendar,
} from "lucide-react";
import PageHeader from "@/components/payroll/PageHeader";
import StatusBadge from "@/components/payroll/StatusBadge";
import { fetchPayrollByUser, fetchAllUsers, MONTHS, fmt } from "@/lib/payrollApi";

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
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

export default function EmployeeHistoryPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const defaultUser  = searchParams.get("userId") || "";

  const [users,      setUsers]      = useState([]);
  const [selectedId, setSelectedId] = useState(defaultUser);
  const [payrolls,   setPayrolls]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [toast,      setToast]      = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter,   setYearFilter]   = useState("all");

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load users list
  useEffect(() => {
    fetchAllUsers()
      .then((res) => {
        const list = res.data || res.users || res || [];
        setUsers(list.filter((u) => u.status === "active"));
      })
      .catch(() => showToast("Failed to load users"))
      .finally(() => setUsersLoading(false));
  }, []);

  // Auto-load if userId in query param
  useEffect(() => {
    if (defaultUser) loadHistory(defaultUser);
  }, [defaultUser]);

  const loadHistory = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    setPayrolls([]);
    try {
      const res = await fetchPayrollByUser(userId);
      setPayrolls(res.data || []);
    } catch {
      showToast("Failed to load payroll history");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUserChange = (userId) => {
    setSelectedId(userId);
    setStatusFilter("all");
    setYearFilter("all");
    if (userId) loadHistory(userId);
    else setPayrolls([]);
  };

  const selectedUser = users.find((u) => String(u.id) === String(selectedId));

  // Filtered users for dropdown search
  const filteredUsers = users.filter((u) => {
    const name = `${u.first_name} ${u.last_name} ${u.employee_code}`.toLowerCase();
    return name.includes(userSearch.toLowerCase());
  });

  // Payroll filters
  const years = [...new Set(payrolls.map((p) => p.year))].sort((a, b) => b - a);
  const filtered = payrolls.filter((p) => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchYear   = yearFilter   === "all" || p.year === Number(yearFilter);
    return matchStatus && matchYear;
  });

  // Stats for selected employee
  const totalNet  = payrolls.filter((p) => p.status === "paid").reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
  const paid      = payrolls.filter((p) => p.status === "paid").length;
  const pending   = payrolls.filter((p) => p.status !== "paid").length;
  const avgNet    = payrolls.length ? payrolls.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0) / payrolls.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.msg}
        </div>
      )}

      <PageHeader
        icon={History}
        title="Employee Payroll History"
        subtitle="View complete payroll records for any employee"
        breadcrumbs={[{ label: "Payslips", href: "/payslips" }, { label: "Employee History" }]}
      />

      {/* Employee Selector */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Select Employee</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search employee by name or code…"
              className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white"
            />
          </div>
          <div className="relative sm:w-72">
            <select
              value={selectedId}
              onChange={(e) => handleUserChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 appearance-none bg-white"
            >
              <option value="">— Select an employee —</option>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.employee_code})
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Selected employee card */}
        {selectedUser && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {`${selectedUser.first_name?.[0] || ""}${selectedUser.last_name?.[0] || ""}`.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm">{selectedUser.first_name} {selectedUser.last_name}</p>
              <p className="text-xs text-gray-400">{selectedUser.employee_code} · {selectedUser.email}</p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {selectedUser.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats — only show after selecting */}
      {selectedId && payrolls.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Payrolls" value={payrolls.length}       icon={History}      iconBg="bg-blue-50"    iconColor="text-blue-600"    sub="All time"            />
          <StatCard label="Paid"           value={paid}                  icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" sub="Completed"           />
          <StatCard label="Pending"        value={pending}               icon={Clock}        iconBg="bg-amber-50"   iconColor="text-amber-600"   sub="Awaiting payment"   />
          <StatCard label="Avg Net Salary" value={`₹${fmt(avgNet)}`}    icon={TrendingUp}   iconBg="bg-orange-50"  iconColor="text-orange-500"  sub="Per payroll"        />
        </div>
      )}

      {/* Payroll table */}
      {selectedId && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">
              {loading ? "Loading…" : `${filtered.length} payroll records`}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white"
              >
                <option value="all">All Years</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="processed">Processed</option>
                <option value="pending">Pending</option>
              </select>
              <button
                onClick={() => loadHistory(selectedId)}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors bg-white"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Period", "Gross Salary", "Deductions", "Net Salary", "Payment Date", "Mode", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Calendar size={32} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No payroll records found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{MONTHS[p.month - 1]} {p.year}</td>
                      <td className="px-4 py-3.5 text-gray-700">₹{fmt(p.gross_salary)}</td>
                      <td className="px-4 py-3.5 text-red-500">-₹{fmt(p.total_deductions)}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">₹{fmt(p.net_salary)}</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs capitalize">
                        {p.payment_mode?.replace("_", " ") || "—"}
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => router.push(`/payslips/${p.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Eye size={12} /> View
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
              <div className="p-8 text-center">
                <Calendar size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No payroll records found</p>
              </div>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-gray-400" />
                      <span className="font-semibold text-gray-800 text-sm">{MONTHS[p.month - 1]} {p.year}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-md p-2">
                      <p className="text-[10px] text-gray-400">Gross</p>
                      <p className="text-xs font-semibold text-gray-700">₹{fmt(p.gross_salary)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-2">
                      <p className="text-[10px] text-gray-400">Deductions</p>
                      <p className="text-xs font-semibold text-red-500">-₹{fmt(p.total_deductions)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-md p-2">
                      <p className="text-[10px] text-gray-400">Net</p>
                      <p className="text-xs font-bold text-orange-500">₹{fmt(p.net_salary)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/payslips/${p.id}`)}
                    className="w-full py-2 rounded-md border border-blue-200 bg-blue-50 text-sm font-medium text-blue-600 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={14} /> View Payslip
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty state — no user selected */}
      {!selectedId && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-500">Select an employee above</p>
          <p className="text-sm text-gray-400 mt-1">Their complete payroll history will appear here</p>
        </div>
      )}
    </div>
  );
}