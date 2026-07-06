"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const API = "http://localhost:8080/api/client";

// ── Modern SweetAlert2 theme ─────────────────────────────────
// Centralized so every alert in this file shares the same
// rounded, soft-shadow, brand-colored "modern" look instead of
// the default SweetAlert2 chrome.
const swalTheme = {
  customClass: {
    popup: "rounded-2xl !shadow-xl !p-6 font-sans",
    title: "!text-base !font-bold !text-gray-800 !mt-2",
    htmlContainer: "!text-sm !text-gray-500",
    confirmButton:
      "!rounded-xl !px-5 !py-2.5 !text-sm !font-semibold !shadow-md !ml-2",
    cancelButton:
      "!rounded-xl !px-5 !py-2.5 !text-sm !font-semibold !border !border-gray-200 !bg-white !text-gray-500 !shadow-none",
    actions: "!mt-5 !gap-2",
  },
  buttonsStyling: false,
  confirmButtonColor: undefined, // handled by customClass instead
};

// Toast instance for lightweight, non-blocking success/info pings
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener("mouseenter", Swal.stopTimer);
    el.addEventListener("mouseleave", Swal.resumeTimer);
  },
  customClass: {
    popup: "!rounded-xl !shadow-lg !py-3 !px-4 !min-h-0",
    title: "!text-sm !font-semibold !text-gray-700 !m-0",
    timerProgressBar: "!bg-[#F97316]",
  },
});

const notifySuccess = (title) =>
  Toast.fire({ icon: "success", title, iconColor: "#F97316" });

const notifyError = (title, text) =>
  Swal.fire({
    ...swalTheme,
    icon: "error",
    title,
    text,
    iconColor: "#ef4444",
    confirmButtonText: "Got it",
    customClass: {
      ...swalTheme.customClass,
      confirmButton:
        swalTheme.customClass.confirmButton + " !bg-[#F97316] !text-white",
    },
  });

const confirmAction = ({ title, text, icon = "warning", confirmText, confirmColor = "#F97316" }) =>
  Swal.fire({
    ...swalTheme,
    title,
    text,
    icon,
    iconColor: confirmColor,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      ...swalTheme.customClass,
      confirmButton:
        swalTheme.customClass.confirmButton + " !text-white",
    },
    didOpen: (popup) => {
      const btn = popup.querySelector(".swal2-confirm");
      if (btn) btn.style.background = confirmColor;
    },
  });

const EMPTY = {
  company_name: "",
  contact_person_name: "",
  contact_person_designation: "",
  email: "",
  phone: "",
  alternate_phone: "",
  website: "",
  gst_number: "",
  pan_number: "",
  billing_address: "",
  shipping_address: "",
  city: "",
  state: "",
  country: "",
  postal_code: "",
  industry: "",
  client_type: "",
  status: "active",
};

const FIELD_LABELS = {
  company_name: "Company Name",
  contact_person_name: "Contact Person",
  contact_person_designation: "Designation",
  email: "Email",
  phone: "Phone",
  alternate_phone: "Alternate Phone",
  website: "Website",
  gst_number: "GST Number",
  pan_number: "PAN Number",
  billing_address: "Billing Address",
  shipping_address: "Shipping Address",
  city: "City",
  state: "State",
  country: "Country",
  postal_code: "Postal Code",
  industry: "Industry",
  client_type: "Client Type",
  status: "Status",
};

const FIELD_GROUPS = [
  { title: "Company Info",    fields: ["company_name", "industry", "client_type", "website", "gst_number", "pan_number"] },
  { title: "Contact Details", fields: ["contact_person_name", "contact_person_designation", "email", "phone", "alternate_phone"] },
  { title: "Address",         fields: ["billing_address", "shipping_address", "city", "state", "country", "postal_code"] },
];

// ── Icons ──────────────────────────────────────────────────────
const IEye    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IEdit   = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const ITrash  = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IRestore= () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>;

// ── ActionBtn ──────────────────────────────────────────────────
function ActionBtn({ onClick, title, variant, children }) {
  const variants = {
    view:    "text-[#ff6b1a] hover:bg-[#ff6b1a]/10",
    edit:    "text-amber-600 hover:bg-amber-50",
    delete:  "text-red-500 hover:bg-red-50",
    restore: "text-emerald-600 hover:bg-emerald-50",
    followup:"text-violet-600 hover:bg-violet-50",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-105 ${variants[variant] || ""}`}
    >
      <span className="w-5 h-5 flex items-center justify-center">{children}</span>
    </button>
  );
}

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const active = (status || "").toLowerCase() === "active";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
      active ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-500 border-red-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`} />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
    </span>
  );
}

// ── Client Number Badge ────────────────────────────────────────
function ClientNumberBadge({ number }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded text-xs font-bold tracking-wide"
      style={{ background: "#FFF3E8", color: "#E07120", border: "1px solid #FDD9B5" }}>
      {number}
    </span>
  );
}

// ── Read-only field for View drawer ───────────────────────────
function ReadField({ label, value, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-700 min-h-[38px] break-words">
        {value || "—"}
      </div>
    </div>
  );
}

// ── Drawer ─────────────────────────────────────────────────────
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
      <div onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} />
      <div className={`fixed top-0 right-0 h-full z-50 w-full sm:max-w-xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: "#F97316" }} />
            <div>
              <h2 className="text-base font-bold text-gray-800">{title}</h2>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors text-sm font-bold shrink-0">
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-gray-100 shrink-0 bg-gray-50/50">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// ── Mobile Card ────────────────────────────────────────────────
function MobileClientCard({ client, onView, onEdit, onDelete, onRestore, isDeleted }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <ClientNumberBadge number={client.client_number ?? `#${client.id}`} />
          <h3 className="font-semibold text-gray-800 mt-1.5 text-sm">{client.company_name || "—"}</h3>
          {client.industry && <p className="text-xs text-gray-400 mt-0.5">{client.industry}</p>}
        </div>
        <StatusBadge status={client.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Contact</span>
          <span className="text-xs font-medium text-gray-700">{client.contact_person_name || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Phone</span>
          <span className="text-xs font-medium text-gray-700">{client.phone || "—"}</span>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-gray-400 block mb-0.5">Email</span>
          <span className="text-xs text-gray-600 truncate block">{client.email || "—"}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
        <button onClick={() => onView(client)} className="flex-1 py-1.5 rounded-lg text-[#ff6b1a] hover:bg-[#ff6b1a]/10 text-xs font-medium transition-all">View</button>
        {!isDeleted && <>
          <button onClick={() => onEdit(client)} className="flex-1 py-1.5 rounded-lg text-amber-600 hover:bg-amber-50 text-xs font-medium transition-all">Edit</button>
          <button onClick={() => onDelete(client.id)} className="flex-1 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs font-medium transition-all">Delete</button>
        </>}
        {isDeleted && (
          <button onClick={() => onRestore(client.id)} className="flex-1 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 text-xs font-medium transition-all">Restore</button>
        )}
      </div>
    </div>
  );
}

// ── Reusable input styles ──────────────────────────────────────
const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm font-medium focus:outline-none focus:border-orange-400 focus:bg-white transition-all placeholder:text-gray-400 disabled:opacity-50";
const labelCls = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

// ── Main Page ──────────────────────────────────────────────────
export default function ClientManagement() {
  const [clients,   setClients]  = useState([]);
  const [deleted,   setDeleted]  = useState([]);
  const [selected,  setSelected] = useState(null);
  const [form,      setForm]     = useState(EMPTY);
  const [drawer,    setDrawer]   = useState(null);
  const [view,      setView]     = useState("active");
  const [search,    setSearch]   = useState("");
  const [statusF,   setStatusF]  = useState("");
  const [token,     setToken]    = useState("");
  const [page,      setPage]     = useState(1);
  const [spinning,  setSpinning] = useState(false);
  const PER_PAGE = 10;

  useEffect(() => { const t = localStorage.getItem("token"); if (t) setToken(t); }, []);

  const H = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadClients = async () => {
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API}/all`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setClients(Array.isArray(d.clients) ? d.clients : []);
    } catch {}
  };

  const loadDeleted = async () => {
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API}/deleted/all`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setDeleted(Array.isArray(d.clients) ? d.clients : []);
    } catch {}
  };

  useEffect(() => { if (token) { loadClients(); loadDeleted(); } }, [token]);

  const doRefresh = async () => {
    setSpinning(true);
    await loadClients(); await loadDeleted();
    setTimeout(() => setSpinning(false), 700);
  };

  const createClient = async () => {
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      const res = await fetch(`${API}/create`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error("Create failed");
      await loadClients(); closeDrawer();
      notifySuccess("Client created!");
    } catch (err) { notifyError("Failed", err.message); }
  };

  const updateClient = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      if (!selected?.id) throw new Error("Client ID missing");
      const fd = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          fd.append(key, form[key]);
        }
      });
      const res = await fetch(`${API}/update/${selected.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.success === false) throw new Error(data.message || "Update failed");
      await loadClients();
      closeDrawer();
      notifySuccess("Client updated!");
    } catch (err) {
      notifyError("Error", err.message);
    }
  };

  const deleteClient = async (id) => {
    const r = await confirmAction({
      title: "Delete client?",
      text: "This will move the client to the deleted list.",
      icon: "warning",
      confirmText: "Yes, delete",
      confirmColor: "#F97316",
    });
    if (!r.isConfirmed) return;
    try {
      await fetch(`${API}/delete/${id}`, { method: "DELETE", headers: H });
      await loadClients(); await loadDeleted();
      notifySuccess("Client deleted");
    } catch { notifyError("Delete failed"); }
  };

  const restoreClient = async (id) => {
    const r = await confirmAction({
      title: "Restore client?",
      text: "This will move the client back to active.",
      icon: "question",
      confirmText: "Yes, restore",
      confirmColor: "#10b981",
    });
    if (!r.isConfirmed) return;
    try {
      await fetch(`${API}/restore/${id}`, { method: "PUT", headers: H });
      await loadClients(); await loadDeleted();
      notifySuccess("Client restored");
    } catch { notifyError("Restore failed"); }
  };

  const openCreate  = () => { setForm(EMPTY); setSelected(null); setDrawer("create"); };
  const openEdit    = (c) => { setSelected(c); setForm({ ...EMPTY, ...c }); setDrawer("edit"); };
  const openView    = (c) => { setSelected(c); setDrawer("view"); };
  const closeDrawer = () => setDrawer(null);
  const change      = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const list     = view === "active" ? clients : deleted;
  const filtered = list.filter(c => {
    const q  = search.toLowerCase();
    const ms = (c.company_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
    const mf = !statusF || (c.status || "").toLowerCase() === statusF.toLowerCase();
    return ms && mf;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageSlice  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const isDeleted  = view === "deleted";

  return (
    <>
      <div className="min-h-screen w-full bg-[#F5F6FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 leading-tight">
                Client{" "}
                <span className="font-extrabold" style={{ color: "#F97316" }}>Management</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">PMS HRMS · Sales Module</p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input type="text"
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none shadow-sm w-52 placeholder:text-gray-400 transition-all"
                  placeholder="Search by name, email…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>

              {/* Status Filter */}
              <select
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none shadow-sm cursor-pointer transition-all"
                value={statusF}
                onChange={e => { setStatusF(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Toggle Active/Deleted */}
              <button
                onClick={() => { setView(v => v === "active" ? "deleted" : "active"); setPage(1); }}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-500 shadow-sm transition-all whitespace-nowrap">
                {view === "active" ? "🗑 Deleted" : "✅ Active"}
              </button>

              {/* Refresh */}
              <button onClick={doRefresh} title="Refresh"
                className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:border-orange-400 hover:text-orange-500 shadow-sm transition-all">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"
                  style={spinning ? { animation: "spin .7s linear infinite" } : {}}>
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>

              {/* Create Client */}
              <button onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                style={{ background: "#F97316" }}
                onMouseEnter={e => e.currentTarget.style.background = "#EA6A05"}
                onMouseLeave={e => e.currentTarget.style.background = "#F97316"}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create Client
              </button>
            </div>
          </div>

          {/* ── Desktop Table ── */}
<div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
  {/* Card Header */}
  <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
    <div className="flex items-center gap-2">
      <div className="w-1 h-4 rounded-full" style={{ background: "#F97316" }} />
      <span className="font-semibold text-gray-700 text-xs">
        {isDeleted ? "Deleted Clients" : "All Clients"}
      </span>
    </div>
    <span className="text-[10px] text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100 font-medium">
      {filtered.length} result{filtered.length !== 1 ? "s" : ""}
    </span>
  </div>

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          {["CLIENT #", "COMPANY", "CONTACT", "EMAIL", "CITY", "STATUS", "ACTIONS"].map(h => (
            <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 tracking-wider whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pageSlice.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-12 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">📭</span>
                <span className="text-xs font-medium text-gray-400">No clients found</span>
                <span className="text-[10px] text-gray-300">Try adjusting your search or filters</span>
              </div>
            </td>
          </tr>
        ) : pageSlice.map(c => (
          <tr key={c.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
            <td className="px-5 py-3">
              <ClientNumberBadge number={c.client_number ?? `#${c.id}`} />
            </td>
            <td className="px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                  style={{ background: "#FFF3E8", color: "#F97316" }}>🏢</div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-700 truncate max-w-[140px] text-xs" title={c.company_name}>{c.company_name || "—"}</div>
                  {c.industry && <div className="text-[10px] text-gray-400">{c.industry}</div>}
                </div>
              </div>
            </td>
            <td className="px-5 py-3 text-gray-600 text-xs">{c.contact_person_name || "—"}</td>
            <td className="px-5 py-3 text-gray-500 text-xs">{c.email || "—"}</td>
            <td className="px-5 py-3 text-gray-600 text-xs">{c.city || "—"}</td>
            <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
            <td className="px-5 py-3">
              <div className="flex items-center gap-1">
                <ActionBtn title="View"    variant="view"    onClick={() => openView(c)}><IEye /></ActionBtn>
                {!isDeleted && <>
                  <ActionBtn title="Edit"   variant="edit"   onClick={() => openEdit(c)}><IEdit /></ActionBtn>
                  <ActionBtn title="Delete" variant="delete" onClick={() => deleteClient(c.id)}><ITrash /></ActionBtn>
                </>}
                {isDeleted && (
                  <ActionBtn title="Restore" variant="restore" onClick={() => restoreClient(c.id)}><IRestore /></ActionBtn>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Pagination */}
  {totalPages > 1 && (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/40">
      <span className="text-[10px] text-gray-400">
        Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => setPage(n)}
            className={`w-7 h-7 rounded-lg text-[10px] font-semibold transition-all ${n === page ? "text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-400"}`}
            style={n === page ? { background: "#F97316" } : {}}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )}
</div>
          {/* ── Mobile Cards ── */}
          <div className="sm:hidden">
            <div className="mb-3">
              <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>
            {pageSlice.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-4xl block mb-2">📭</span>
                <span className="text-sm font-medium text-gray-400">No clients found</span>
              </div>
            ) : pageSlice.map(c => (
              <MobileClientCard key={c.id} client={c} isDeleted={isDeleted}
                onView={openView} onEdit={openEdit} onDelete={deleteClient} onRestore={restoreClient} />
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 mt-4">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium disabled:opacity-50">Previous</button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium disabled:opacity-50">Next</button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ════════ DRAWER ════════ */}
      <Drawer
        open={!!drawer}
        onClose={closeDrawer}
        title={drawer === "create" ? "Add New Client" : drawer === "edit" ? "Edit Client" : "Client Details"}
        subtitle={drawer === "view" ? selected?.company_name || "" : "PMS HRMS · Sales Module"}
        footer={drawer !== "view" && (
          <>
            <button onClick={closeDrawer}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:border-orange-400 hover:text-orange-500 bg-white transition-all">
              Cancel
            </button>
            <button onClick={drawer === "create" ? createClient : updateClient}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-all flex items-center gap-2"
              style={{ background: "#F97316" }}
              onMouseEnter={e => e.currentTarget.style.background = "#EA6A05"}
              onMouseLeave={e => e.currentTarget.style.background = "#F97316"}>
              {drawer === "create" ? "Create Client" : "Save Changes"}
            </button>
          </>
        )}
      >

        {/* ── VIEW ── */}
        {drawer === "view" && selected && (
          <div>
            <div className="rounded-2xl overflow-hidden mb-5 p-5 relative"
              style={{ background: "linear-gradient(135deg,#EA6A05 0%,#F97316 60%,#FB923C 100%)" }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-start gap-3 relative">
                <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shrink-0">🏢</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-base leading-tight break-words">{selected.company_name || "—"}</div>
                  <div className="text-xs text-white/70 mt-1">{[selected.industry, selected.client_type].filter(Boolean).join(" · ") || "No industry info"}</div>
                  {selected.website && (
                    <a href={selected.website} target="_blank" rel="noreferrer"
                      className="text-xs text-white/80 mt-1 block break-all">🔗 {selected.website}</a>
                  )}
                </div>
                <StatusBadge status={selected.status} />
              </div>
              {[selected.city, selected.state, selected.country].some(Boolean) && (
                <div className="flex gap-2 mt-3 flex-wrap relative">
                  {[{ l: "City", v: selected.city }, { l: "State", v: selected.state }, { l: "Country", v: selected.country }]
                    .filter(x => x.v).map(x => (
                      <div key={x.l} className="bg-white/15 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white">
                        <span className="opacity-70">{x.l}: </span><strong>{x.v}</strong>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-1 h-4 rounded-full" style={{ background: "#F97316" }} />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReadField label="Contact Person"  value={selected.contact_person_name} />
                <ReadField label="Designation"     value={selected.contact_person_designation} />
                <ReadField label="Email"           value={selected.email} />
                <ReadField label="Phone"           value={selected.phone} />
                <ReadField label="Alternate Phone" value={selected.alternate_phone} />
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-1 h-4 rounded-full" style={{ background: "#F97316" }} />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Business Info</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReadField label="GST Number" value={selected.gst_number} />
                <ReadField label="PAN Number" value={selected.pan_number} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-1 h-4 rounded-full" style={{ background: "#F97316" }} />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Address</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReadField label="Postal Code"      value={selected.postal_code} />
                <div />
                <ReadField label="Billing Address"  value={selected.billing_address}  full />
                <ReadField label="Shipping Address" value={selected.shipping_address} full />
              </div>
            </div>
          </div>
        )}

        {/* ── CREATE / EDIT ── */}
        {(drawer === "create" || drawer === "edit") && (
          <div>
            {FIELD_GROUPS.map(group => (
              <div key={group.title} className="mb-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <div className="w-1 h-4 rounded-full" style={{ background: "#F97316" }} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{group.title}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.fields.map(key => {
                    const full = key.includes("address");
                    return (
                      <div key={key} className={full ? "sm:col-span-2" : ""}>
                        <label className={labelCls}>{FIELD_LABELS[key]}</label>
                        {key.includes("address") ? (
                          <textarea name={key} value={form[key] || ""} onChange={change}
                            placeholder={`Enter ${FIELD_LABELS[key]}`} rows={2}
                            className={`${inputCls} resize-y min-h-[70px]`} />
                        ) : (
                          <input name={key} value={form[key] || ""} onChange={change}
                            placeholder={`Enter ${FIELD_LABELS[key]}`}
                            className={inputCls} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <div className="w-1 h-4 rounded-full" style={{ background: "#F97316" }} />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</span>
              </div>
              <label className={labelCls}>Status</label>
              <select name="status" value={form.status || "active"} onChange={change} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </Drawer>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

        /* Modern SweetAlert2 overrides */
        .swal2-popup { font-family: inherit; }
        .swal2-icon.swal2-success .swal2-success-ring { border-color: rgba(249,115,22,0.2) !important; }
        .swal2-icon.swal2-success [class^='swal2-success-line'] { background-color: #F97316 !important; }
        .swal2-timer-progress-bar { background: #F97316 !important; }
      `}</style>
    </>
  );
}