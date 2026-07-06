"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Users, ChevronDown, AlertCircle,
  CheckCircle2, XCircle, Zap, Eye, BarChart3,
  Clock, Play, Square, Search, ChevronRight,
  ArrowRight, Info,
} from "lucide-react";
import PageHeader from "@/components/payroll/PageHeader";
import {
  fetchAllUsers, generateBulkPayroll,
  MONTHS, fmt, unwrapMany,
} from "@/lib/payrollApi";

const NOW        = new Date();
const THIS_YEAR  = NOW.getFullYear();
const THIS_MONTH = NOW.getMonth() + 1;
const YEAR_OPTS  = Array.from({ length: 5 }, (_, i) => THIS_YEAR - 1 + i);

// ── Status pill for result rows ────────────────────────────────────────────
function ResultPill({ status }) {
  if (status === "success")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
        <CheckCircle2 size={12} /> Generated
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
        <XCircle size={12} /> Failed
      </span>
    );
  if (status === "running")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
        <RefreshCw size={12} className="animate-spin" /> Processing
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
      <Clock size={12} /> Queued
    </span>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "bg-blue-500" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function BulkGeneratePage() {
  const router = useRouter();

  // Config
  const [month,    setMonth]    = useState(THIS_MONTH);
  const [year,     setYear]     = useState(THIS_YEAR);

  // Employee list
  const [users,       setUsers]       = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search,      setSearch]      = useState("");
  const [selected,    setSelected]    = useState(new Set()); // Set of user IDs
  const [selectAll,   setSelectAll]   = useState(false);

  // Execution state
  const [phase,     setPhase]     = useState("config");  // "config" | "running" | "done"
  const [jobRows,   setJobRows]   = useState([]);         // { userId, name, status, netSalary, payrollId, error }
  const [processed, setProcessed] = useState(0);
  const [aborted,   setAborted]   = useState(false);
  const abortRef = { current: false };

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load users
  useEffect(() => {
    fetchAllUsers()
      .then((res) => {
        const list = unwrapMany(res).filter((u) => u.status === "active");
        setUsers(list);
        // Pre-select all
        setSelected(new Set(list.map((u) => u.id)));
        setSelectAll(true);
      })
      .catch(() => showToast("Failed to load employees", "error"))
      .finally(() => setUsersLoading(false));
  }, []);

  // Filtered employees
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return `${u.first_name} ${u.last_name} ${u.employee_code}`.toLowerCase().includes(q);
  });

  // Select / deselect
  const toggleUser = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(filtered.map((u) => u.id)));
      setSelectAll(true);
    }
  };

  // Update selectAll checkbox state when filtered changes
  useEffect(() => {
    if (filtered.length === 0) return;
    const allSelected = filtered.every((u) => selected.has(u.id));
    setSelectAll(allSelected);
  }, [selected, filtered]);

  // ── Run bulk generate ────────────────────────────────────────────────────
  const handleRun = async () => {
    const userIds = [...selected];
    if (userIds.length === 0) {
      showToast("Select at least one employee", "error");
      return;
    }

    // Build initial job rows
    const rows = userIds.map((uid) => {
      const u = users.find((x) => x.id === uid);
      return {
        userId: uid,
        name: u ? `${u.first_name} ${u.last_name}` : `User #${uid}`,
        code: u?.employee_code || "",
        status: "queued",
        netSalary: null,
        payrollId: null,
        error: null,
      };
    });

    setJobRows(rows);
    setProcessed(0);
    setAborted(false);
    setPhase("running");
    abortRef.current = false;

    // Run sequentially with live updates
    for (let i = 0; i < rows.length; i++) {
      if (abortRef.current) break;

      // Mark as running
      setJobRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r))
      );

      try {
        const res = await fetch("http://localhost:8080/api/payrolls/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ user_id: rows[i].userId, month: Number(month), year: Number(year) }),
        }).then((r) => r.json());

        const payroll = res.data || res.payroll || res;
        setJobRows((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: "success",
                  netSalary: payroll?.net_salary,
                  payrollId: payroll?.id,
                }
              : r
          )
        );
      } catch (err) {
        setJobRows((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: "error", error: err?.message || "Failed" } : r
          )
        );
      }

      setProcessed(i + 1);
    }

    setPhase("done");
  };

  // Summary stats for results
  const successCount = jobRows.filter((r) => r.status === "success").length;
  const failCount    = jobRows.filter((r) => r.status === "error").length;
  const totalNet     = jobRows
    .filter((r) => r.status === "success")
    .reduce((s, r) => s + parseFloat(r.netSalary || 0), 0);

  const selectedCount = selected.size;

  return (
   <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#ffffff' }}>
      {/* Toast Notification - Cleaner design */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white flex items-center gap-2
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.type !== "error" && <CheckCircle2 size="16" />}
          {toast.msg}
        </div>
      )}

      <PageHeader
        icon={RefreshCw}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        title="Bulk Generate Payroll"
        subtitle="Generate payroll for multiple employees in one run"
        breadcrumbs={[
          { label: "Payslips", href: "/payslips" },
          { label: "Bulk Generate" },
        ]}
        actions={
          phase !== "config" && (
            <button
              onClick={() => { setPhase("config"); setJobRows([]); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            >
              ← New Run
            </button>
          )
        }
      />

      {/* ── CONFIG PHASE ─────────────────────────────────────────────────── */}
      {phase === "config" && (
        <div className="space-y-6">
          {/* Period selector - Clean white card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</div>
              Select Payroll Period
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Month</label>
                <div className="relative">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Year</label>
                <div className="relative">
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                  >
                    {YEAR_OPTS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Info alert - Clean design */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2.5">
              <Info size="16" className="text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Payroll will be generated for <span className="font-semibold">{MONTHS[month - 1]} {year}</span>.
                Employees with an existing payroll for this period will fail — use Recalculate instead.
              </p>
            </div>
          </div>

          {/* Employee selector - Clean white card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</div>
                Select Employees
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{selectedCount}</span> / {users.length} selected
                </span>
              </div>
            </div>

            {/* Search + select all */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 font-medium">All</span>
              </label>
              <div className="relative flex-1">
                <Search size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employees by name or code..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Employee list with hover states */}
            <div className="max-h-80 overflow-y-auto">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3">
                    <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-gray-100 rounded animate-pulse w-1/3" />
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Users size="20" className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">No employees found</p>
                </div>
              ) : (
                filtered.map((u) => {
                  const isChecked = selected.has(u.id);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors border-b border-gray-50
                        ${isChecked ? "bg-blue-50/30" : "hover:bg-gray-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleUser(u.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                      />
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold flex-shrink-0">
                        {u.first_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{u.employee_code} · {u.roles?.[0]?.display_name || "Employee"}</p>
                      </div>
                      {isChecked && (
                        <CheckCircle2 size="16" className="text-blue-500 flex-shrink-0" />
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Review & Generate - Clean white card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</div>
              Review & Generate
            </h2>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                <p className="text-xs text-gray-500">Period</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{MONTHS[month - 1]}</p>
                <p className="text-xs text-gray-400">{year}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                <p className="text-xs text-gray-500">Employees</p>
                <p className="text-2xl font-bold text-blue-600 mt-0.5">{selectedCount}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                <p className="text-xs text-gray-500">Action</p>
                <p className="text-sm font-semibold text-blue-700 mt-0.5">Generate</p>
                <p className="text-xs text-gray-500">Payrolls</p>
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={selectedCount === 0}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Play size="16" fill="white" />
              Generate Payroll for {selectedCount} Employee{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* ── RUNNING / DONE PHASE ──────────────────────────────────────────── */}
      {(phase === "running" || phase === "done") && (
        <div className="space-y-6">
          {/* Progress header - Clean card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">
                  {phase === "running" ? "Generating Payrolls..." : "Generation Complete"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {MONTHS[month - 1]} {year} · {jobRows.length} employee{jobRows.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{processed}<span className="text-gray-400 text-base font-normal"> / {jobRows.length}</span></p>
                <p className="text-xs text-gray-400">processed</p>
              </div>
            </div>
            <ProgressBar
              value={processed}
              max={jobRows.length}
              color={phase === "done" ? (failCount === 0 ? "bg-emerald-500" : "bg-blue-500") : "bg-blue-500"}
            />
            {phase === "running" && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                Please wait — do not close this page
              </p>
            )}
          </div>

          {/* Summary cards - Clean design with proper colors */}
          {phase === "done" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size="20" className="text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-emerald-700">{successCount}</p>
                <p className="text-xs text-gray-500 mt-1">Generated</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <XCircle size="20" className="text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600">{failCount}</p>
                <p className="text-xs text-gray-500 mt-1">Failed</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <BarChart3 size="20" className="text-blue-600" />
                </div>
                <p className="text-lg font-bold text-blue-600">₹{fmt(totalNet)}</p>
                <p className="text-xs text-gray-500 mt-1">Total Net</p>
              </div>
            </div>
          )}

          {/* Job rows table - Clean table design */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Processing Log</p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    {["#", "Employee", "Code", "Status", "Net Salary", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobRows.map((row, i) => (
                    <tr
                      key={row.userId}
                      className={`border-b border-gray-100 transition-colors hover:bg-gray-50
                        ${row.status === "running"  ? "bg-blue-50/40"    : ""}
                        ${row.status === "success"  ? "bg-emerald-50/30" : ""}
                        ${row.status === "error"    ? "bg-red-50/30"     : ""}
                      `}
                    >
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold flex-shrink-0">
                            {row.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{row.name}</span>
                        </div>
                       </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{row.code}</td>
                      <td className="px-4 py-3">
                        <ResultPill status={row.status} />
                        {row.error && <p className="text-xs text-red-500 mt-1">{row.error}</p>}
                        </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {row.netSalary ? `₹${fmt(row.netSalary)}` : "—"}
                        </td>
                      <td className="px-4 py-3">
                        {row.status === "success" && row.payrollId && (
                          <button
                            onClick={() => router.push(`/payslips/${row.payrollId}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                          >
                            <Eye size="12" /> View
                          </button>
                        )}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {jobRows.map((row, i) => (
                <div
                  key={row.userId}
                  className={`p-4 transition-colors
                    ${row.status === "running" ? "bg-blue-50/40"    : ""}
                    ${row.status === "success" ? "bg-emerald-50/30" : ""}
                    ${row.status === "error"   ? "bg-red-50/30"     : ""}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold">
                        {row.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{row.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{row.code}</p>
                      </div>
                    </div>
                    <ResultPill status={row.status} />
                  </div>
                  {row.netSalary && (
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">Net Salary</span>
                      <span className="text-sm font-semibold text-gray-800">₹{fmt(row.netSalary)}</span>
                    </div>
                  )}
                  {row.error && <p className="text-xs text-red-500 mt-2">{row.error}</p>}
                  {row.status === "success" && row.payrollId && (
                    <button
                      onClick={() => router.push(`/payslips/${row.payrollId}`)}
                      className="mt-3 w-full py-2 rounded-md border border-blue-200 bg-blue-50 text-xs font-medium text-blue-600 flex items-center justify-center gap-1.5"
                    >
                      <Eye size="12" /> View Payroll
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Done actions - Clean button styling */}
          {phase === "done" && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setPhase("config"); setJobRows([]); setProcessed(0); }}
                className="flex-1 py-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw size="16" /> Run Another Batch
              </button>
              <button
                onClick={() => router.push("/payslips/all")}
                className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                View All Payrolls <ArrowRight size="16" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}