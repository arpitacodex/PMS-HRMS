"use client";

import { useState, useEffect } from "react";
import {
  Search, Eye, X, RefreshCw, Loader2,
  AlertTriangle, CheckCircle2, ChevronRight,
  SlidersHorizontal, BadgeDollarSign, DollarSign,
  LayoutGrid, TrendingUp,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api";
const getToken  = () => (typeof window !== "undefined" ? localStorage.getItem("token")  : "");
const getUserId = () => (typeof window !== "undefined" ? localStorage.getItem("userId") : "");

const MONTHS = [
  { value: 1,  label: "January"   },
  { value: 2,  label: "February"  },
  { value: 3,  label: "March"     },
  { value: 4,  label: "April"     },
  { value: 5,  label: "May"       },
  { value: 6,  label: "June"      },
  { value: 7,  label: "July"      },
  { value: 8,  label: "August"    },
  { value: 9,  label: "September" },
  { value: 10, label: "October"   },
  { value: 11, label: "November"  },
  { value: 12, label: "December"  },
];

const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);

const monthName = (m) => MONTHS.find(x => x.value === +m)?.label ?? m;
const fmtAmount = (a) =>
  `₹ ${parseFloat(a).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5
      rounded-2xl shadow-2xl text-sm font-semibold border
      ${type === "success"
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : "bg-red-50 border-red-200 text-red-700"}`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  );
}

// ── View Drawer ───────────────────────────────────────────────────────────────
function ViewDrawer({ record, onClose }) {
  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 cursor-default";
  const labelCls =
    "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <>
      <div className="fixed inset-0 z-[9990] bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-[9991] w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Eye size={17} className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-base leading-tight">Input Details</p>
              <p className="text-xs text-gray-400">Viewing your variable input</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-4">
  
  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200">
    <BadgeDollarSign size={22} className="text-white" />
  </div>

<div>
  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
    Component
  </p>

  <p className="font-bold text-slate-500 text-lg leading-tight">
    {record?.component?.component_name || "Internet Allowance"}
  </p>

  <p className="text-2xl font-extrabold text-orange-500 mt-0.5">
    {fmtAmount(record?.amount)}
  </p>
</div>

</div>

          <div>
            <label className={labelCls}>Period</label>
            <input readOnly value={`${monthName(record?.month)} ${record?.year}`} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Remarks</label>
            <textarea readOnly rows={3} value={record?.remarks || "—"} className={inputCls + " resize-none"} />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Record Info</p>
            <div className="flex justify-between">
              <span className="text-gray-500">Record ID</span>
              <span className="font-semibold text-gray-700">#{record?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created At</span>
              <span className="font-semibold text-gray-700">
                {new Date(record?.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyVariableInputsPage() {
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [showAll,    setShowAll]    = useState(false);       // ✅ NEW: all-months toggle

  // ✅ Always valid — avoids 400 Bad Request
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear,  setFilterYear]  = useState(currentYear);

  const [viewing, setViewing] = useState(null);
  const [toast,   setToast]   = useState(null);

  const showToast = (message, type) => setToast({ message, type });

  // Fetch one month/year (backend requires both — never omit them)
  const fetchSingle = async (month, year, token, userId) => {
    const url = `${API_BASE}/variable-inputs/user/inputs?user_id=${userId}&month=${month}&year=${year}`;
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return data.success ? (data.data ?? []) : [];
  };

  // ✅ "Show All" — fetch all 12 months for the chosen year in parallel
  const fetchAllMonths = async (year, token, userId) => {
    const results = await Promise.all(
      MONTHS.map(m => fetchSingle(m.value, year, token, userId))
    );
    return results.flat();
  };

  const fetchRecords = async (silent = false) => {
    const userId = getUserId();
    if (!userId) return;
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const token = getToken();
      const data  = showAll
        ? await fetchAllMonths(filterYear, token, userId)
        : await fetchSingle(filterMonth, filterYear, token, userId);
      setRecords(data);
    } catch {
      showToast("Failed to load your inputs", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [filterMonth, filterYear, showAll]);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return (
      !q ||
      (r.component?.component_name ?? "").toLowerCase().includes(q) ||
      (r.remarks ?? "").toLowerCase().includes(q)
    );
  });

  const totalAmount = records.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  const emptyLabel = showAll
    ? `all months ${filterYear}`
    : `${monthName(filterMonth)} ${filterYear}`;

  return (
    <div className="min-h-screen bg-[#f8f9fb] p-4 md:p-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
            <SlidersHorizontal size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-0.5">
              <span>Payroll</span>
              <ChevronRight size={14} />
              <span className="text-gray-600 font-medium">My Variable Inputs</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">My Variable Inputs</h1>
            <p className="text-sm text-gray-400">Your variable salary components</p>
          </div>
        </div>
        <button
          onClick={() => fetchRecords(true)}
          className="self-start sm:self-auto w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-orange-500 hover:border-orange-300 transition-all"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Records", value: records.length,                                icon: LayoutGrid, color: "text-orange-500",  bg: "bg-orange-50"  },
          { label: "Total Amount",  value: fmtAmount(totalAmount),                         icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Components",    value: new Set(records.map(r => r.component_id)).size, icon: TrendingUp, color: "text-blue-500",    bg: "bg-blue-50"    },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color} truncate`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100">

          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by component or remarks…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700
                focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Month select — hidden when showAll is active */}
          {!showAll && (
            <select
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600
                focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
              value={filterMonth}
              onChange={e => setFilterMonth(Number(e.target.value))}
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          )}

          {/* Year select */}
          <select
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600
              focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* ✅ Show All Months toggle button */}
          <button
            onClick={() => setShowAll(v => !v)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap
              ${showAll
                ? "bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
                : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500"
              }`}
          >
            {showAll ? "Showing All Months" : "Show All Months"}
          </button>

          <div className="flex items-center text-sm text-gray-400 whitespace-nowrap px-1">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Desktop Table ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Component", "Amount", "Period", "Remarks", "Action"].map(h => (
                  <th key={h}
                    className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <Loader2 size={28} className="animate-spin mx-auto mb-2 text-orange-400" />
                  <p className="text-sm">Loading your inputs…</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <SlidersHorizontal size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">No inputs found</p>
                  <p className="text-sm text-gray-300 mt-1">No variable inputs for {emptyLabel}</p>
                </td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                        <BadgeDollarSign size={12} />
                        {r.component?.component_name ?? `Component #${r.component_id}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-gray-800">{fmtAmount(r.amount)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">{monthName(r.month)} {r.year}</span>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <span className="text-sm text-gray-500 truncate block">{r.remarks || "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setViewing(r)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all"
                        title="View details"
                      ><Eye size={15} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Cards ── */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Loader2 size={28} className="animate-spin mb-2 text-orange-400" />
              <p className="text-sm">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <SlidersHorizontal size={36} className="mb-3 text-gray-200" />
              <p className="font-medium">No inputs found</p>
              <p className="text-sm mt-1 text-gray-300">No variable inputs for {emptyLabel}</p>
            </div>
          ) : (
            filtered.map(r => (
              <div key={r.id} className="p-4 hover:bg-orange-50/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <BadgeDollarSign size={18} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {r.component?.component_name ?? `Component #${r.component_id}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{monthName(r.month)} {r.year}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-orange-500 text-sm">{fmtAmount(r.amount)}</p>
                    <button
                      onClick={() => setViewing(r)}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium"
                    >
                      <Eye size={11} /> View
                    </button>
                  </div>
                </div>
                {r.remarks && (
                  <p className="text-xs text-gray-400 mt-2 truncate">{r.remarks}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {viewing && <ViewDrawer record={viewing} onClose={() => setViewing(null)} />}
      {toast    && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}