"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Eye, Pencil, Trash2, X,
  RefreshCw, Loader2, AlertTriangle, CheckCircle2,
  ChevronRight, SlidersHorizontal, User, BadgeDollarSign,
  DollarSign, Calendar, FileText, Hash, LayoutGrid,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api";
const API_AUTH = "http://localhost:8080/api/auth";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");

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

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i); // 2025..2030

// ── helpers ───────────────────────────────────────────────────────────────────
const monthName  = (m) => MONTHS.find(x => x.value === +m)?.label ?? m;
const fmtAmount  = (a) => ` ${parseFloat(a).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border
      ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  );
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────
function ConfirmDialog({ name, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-base">Delete Variable Input</p>
            <p className="text-gray-500 text-sm mt-1">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{name}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drawer (Add / Edit / View) ────────────────────────────────────────────────
function Drawer({ mode, record, employees, components, onClose, onSaved, showToast }) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    user_id:      record?.user?.id      ?? record?.user_id      ?? "",
    component_id: record?.component?.id ?? record?.component_id ?? "",
    amount:       record?.amount        ?? "",
    month:        record?.month         ?? new Date().getMonth() + 1,
    year:         record?.year          ?? currentYear,
    remarks:      record?.remarks       ?? "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const url = isEdit
        ? `${API_BASE}/variable-inputs/update/${record.id}`
        : `${API_BASE}/variable-inputs/add`;
      const method = isEdit ? "PUT" : "POST";
      const body   = isEdit
        ? { amount: +form.amount, month: +form.month, year: +form.year, remarks: form.remarks }
        : { user_id: +form.user_id, component_id: +form.component_id, amount: +form.amount, month: +form.month, year: +form.year, remarks: form.remarks };

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast(isEdit ? "Updated successfully!" : "Variable input added!", "success");
      onSaved();
      onClose();
    } catch (e) {
      showToast(e.message || "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  // input styles matching asset categories look
  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white disabled:bg-gray-50 disabled:text-gray-500";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9990] bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full z-[9991] w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center
              ${isView ? "bg-blue-100" : isEdit ? "bg-amber-100" : "bg-orange-100"}`}>
              {isView
                ? <Eye size={17} className="text-blue-500" />
                : isEdit
                ? <Pencil size={17} className="text-amber-500" />
                : <Plus size={17} className="text-orange-500" />}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-base leading-tight">
                {isView ? "View Input" : isEdit ? "Edit Input" : "Add Variable Input"}
              </p>
              <p className="text-xs text-gray-400">
                {isView ? "Viewing details" : isEdit ? "Update variable input" : "Create a new variable input"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Employee */}
          <div>
            <label className={labelCls}>Employee</label>
            {isView || isEdit ? (
              <input disabled value={record?.user ? `${record.user.first_name} ${record.user.last_name}` : "—"} className={inputCls} />
            ) : (
              <select className={inputCls} value={form.user_id} onChange={e => set("user_id", e.target.value)}>
                <option value="">Select employee…</option>
                {employees.map(u => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name} (ID: {u.id})</option>
                ))}
              </select>
            )}
          </div>

          {/* Component */}
          <div>
            <label className={labelCls}>Salary Component</label>
            {isView || isEdit ? (
              <input disabled value={record?.component?.component_name ?? "—"} className={inputCls} />
            ) : (
              <select className={inputCls} value={form.component_id} onChange={e => set("component_id", e.target.value)}>
                <option value="">Select component…</option>
                {components.map(c => (
                  <option key={c.id} value={c.id}>{c.component_name} (ID: {c.id})</option>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className={labelCls}>Amount</label>
            {isView ? (
              <input disabled value={fmtAmount(record?.amount)} className={inputCls} />
            ) : (
              <input
                type="number" min="1" placeholder="e.g. 5000"
                className={inputCls} value={form.amount}
                onChange={e => set("amount", e.target.value)}
              />
            )}
          </div>

          {/* Month / Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Month</label>
              {isView ? (
                <input disabled value={monthName(record?.month)} className={inputCls} />
              ) : (
                <select className={inputCls} value={form.month} onChange={e => set("month", e.target.value)}>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className={labelCls}>Year</label>
              {isView ? (
                <input disabled value={record?.year} className={inputCls} />
              ) : (
                <select className={inputCls} value={form.year} onChange={e => set("year", e.target.value)}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className={labelCls}>Remarks</label>
            {isView ? (
              <textarea disabled value={record?.remarks ?? "—"} rows={3} className={inputCls + " resize-none"} />
            ) : (
              <textarea
                rows={3} placeholder="Optional remarks…"
                className={inputCls + " resize-none"}
                value={form.remarks} onChange={e => set("remarks", e.target.value)}
              />
            )}
          </div>

          {/* View-mode extra info */}
          {isView && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Meta Info</p>
              <div className="flex justify-between"><span className="text-gray-500">Record ID</span><span className="font-semibold text-gray-700">#{record?.id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created By</span><span className="font-semibold text-gray-700">User #{record?.created_by}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created At</span><span className="font-semibold text-gray-700">{new Date(record?.created_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Updated At</span><span className="font-semibold text-gray-700">{new Date(record?.updated_at).toLocaleDateString()}</span></div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isView && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit} disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEdit ? "Save Changes" : "Add Input"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VariableInputsPage() {
  const [records,    setRecords]    = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [components, setComponents] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear,  setFilterYear]  = useState("");
  const [drawer,     setDrawer]     = useState(null); // { mode, record }
  const [confirm,    setConfirm]    = useState(null); // record
  const [toast,      setToast]      = useState(null);

  const showToast = (message, type) => setToast({ message, type });

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const token = getToken();
      const h     = { Authorization: `Bearer ${token}` };
      const [recRes, empRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/variable-inputs`, { headers: h }),
        fetch(`${API_AUTH}/all`, { headers: h }),
        fetch(`${API_BASE}/salary-components`, { headers: h }),
      ]);
      const [rec, emp, comp] = await Promise.all([recRes.json(), empRes.json(), compRes.json()]);
      if (rec.success)  setRecords(rec.data ?? []);
      if (emp.success)  setEmployees(emp.users ?? emp.data ?? []);
      if (comp.success) setComponents((comp.data ?? []).filter(c => c.calculation_type === "variable"));
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async () => {
    try {
      const token = getToken();
      const res   = await fetch(`${API_BASE}/variable-inputs/delete/${confirm.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast("Deleted successfully!", "success");
      fetchAll(true);
    } catch (e) {
      showToast(e.message || "Delete failed", "error");
    } finally {
      setConfirm(null);
    }
  };

  // ── Filters ────────────────────────────────────────────────────────────────
  const filtered = records.filter(r => {
    const name = `${r.user?.first_name} ${r.user?.last_name}`.toLowerCase();
    const comp = (r.component?.component_name ?? "").toLowerCase();
    const q    = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || comp.includes(q);
    const matchMonth  = !filterMonth || +r.month === +filterMonth;
    const matchYear   = !filterYear  || +r.year  === +filterYear;
    return matchSearch && matchMonth && matchYear;
  });

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalAmount = records.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const uniqueEmps  = new Set(records.map(r => r.user_id)).size;
  const thisMonth   = records.filter(r => r.month === new Date().getMonth() + 1 && r.year === currentYear).length;

  return (
    <div className="min-h-screen bg-[#f8f9fb] p-4 md:p-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
            <SlidersHorizontal size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-0.5">
              <span>Payroll</span>
              <ChevronRight size={14} />
              <span className="text-gray-600 font-medium">Variable Inputs</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Variable Inputs</h1>
            <p className="text-sm text-gray-400">Manage employee variable salary inputs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAll(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-orange-500 hover:border-orange-300 transition-all"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setDrawer({ mode: "add", record: null })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all shadow-md shadow-orange-200"
          >
            <Plus size={16} />
            <span>Add Input</span>
          </button>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Records",    value: records.length,                          icon: LayoutGrid,       color: "text-orange-500",  bg: "bg-orange-50"  },
          { label: "Total Amount",     value: `${(totalAmount/1000).toFixed(1)}k`,    icon: DollarSign,       color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Employees",        value: uniqueEmps,                              icon: User,             color: "text-blue-500",    bg: "bg-blue-50"    },
          { label: "This Month",       value: thisMonth,                               icon: Calendar,         color: "text-purple-500",  bg: "bg-purple-50"  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table Card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by employee or component…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
            value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          >
            <option value="">All Months</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
            value={filterYear} onChange={e => setFilterYear(e.target.value)}
          >
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex items-center text-sm text-gray-400 whitespace-nowrap px-1">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Desktop Table ──────────────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Employee", "Component", "Amount", "Period", "Remarks", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <Loader2 size={28} className="animate-spin mx-auto mb-2 text-orange-400" />
                  <p className="text-sm">Loading…</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <SlidersHorizontal size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">No variable inputs found</p>
                  <p className="text-sm text-gray-300 mt-1">Try adjusting your filters</p>
                </td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors group">
                    <td className="px-5 py-4 text-sm text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-orange-500">
                            {(r.user?.first_name?.[0] ?? "?")}{(r.user?.last_name?.[0] ?? "")}
                          </span>
                        </div>
                   <span className="text-sm font-semibold text-black dark:text-white">
  {r.user
    ? `${r.user.first_name} ${r.user.last_name}`
    : `User #${r.user_id}`}
</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                        <BadgeDollarSign size={12} />
                        {r.component?.component_name ?? `Comp #${r.component_id}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-gray-800">{fmtAmount(r.amount)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">{monthName(r.month)} {r.year}</span>
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      <span className="text-sm text-gray-500 truncate block">{r.remarks || "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDrawer({ mode: "view", record: r })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all"
                          title="View"
                        ><Eye size={15} /></button>
                        <button
                          onClick={() => setDrawer({ mode: "edit", record: r })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-50 transition-all"
                          title="Edit"
                        ><Pencil size={15} /></button>
                        <button
                          onClick={() => setConfirm(r)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"
                          title="Delete"
                        ><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Card Layout ─────────────────────────────────────── */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Loader2 size={28} className="animate-spin mb-2 text-orange-400" />
              <p className="text-sm">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <SlidersHorizontal size={36} className="mb-3 text-gray-200" />
              <p className="font-medium">No variable inputs found</p>
            </div>
          ) : (
            filtered.map((r, i) => (
              <div key={r.id} className="p-4 hover:bg-orange-50/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-orange-500">
                        {(r.user?.first_name?.[0] ?? "?")}{(r.user?.last_name?.[0] ?? "")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {r.user ? `${r.user.first_name} ${r.user.last_name}` : `User #${r.user_id}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{monthName(r.month)} {r.year}</p>
                    </div>
                  </div>
                  <p className="font-bold text-orange-500 text-sm flex-shrink-0">{fmtAmount(r.amount)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                    <BadgeDollarSign size={11} />
                    {r.component?.component_name ?? `Comp #${r.component_id}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setDrawer({ mode: "view", record: r })} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"><Eye size={15} /></button>
                    <button onClick={() => setDrawer({ mode: "edit", record: r })} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all"><Pencil size={15} /></button>
                    <button onClick={() => setConfirm(r)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={15} /></button>
                  </div>
                </div>
                {r.remarks && <p className="text-xs text-gray-400 mt-2 truncate">{r.remarks}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Overlays ──────────────────────────────────────────────────── */}
      {drawer && (
        <Drawer
          mode={drawer.mode}
          record={drawer.record}
          employees={employees}
          components={components}
          onClose={() => setDrawer(null)}
          onSaved={() => fetchAll(true)}
          showToast={showToast}
        />
      )}
      {confirm && (
        <ConfirmDialog
          name={`${confirm.user?.first_name ?? ""} ${confirm.user?.last_name ?? ""}`.trim() || `#${confirm.id}`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}