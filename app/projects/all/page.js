"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
const BASE = "http://localhost:8080/api";

async function api(path, opts = {}) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const r = await fetch(`${BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...opts,
    });
    const json = await r.json();
    return { ok: r.ok, ...json };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

const cx = (...args) => args.filter(Boolean).join(" ");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtMoney = (n, cur = "INR") =>
  n != null
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n)
    : "—";

const PROJECT_STATUS_MAP = {
  planning:    { label: "Planning",    dot: "#F97316", bg: "rgba(249,115,22,0.15)", text: "#F97316" },
  in_progress: { label: "In Progress", dot: "#3B82F6", bg: "rgba(59,130,246,0.15)", text: "#60A5FA" },
  completed:   { label: "Completed",   dot: "#10B981", bg: "rgba(16,185,129,0.15)", text: "#34D399" },
  on_hold:     { label: "On Hold",     dot: "#94A3B8", bg: "rgba(148,163,184,0.15)", text: "#94A3B8" },
  cancelled:   { label: "Cancelled",   dot: "#EF4444", bg: "rgba(239,68,68,0.15)",  text: "#F87171" },
};

const PRIORITY_MAP = {
  low:      { label: "Low",      color: "#94A3B8" },
  medium:   { label: "Medium",   color: "#F59E0B" },
  high:     { label: "High",     color: "#EF4444" },
  critical: { label: "Critical", color: "#8B5CF6" },
};

function useToast() {
  const [list, setList] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setList((p) => [...p, { id, msg, type }]);
    setTimeout(() => setList((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { list, success: (m) => push(m, "success"), error: (m) => push(m, "error") };
}

function Toasts({ list }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {list.map((t) => (
        <div key={t.id} style={{ animation: "toastIn .3s ease" }}
          className={cx("px-4 py-3 rounded-xl shadow-lg text-sm font-semibold pointer-events-auto flex items-center gap-2",
            t.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
          {t.type === "success"
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 11 3 3 8-8" /></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6m0-6 6 6" /></svg>}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Drawer({ open, onClose, title, subtitle, footer, width = "max-w-md", children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div onClick={onClose}
        className={cx("fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none")} />
      <div className={cx("fixed top-0 right-0 h-full w-full z-50 flex flex-col transition-transform duration-300", width,
          open ? "translate-x-0" : "translate-x-full")}
        style={{ background: "var(--bg-secondary)", boxShadow: "-8px 0 40px rgba(0,0,0,0.2)", borderLeft: "1px solid var(--border-color)" }}>
        <div className="px-6 py-4 shrink-0 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-color)" }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--table-hover)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 shrink-0 flex items-center justify-end gap-3"
            style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm transition focus:outline-none";
const labelCls = "block text-xs font-bold uppercase tracking-wide mb-1.5";

function Field({ label, required, children }) {
  return (
    <div>
      <label className={labelCls} style={{ color: "var(--text-secondary)" }}>
        {label}{required && <span className="text-red-400 ml-0.5 normal-case font-normal"> *</span>}
      </label>
      {children}
    </div>
  );
}

const focusStyle = (e) => { e.target.style.borderColor = "#F97316"; e.target.style.boxShadow = "0 0 0 2px rgba(249,115,22,0.15)"; };
const blurStyle  = (e) => { e.target.style.borderColor = "var(--border-color)"; e.target.style.boxShadow = "none"; };

function OInput(props) {
  return <input className={inputCls} onFocus={focusStyle} onBlur={blurStyle}
    style={{ background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} {...props} />;
}
function OSelect({ children, ...props }) {
  return (
    <select className={inputCls + " cursor-pointer"} onFocus={focusStyle} onBlur={blurStyle}
      style={{ background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} {...props}>
      {children}
    </select>
  );
}
function OTextarea(props) {
  return <textarea className={inputCls + " resize-y min-h-[90px]"} onFocus={focusStyle} onBlur={blurStyle}
    style={{ background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} {...props} />;
}

function SectionHeading({ children }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2"
      style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)" }}>
      {children}
    </h3>
  );
}

function OrangeBtn({ children, disabled, onClick, type = "button", full = false }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={cx("flex items-center justify-center gap-2 font-semibold text-sm rounded-xl text-white transition-all disabled:opacity-60 shadow-sm",
        full ? "w-full py-3" : "px-5 py-2.5")}
      style={{ background: "#F97316" }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = "#EA6A05")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#F97316")}>
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
      style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.color = "#F97316"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const m = PROJECT_STATUS_MAP[status] || { label: status, dot: "#94A3B8", bg: "rgba(148,163,184,0.15)", text: "#94A3B8" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ background: m.bg, color: m.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const m = PRIORITY_MAP[priority] || PRIORITY_MAP.medium;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: m.color }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill={m.color}><path d="M3 17h18l-9-14z" /></svg>
      {m.label}
    </span>
  );
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-color)" }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: "#F97316" }} />
    </div>
  );
}

/* ── PROJECT CARD — dark mode ready ── */
function ProjectCard({ project }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/projects/task?id=${project.id}`} className="block group">
      <div
        className="rounded-2xl p-5 transition-all duration-200 cursor-pointer"
        style={{
          background: "var(--bg-secondary)",
          border: `1px solid ${hovered ? "#F97316" : "var(--border-color)"}`,
          boxShadow: hovered ? "0 4px 24px rgba(249,115,22,0.12)" : "0 1px 4px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Title + Priority */}
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="font-bold text-sm leading-tight flex-1 transition-colors"
            style={{ color: hovered ? "#F97316" : "var(--text-primary)" }}>
            {project.name}
          </h3>
          <PriorityBadge priority={project.priority} />
        </div>

        {/* Description */}
        <p className="text-xs mb-4 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
          {project.description || "No description provided"}
        </p>

        {/* Status */}
        <div className="mb-4">
          <StatusBadge status={project.status} />
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Progress</span>
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              {project.progress_percentage || 0}%
            </span>
          </div>
          <ProgressBar value={project.progress_percentage} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{fmtDate(project.start_date)}</span>
          <span className="text-xs font-bold" style={{ color: "#F97316" }}>
            {fmtMoney(project.budget, project.currency)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProjectForm({ deals, users, onSubmit, submitting, onNewDeal }) {
  const [form, setForm] = useState({
    name: "", description: "", deal_id: "",
    start_date: "", end_date: "", actual_end_date: "",
    budget: "", actual_cost: "", currency: "INR",
    project_type: "Software Development",
    priority: "medium", status: "planning",
    progress_percentage: 0, project_manager_id: "",
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = { ...form };
    ["start_date", "end_date", "actual_end_date"].forEach((f) => { if (!cleaned[f]) cleaned[f] = null; });
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <SectionHeading>Linked Deal</SectionHeading>
        <Field label="Deal" required>
          <div className="flex items-center gap-2">
            <OSelect value={form.deal_id} onChange={set("deal_id")} required>
              <option value="">Select a deal…</option>
              {deals.map((d) => <option key={d.id} value={d.id}>#{d.id} — {d.title || d.deal_number}</option>)}
            </OSelect>
            <button type="button" onClick={onNewDeal}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-sm font-semibold transition-all whitespace-nowrap"
              style={{ background: "#F97316" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#EA6A05")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#F97316")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              New Deal
            </button>
          </div>
        </Field>
      </div>

      <div>
        <SectionHeading>Project Info</SectionHeading>
        <div className="space-y-4">
          <Field label="Project Name" required>
            <OInput value={form.name} onChange={set("name")} required placeholder="e.g. Mobile Development Project" />
          </Field>
          <Field label="Description">
            <OTextarea value={form.description} onChange={set("description")} placeholder="Brief project overview…" />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeading>Timeline</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date" required><OInput type="date" value={form.start_date} onChange={set("start_date")} required /></Field>
          <Field label="End Date" required><OInput type="date" value={form.end_date} onChange={set("end_date")} required /></Field>
        </div>
        <div className="mt-3">
          <Field label="Actual End Date"><OInput type="date" value={form.actual_end_date} onChange={set("actual_end_date")} /></Field>
        </div>
      </div>

      <div>
        <SectionHeading>Budget</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget" required><OInput type="number" value={form.budget} onChange={set("budget")} required placeholder="300000" /></Field>
          <Field label="Actual Cost"><OInput type="number" value={form.actual_cost} onChange={set("actual_cost")} placeholder="0" /></Field>
        </div>
        <div className="mt-3">
          <Field label="Currency">
            <OSelect value={form.currency} onChange={set("currency")}>
              {["INR","USD","EUR","GBP","AED"].map((c) => <option key={c}>{c}</option>)}
            </OSelect>
          </Field>
        </div>
      </div>

      <div>
        <SectionHeading>Settings</SectionHeading>
        <div className="space-y-3">
          <Field label="Project Type">
            <OSelect value={form.project_type} onChange={set("project_type")}>
              {["Software Development","Web Development","Mobile Development","UI/UX Design","Consulting","Marketing","Data Analytics","Other"].map((t) => <option key={t}>{t}</option>)}
            </OSelect>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority" required>
              <OSelect value={form.priority} onChange={set("priority")}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </OSelect>
            </Field>
            <Field label="Status" required>
              <OSelect value={form.status} onChange={set("status")}>
                <option value="planning">Planning</option><option value="in_progress">In Progress</option>
                <option value="completed">Completed</option><option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </OSelect>
            </Field>
          </div>
          <Field label={`Progress — ${form.progress_percentage}%`}>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} step={1} value={form.progress_percentage}
                onChange={(e) => setForm((p) => ({ ...p, progress_percentage: Number(e.target.value) }))}
                className="w-full" style={{ accentColor: "#F97316" }} />
              <span className="text-sm font-bold w-10 text-right" style={{ color: "var(--text-primary)" }}>{form.progress_percentage}%</span>
            </div>
          </Field>
          <Field label="Project Manager" required>
            <OSelect value={form.project_manager_id} onChange={set("project_manager_id")} required>
              <option value="">Select manager…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.first_name ? `${u.first_name} ${u.last_name || ""}` : `User #${u.id}`}</option>)}
            </OSelect>
          </Field>
        </div>
      </div>

      <OrangeBtn type="submit" disabled={submitting} full>
        {submitting
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving…</span></>
          : "Create Project"}
      </OrangeBtn>
    </form>
  );
}

export default function ProjectsAllPage() {
  const [projects,     setProjects]     = useState([]);
  const [deals,        setDeals]        = useState([]);
  const [users,        setUsers]        = useState([]);
  const [leads,        setLeads]        = useState([]);
  const [clients,      setClients]      = useState([]);
  const [bids,         setBids]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [projectOpen,  setProjectOpen]  = useState(false);
  const [dealOpen,     setDealOpen]     = useState(false);
  const [creating,     setCreating]     = useState(false);
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [search,       setSearch]       = useState("");
  const [fStatus,      setFStatus]      = useState("");
  const [fPriority,    setFPriority]    = useState("");
  const [dealForm,     setDealForm]     = useState({
    title: "", lead_id: "", client_id: "", bid_id: "",
    assigned_to: "", deal_value: "", closing_date: "",
    status: "pending", description: "",
  });

  const toast = useToast();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [pr, dr, ur, lr, cr, br] = await Promise.all([
      api("/project/all"), api("/deal/all"), api("/auth/project-managers"),
      api("/lead/all"), api("/client/all"), api("/bid/all"),
    ]);
    setProjects(pr.projects || pr.data || []);
    setDeals(dr.deals || dr.data || []);
    setUsers(ur.data || []);
    setLeads(lr.leads || lr.data || []);
    setClients(cr.clients || cr.data || []);
    setBids(br.bids || br.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const createProject = async (form) => {
    setCreating(true);
    const r = await api("/project/create/", { method: "POST", body: JSON.stringify(form) });
    setCreating(false);
    if (r.success || r.ok) { toast.success("Project created!"); setProjectOpen(false); loadAll(); }
    else toast.error(r.message || "Failed to create project");
  };

  const createDeal = async () => {
    if (!dealForm.title) { toast.error("Deal title is required"); return; }
    setCreatingDeal(true);
    const r = await api("/deal/create/", { method: "POST", body: JSON.stringify(dealForm) });
    setCreatingDeal(false);
    if (r.success || r.ok) {
      toast.success("Deal created! You can now select it.");
      setDealOpen(false);
      setDealForm({ title:"",lead_id:"",client_id:"",bid_id:"",assigned_to:"",deal_value:"",closing_date:"",status:"pending",description:"" });
      loadAll();
    } else toast.error(r.message || "Failed to create deal");
  };

  const setDealField = (k) => (e) => setDealForm((p) => ({ ...p, [k]: e.target.value }));

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (!q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      && (!fStatus   || p.status   === fStatus)
      && (!fPriority || p.priority === fPriority);
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes toastIn { from { opacity:0; transform:translateY(-8px) scale(.96); } to { opacity:1; transform:none; } }
        .line-clamp-1 { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>
      <Toasts list={toast.list} />

      {/* ── TOP SEARCH BAR ── */}
      <div className="px-4 sm:px-8 py-3 flex items-center gap-4 sticky top-0 z-20"
        style={{ background: "var(--bg-navbar)", borderBottom: "1px solid var(--border-color)" }}>
        <div className="flex-1 max-w-lg relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-secondary)" }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl focus:outline-none transition"
            style={{ background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            onFocus={(e) => { e.target.style.borderColor = "#F97316"; e.target.style.boxShadow = "0 0 0 2px rgba(249,115,22,0.15)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; e.target.style.boxShadow = "none"; }} />
        </div>
        <div className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: "#F97316" }}>P</div>
      </div>

      {/* ── PAGE BODY ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              All <span style={{ color: "#F97316" }}>Projects</span>
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>PMS HRMS · Click a project to view tasks</p>
          </div>
          <OrangeBtn onClick={() => setProjectOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            New Project
          </OrangeBtn>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {[
            { value: fStatus,   set: setFStatus,   placeholder: "All Status",   options: Object.entries(PROJECT_STATUS_MAP).map(([k,v]) => [k, v.label]) },
            { value: fPriority, set: setFPriority, placeholder: "All Priority", options: Object.entries(PRIORITY_MAP).map(([k,v]) => [k, v.label]) },
          ].map(({ value, set, placeholder, options }, i) => (
            <select key={i} value={value} onChange={(e) => set(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl focus:outline-none transition cursor-pointer"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              onFocus={(e) => { e.target.style.borderColor = "#F97316"; }}
              onBlur={(e)  => { e.target.style.borderColor = "var(--border-color)"; }}>
              <option value="">{placeholder}</option>
              {options.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          ))}
          {(fStatus || fPriority || search) && (
            <button onClick={() => { setFStatus(""); setFPriority(""); setSearch(""); }}
              className="text-xs font-semibold px-3 py-2 rounded-xl transition"
              style={{ color: "#F97316" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(249,115,22,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-2 rounded-full animate-spin"
              style={{ borderColor: "#F97316", borderTopColor: "transparent" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(249,115,22,0.12)" }}>
              <svg className="w-8 h-8" style={{ color: "#F97316" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-base font-bold mb-1" style={{ color: "var(--text-secondary)" }}>No projects found</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {search || fStatus || fPriority ? "Try adjusting your filters" : "Create your first project to get started"}
            </p>
            {!search && !fStatus && !fPriority && (
              <OrangeBtn onClick={() => setProjectOpen(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                New Project
              </OrangeBtn>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {/* Project Drawer */}
      <Drawer open={projectOpen} onClose={() => setProjectOpen(false)}
        title="New Project" subtitle="PMS HRMS · Projects" width="max-w-lg">
        <ProjectForm deals={deals} users={users} onSubmit={createProject} submitting={creating} onNewDeal={() => setDealOpen(true)} />
      </Drawer>

      {/* Deal Drawer */}
      <>
        <div onClick={() => setDealOpen(false)}
          className={cx("fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300",
            dealOpen ? "opacity-100" : "opacity-0 pointer-events-none")} />
        <div className={cx("fixed top-0 right-0 h-full w-full max-w-md z-[70] flex flex-col transition-transform duration-300",
            dealOpen ? "translate-x-0" : "translate-x-full")}
          style={{ background: "var(--bg-secondary)", boxShadow: "-8px 0 40px rgba(0,0,0,0.2)", borderLeft: "1px solid var(--border-color)" }}>
          <div className="px-6 py-4 shrink-0 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Add New Deal</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>PMS HRMS · Sales Module</p>
            </div>
            <button onClick={() => setDealOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition"
              style={{ color: "var(--text-secondary)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <div>
              <SectionHeading>Basic Info</SectionHeading>
              <div className="space-y-4">
                <Field label="Title" required><OInput placeholder="Deal title" value={dealForm.title} onChange={setDealField("title")} /></Field>
                <Field label="Lead">
                  <OSelect value={dealForm.lead_id} onChange={setDealField("lead_id")}>
                    <option value="">Select Lead</option>
                    {leads.map((l) => <option key={l.id} value={l.id}>{l.title} ({l.lead_number})</option>)}
                  </OSelect>
                </Field>
                <Field label="Client">
                  <OSelect value={dealForm.client_id} onChange={setDealField("client_id")}>
                    <option value="">Select Client</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name} ({c.contact_person_name})</option>)}
                  </OSelect>
                </Field>
                <Field label="Bid">
                  <OSelect value={dealForm.bid_id} onChange={setDealField("bid_id")}>
                    <option value="">Select Bid</option>
                    {bids.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                  </OSelect>
                </Field>
                <Field label="Assigned To (User ID)">
                  <OInput type="number" placeholder="Optional" value={dealForm.assigned_to} onChange={setDealField("assigned_to")} />
                </Field>
              </div>
            </div>
            <div>
              <SectionHeading>Deal Details</SectionHeading>
              <div className="space-y-4">
                <Field label="Deal Value ($)"><OInput type="number" placeholder="0.00" min="0" step="0.01" value={dealForm.deal_value} onChange={setDealField("deal_value")} /></Field>
                <Field label="Closing Date"><OInput type="date" value={dealForm.closing_date} onChange={setDealField("closing_date")} /></Field>
                <Field label="Status">
                  <OSelect value={dealForm.status} onChange={setDealField("status")}>
                    <option value="won">Won</option><option value="lost">Lost</option>
                    <option value="pending">Pending</option><option value="active">Active</option>
                  </OSelect>
                </Field>
                <Field label="Description"><OTextarea placeholder="Optional description…" value={dealForm.description} onChange={setDealField("description")} /></Field>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 shrink-0 flex items-center justify-end gap-3"
            style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <GhostBtn onClick={() => setDealOpen(false)}>Cancel</GhostBtn>
            <OrangeBtn onClick={createDeal} disabled={creatingDeal}>
              {creatingDeal
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving…</span></>
                : "Create Deal"}
            </OrangeBtn>
          </div>
        </div>
      </>
    </div>
  );
}