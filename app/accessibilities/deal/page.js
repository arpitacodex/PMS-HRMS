"use client";

import { useEffect, useState, useCallback } from "react";

const API = "http://localhost:8080/api/deal";

const EMPTY_FORM = {
  title: "",
  lead_id: "",
  client_id: "",
  bid_id: "",
  assigned_to: "",
  deal_value: "",
  closing_date: "",
  status: "won",
  description: "",
};

const STATUS_STYLES = {
  won: "bg-green-50 text-green-600 border border-green-200",
  lost: "bg-red-50 text-red-500 border border-red-200",
  pending: "bg-yellow-50 text-yellow-600 border border-yellow-200",
  active: "bg-blue-50 text-blue-600 border border-blue-200",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500 border border-gray-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === "won" ? "bg-green-500" :
        status === "lost" ? "bg-red-500" :
        status === "pending" ? "bg-yellow-500" :
        status === "active" ? "bg-blue-500" : "bg-gray-400"
      }`} />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
    </span>
  );
}

function DealNumberBadge({ number }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded text-xs font-bold tracking-wide"
      style={{ background: "#FFF3E8", color: "#E07120", border: "1px solid #FDD9B5" }}>
      {number}
    </span>
  );
}

function MobileDealCard({ deal, onView, onEdit, onDelete, onRestore, onDuplicate }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <DealNumberBadge number={deal.deal_number ?? `#${deal.id}`} />
          <h3 className="font-semibold text-gray-800 mt-1.5 text-sm">{deal.title}</h3>
        </div>
        <StatusBadge status={deal.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Client</span>
          <span className="font-medium text-gray-700 text-xs">{deal.client?.contact_person_name || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Amount</span>
          <span className="font-semibold text-gray-800 text-xs">
            {deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : "—"}
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-gray-400 block mb-0.5">Closing Date</span>
          <span className="text-gray-600 text-xs">
            {deal.closing_date
              ? new Date(deal.closing_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
              : "—"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
        <button onClick={() => onView(deal.id)} className="flex-1 py-1.5 rounded-lg text-sky-500 hover:bg-sky-50 text-xs font-medium transition-all">View</button>
        <button onClick={() => onEdit(deal.id)} className="flex-1 py-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 text-xs font-medium transition-all">Edit</button>
        <button onClick={() => onDuplicate(deal)} className="flex-1 py-1.5 rounded-lg text-amber-500 hover:bg-amber-50 text-xs font-medium transition-all">Copy</button>
        {deal.deletedAt ? (
          <button onClick={() => onRestore(deal.id)} className="flex-1 py-1.5 rounded-lg text-green-500 hover:bg-green-50 text-xs font-medium transition-all">Restore</button>
        ) : (
          <button onClick={() => onDelete(deal.id)} className="flex-1 py-1.5 rounded-lg text-red-400 hover:bg-red-50 text-xs font-medium transition-all">Delete</button>
        )}
      </div>
    </div>
  );
}

function Drawer({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} />
      <div className={`fixed top-0 right-0 h-full z-50 w-full sm:max-w-xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: "#F97316" }} />
            <div>
              <h2 className="text-base font-bold text-gray-800">{title}</h2>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors text-sm font-bold shrink-0">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="px-5 py-4 flex items-center justify-end gap-2 border-t border-gray-100 shrink-0">{footer}</div>}
      </div>
    </>
  );
}

function Modal({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 animate-modal-in">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: "#F97316" }} />
            <div>
              <h2 className="text-base font-bold text-gray-800">{title}</h2>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors text-sm font-bold">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 pb-5 pt-3 flex gap-3 justify-end border-t border-gray-100">{footer}</div>}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:border-orange-400 transition-all placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed";
const labelCls = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewData, setViewData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState([]);
  const [bids, setBids] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [clientRes, bidRes, leadRes, userRes] = await Promise.all([
        fetch("http://localhost:8080/api/client/all", { headers }),
        fetch("http://localhost:8080/api/bid/all", { headers }),
        fetch("http://localhost:8080/api/lead/all", { headers }),
        fetch("http://localhost:8080/api/auth/all", { headers }),
      ]);
      const clientData = await clientRes.json();
      const bidData = await bidRes.json();
      const leadData = await leadRes.json();
      const userData = await userRes.json();

      setClients(clientData.clients || []);
      setBids(bidData.bids || []);
      setLeads(leadData.data || []);
      setUsers(userData.users || userData.data || []);
    } catch (err) {
      console.error("Dropdown fetch error:", err);
    }
  }, []);

  useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API}/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : data.deals || data.data || []);
    } catch {
      setDeals([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token") || "";
    return fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
  };

  useEffect(() => {
    let result = deals;
    if (search) {
      result = result.filter((d) =>
        (d.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (d.deal_number ?? "").toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter) result = result.filter((d) => d.status === statusFilter);
    setFiltered(result);
    setPage(1);
  }, [search, statusFilter, deals]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageSlice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  async function openEdit(id) {
    try {
      const res = await fetchWithAuth(`${API}/${id}`);
      const data = await res.json();
      const d = data.deal;
      setForm({
        title: d.title ?? "",
        lead_id: d.lead_id ?? "",
        client_id: d.client_id ?? "",
        bid_id: d.bid_id ?? "",
        assigned_to: d.assigned_to ?? "",
        deal_value: d.deal_value ?? "",
        closing_date: d.closing_date ? d.closing_date.substring(0, 10) : "",
        status: d.status ?? "won",
        description: d.description ?? "",
      });
      setEditingId(id);
      setDrawerOpen(true);
    } catch {
      showToast("error", "Error", "Could not load deal.");
    }
  }

  async function openView(id) {
    try {
      const res = await fetchWithAuth(`${API}/${id}`);
      const data = await res.json();
      setViewData(data.deal);
      setViewOpen(true);
    } catch {
      showToast("error", "Error", "Could not load deal.");
    }
  }

  function handleDuplicate(deal) {
    setForm({ ...EMPTY_FORM, title: deal.title, client_id: deal.client_id, lead_id: deal.lead_id, deal_value: deal.deal_value, description: deal.description });
    setEditingId(null);
    setDrawerOpen(true);
  }

  async function submitDeal() {
    if (!editingId && (!form.title || !form.lead_id || !form.client_id)) {
      showToast("warning", "Required Fields", "Title, Lead and Client are required.");
      return;
    }
    setSubmitting(true);
    try {
      const body = { ...form };
      ["bid_id", "assigned_to", "deal_value", "lead_id", "client_id"].forEach((k) => {
        if (body[k] !== "" && body[k] != null) body[k] = Number(body[k]);
        else delete body[k];
      });
      if (!body.closing_date) delete body.closing_date;
      if (!body.description) delete body.description;
      const res = await fetchWithAuth(
        editingId ? `${API}/update/${editingId}` : `${API}/create`,
        { method: editingId ? "PUT" : "POST", body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setDrawerOpen(false);
      await fetchDeals();
      showToast("success", editingId ? "Deal Updated!" : "Deal Created!", data.message ?? "Done.");
    } catch (e) {
      showToast("error", "Failed", e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteDeal(id) {
    const confirmed = await showConfirm("Delete this deal?", "This action cannot be undone.");
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`${API}/delete/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchDeals();
      showToast("success", "Deleted!", "Deal removed.");
    } catch (e) {
      showToast("error", "Error", e.message);
    }
  }

  async function restoreDeal(id) {
    const confirmed = await showConfirm("Restore this deal?", "Deal will become active again.");
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`${API}/restore/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchDeals();
      showToast("success", "Restored!", "Deal is active again.");
    } catch (e) {
      showToast("error", "Error", e.message);
    }
  }

// ── Advanced Toast (branded, animated, pauses on hover) ──
function showToast(icon, title, text) {
  if (typeof window === "undefined" || !window.Swal) return;

  const Toast = window.Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (el) => {
      el.addEventListener("mouseenter", window.Swal.stopTimer);
      el.addEventListener("mouseleave", window.Swal.resumeTimer);
    },
    customClass: {
      popup: "rounded-xl shadow-lg border border-gray-100",
    },
  });

  Toast.fire({
    icon,
    title,
    text,
    iconColor:
      icon === "success" ? "#22C55E" :
      icon === "error" ? "#EF4444" :
      icon === "warning" ? "#F97316" : "#3B82F6",
  });
}

// ── Advanced Confirm (custom buttons, icon color, animation) ──
async function showConfirm(title, text, opts = {}) {
  if (typeof window === "undefined" || !window.Swal) return window.confirm(`${title}\n${text}`);

  const result = await window.Swal.fire({
    title,
    text,
    icon: opts.icon ?? "warning",
    iconColor: opts.danger ? "#EF4444" : "#F97316",
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? "Yes, proceed",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: "rounded-2xl px-2",
      confirmButton: `px-5 py-2.5 rounded-xl text-white text-sm font-semibold mx-1.5 shadow-md transition-all ${
        opts.danger ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
      }`,
      cancelButton: "px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold mx-1.5 bg-white hover:border-orange-400 hover:text-orange-500 transition-all",
    },
    showClass: { popup: "animate-modal-in" },
  });

  return result.isConfirmed;
}

  async function showConfirm(title, text) {
    if (typeof window === "undefined" || !window.Swal) return window.confirm(`${title}\n${text}`);
    const result = await window.Swal.fire({
      title, text, icon: "warning", showCancelButton: true,
      confirmButtonColor: "#F97316", confirmButtonText: "Yes, proceed",
    });
    return result.isConfirmed;
  }

  // Helper: get user display name by id
  const getUserName = (id) => {
    const u = users.find((u) => u.id === Number(id));
    return u ? `${u.first_name} ${u.last_name}` : id ? `User #${id}` : "—";
  };

  return (
    <>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.10.5/sweetalert2.min.js" async />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.10.5/sweetalert2.min.css" />

      <div className="min-h-screen w-full bg-[#F5F6FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 leading-tight">
                <span className="text-gray-800">Deal</span>{" "}
                <span className="font-extrabold" style={{ color: "#F97316" }}>Management</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">PMS HRMS · Sales Module</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none shadow-sm w-52 placeholder:text-gray-400 transition-all"
                  placeholder="Search by name, deal…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none shadow-sm cursor-pointer transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
              </select>

              <button
                onClick={fetchDeals}
                title="Refresh"
                className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:border-orange-400 hover:text-orange-500 shadow-sm transition-all"
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>

              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                style={{ background: "#F97316" }}
                onMouseEnter={e => e.currentTarget.style.background = "#EA6A05"}
                onMouseLeave={e => e.currentTarget.style.background = "#F97316"}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create Deal</span>
              </button>
            </div>
          </div>

          {/* ── Table Card ── */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ overflowX: "visible" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: "#F97316" }} />
                <span className="font-semibold text-gray-700 text-sm">All Deals</span>
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 font-medium">
                {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-sm"style={{ minWidth: "700px" }}>
                
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {["DEAL #", "TITLE", "CLIENT", "STATUS", "ACTIONS"].map((h) => (
                      <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-3 bg-gray-100 rounded-full animate-pulse" style={{ width: `${45 + j * 9}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : pageSlice.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl">📭</span>
                          <span className="text-sm font-medium text-gray-400">No deals found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageSlice.map((d) => (
                      <tr key={d.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                        <td className="px-6 py-4"><DealNumberBadge number={d.deal_number ?? `#${d.id}`} /></td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-700 max-w-[160px] block truncate" title={d.title}>{d.title}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{d.client?.contact_person_name ?? "—"}</td>
                        {/* <td className="px-6 py-4">
                          <span className="font-semibold text-gray-800">
                            {d.deal_value ? `$${Number(d.deal_value).toLocaleString()}` : "—"}
                          </span>
                        </td> */}
                        {/* <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {d.closing_date ? new Date(d.closing_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—"}
                        </td> */}
                        <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-0.5">
                            <button title="View" onClick={() => openView(d.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-transparent transition-all duration-150 text-[#ff6b1a] hover:bg-[#ff6b1a]/10 hover:border-[#ff6b1a]/30">
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                            <button title="Edit" onClick={() => openEdit(d.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-transparent transition-all duration-150 text-amber-600 hover:bg-amber-50 hover:border-amber-200">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button title="Duplicate" onClick={() => handleDuplicate(d)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-transparent transition-all duration-150 text-violet-600 hover:bg-violet-50 hover:border-violet-200">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                            </button>
                            <button title="Delete" onClick={() => deleteDeal(d.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-transparent transition-all duration-150 text-red-500 hover:bg-red-50 hover:border-red-200">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                            {d.deletedAt && (
                              <button title="Restore" onClick={() => restoreDeal(d.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-transparent transition-all duration-150 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <polyline points="1 4 1 10 7 10"/>
                                  <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/40">
                <span className="text-xs text-gray-400">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        n === page ? "text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-400"
                      }`}
                      style={n === page ? { background: "#F97316" } : {}}
                    >{n}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Mobile Card View ── */}
          <div className="sm:hidden">
            <div className="mb-3">
              <span className="text-xs text-gray-400">
                {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                  <div className="h-4 bg-gray-100 rounded-full w-1/3 mb-3 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded-full w-full mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded-full w-2/3 animate-pulse" />
                </div>
              ))
            ) : pageSlice.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-4xl block mb-2">📭</span>
                <span className="text-sm font-medium text-gray-400">No deals found</span>
              </div>
            ) : (
              pageSlice.map((d) => (
                <MobileDealCard key={d.id} deal={d} onView={openView} onEdit={openEdit} onDelete={deleteDeal} onRestore={restoreDeal} onDuplicate={handleDuplicate} />
              ))
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 mt-4">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium disabled:opacity-50">Previous</button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════ CREATE / EDIT DRAWER ════════ */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit Deal" : "Add New Deal"}
        subtitle="PMS HRMS · Sales Module"
        footer={
          <>
            <button onClick={() => setDrawerOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:border-orange-400 hover:text-orange-500 bg-white transition-all">
              Cancel
            </button>
            <button onClick={submitDeal} disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-all disabled:opacity-60 flex items-center gap-2"
              style={{ background: "#F97316" }}
              onMouseEnter={e => !submitting && (e.currentTarget.style.background = "#EA6A05")}
              onMouseLeave={e => (e.currentTarget.style.background = "#F97316")}
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving…</span></>
              ) : editingId ? "Save Changes" : "Create Deal"}
            </button>
          </>
        }
      >
        {/* Basic Info */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 mb-4 pb-2 border-b border-gray-100 uppercase tracking-widest">Basic Info</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelCls}>Title <span className="text-red-400 normal-case font-normal">*</span></label>
              <input className={inputCls} placeholder="Deal title" value={form.title} onChange={setField("title")} />
            </div>
            <div>
              <label className={labelCls}>Lead</label>
              <select className={inputCls} value={form.lead_id} onChange={setField("lead_id")} disabled={!!editingId}>
                <option value="">Select Lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>{lead.title} ({lead.lead_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Client</label>
              <select className={inputCls} value={form.client_id} onChange={setField("client_id")} disabled={!!editingId}>
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.company_name} ({client.contact_person_name})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bid</label>
              <select className={inputCls} value={form.bid_id} onChange={setField("bid_id")}>
                <option value="">Select Bid</option>
                {bids.map((bid) => (
                  <option key={bid.id} value={bid.id}>{bid.title}</option>
                ))}
              </select>
            </div>

            {/* ── Assigned To — user dropdown ── */}
            <div>
              <label className={labelCls}>Assigned To</label>
              <select className={inputCls} value={form.assigned_to} onChange={setField("assigned_to")}>
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}{u.phone ? ` · ${u.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Deal Details */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-4 pb-2 border-b border-gray-100 uppercase tracking-widest">Deal Details</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelCls}>Deal Value ($)</label>
              <input className={inputCls} type="number" placeholder="0.00" min="0" step="0.01" value={form.deal_value} onChange={setField("deal_value")} />
            </div>
            <div>
              <label className={labelCls}>Closing Date</label>
              <input className={inputCls} type="date" value={form.closing_date} onChange={setField("closing_date")} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={setField("status")}>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={`${inputCls} resize-y min-h-[90px]`} placeholder="Optional description…" value={form.description} onChange={setField("description")} />
            </div>
          </div>
        </div>
      </Drawer>

      {/* ════════ VIEW MODAL ════════ */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Deal Details"
        subtitle="Full deal information"
        footer={
          <button onClick={() => setViewOpen(false)}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:border-orange-400 hover:text-orange-500 transition-all">
            Close
          </button>
        }
      >
        {viewData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Deal Number", val: viewData.deal_number ?? "—" },
              { label: "Status", val: <StatusBadge status={viewData.status} /> },
              { label: "Title", val: viewData.title, full: true },
              { label: "Deal Value", val: viewData.deal_value ? `$${Number(viewData.deal_value).toLocaleString()}` : "—", color: "text-green-600 font-bold" },
              { label: "Closing Date", val: viewData.closing_date ? new Date(viewData.closing_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—" },
              { label: "Lead", val: `${viewData.lead_id ?? "—"}${viewData.lead?.title ? " · " + viewData.lead.title : ""}` },
              { label: "Client", val: viewData.client?.contact_person_name ?? viewData.client_id ?? "—" },
              { label: "Bid", val: viewData.bid?.title ?? viewData.bid_id ?? "—" },
              { label: "Assigned To", val: getUserName(viewData.assigned_to) },
              { label: "Created By", val: viewData.creator ? `${viewData.creator.first_name} ${viewData.creator.last_name}` : "—" },
              { label: "Description", val: viewData.description ?? "—", full: true },
            ].map((item, i) => (
              <div key={i} className={item.full ? "sm:col-span-2" : ""}>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.label}</div>
                <div className={`bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-700 ${item.color ?? ""}`}>
                  {item.val}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <style jsx global>{`
        @keyframes modal-in {
          from { transform: scale(0.94) translateY(12px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-modal-in { animation: modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>
    </>
  );
}