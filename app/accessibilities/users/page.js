"use client";

import { useState, useEffect, useRef } from "react";
import { DocumentUploadPanel, ViewDocumentsPanel } from "@/components/documents/DocumentPanel";

const BASE      = "http://localhost:8080/api/auth";
const FILE_BASE = "http://localhost:8080";

const getToken    = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");
const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${getToken()}`,
});

const toFileUrl = (filePath) => {
  if (!filePath) return "#";
  let clean = filePath.replace(/\\/g, "/");
  clean = clean.replace(/^\/+/, "");
  clean = clean.replace(/^public\//, "");
  return `${FILE_BASE}/${clean}`;
};

const APIS = {
  getAll:      ()       => `${BASE}/all`,
  getOne:      (id)     => `${BASE}/${id}`,
  register:    ()       => `${BASE}/register`,
  update:      (id)     => `${BASE}/update/${id}`,
  updateOwn:   ()       => `${BASE}/update-profile/own`,
  delete:      (id)     => `${BASE}/delete/${id}`,
  restore:     (id)     => `${BASE}/restore/${id}`,
  uploadDocs:  (id)     => `${BASE}/upload-documents/${id}`,
  getUserDocs: (userId) => `${BASE}/documents/${userId}`,
  deleteDoc:   (docId)  => `${BASE}/documents/doc/${docId}`,
};

const EMPTY_FORM = {
  email: "",
  personal_email: "",           // NEW
  second_email: "",
  password_hash: "",
  first_name: "",
  last_name: "",
  phone: "",
  second_phone: "",
  date_of_birth: "",
  gender: "",
  present_address: "",
  permanent_address: "",
  city: "",
  state: "",
  country: "",
  postal_code: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_name_2: "",  // NEW
  emergency_contact_phone_2: "", // NEW
  status: "active",
  department_id: "",
  designation_id: "",
  reporting_to: "",
  joining_date: "",
  confirmation_date: "",
  employment_type: "",
  work_location: "",
  company_email: "",
  pan_number: "",
  aadhar_number: "",
  bank_account_number: "",
  bank_name: "",
  bank_ifsc_code: "",
  uan_number: "",
  pf_account_number: "",
  esi_number: "",
  role_id: "",
};

const FORM_SECTIONS = [
  {
    title: "Personal Information", icon: "👤",
    fields: [
      { name: "first_name",     label: "First Name",      required: true },
      { name: "last_name",      label: "Last Name",       required: true },
      // { name: "email",          label: "New Company Email",   type: "email", required: true },
      { name: "company_email", label: "Company Email", type: "email" },
      { name: "personal_email", label: "Personal Email",  type: "email", required: true }, // NEW
      { name: "second_email",   label: "Secondary Email", type: "email" },
      { name: "password_hash",  label: "Password",        type: "password", required: true },
      { name: "phone",          label: "Phone",           required: true },
      { name: "second_phone",   label: "Secondary Phone" },
      { name: "date_of_birth",  label: "Date of Birth",   type: "date" },
      {
        name: "gender", label: "Gender", type: "select",
        options: [
          { value: "", label: "Select Gender" },
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
          { value: "Other", label: "Other" },
        ],
      },
      {
        name: "status", label: "Status", type: "select",
        options: [
          { value: "active",     label: "Active" },
          { value: "inactive",   label: "Inactive" },
          { value: "resigned",   label: "Resigned" },
          { value: "terminated", label: "Terminated" },
          { value: "blocked",    label: "Blocked" },
        ],
      },
    ],
  },
  {
    title: "Address Details", icon: "📍",
    fields: [
      { name: "present_address",           label: "Present Address",          span: true },
      { name: "permanent_address",         label: "Permanent Address",        span: true },
      { name: "city",                      label: "City" },
      { name: "state",                     label: "State" },
      { name: "country",                   label: "Country" },
      { name: "postal_code",               label: "Postal Code" },
      { name: "emergency_contact_name",    label: "Emergency Contact Name" },
      { name: "emergency_contact_phone",   label: "Emergency Contact Phone" },
      { name: "emergency_contact_name_2",  label: "Emergency Contact Name 2" },  // NEW
      { name: "emergency_contact_phone_2", label: "Emergency Contact Phone 2" }, // NEW
    ],
  },
  {
    title: "Employment Details", icon: "💼",
    fields: [
      { name: "department_id",  label: "Department" },
      { name: "designation_id", label: "Designation" },
      { name: "reporting_to",   label: "Reporting To" },
      { name: "joining_date",      label: "Joining Date",      type: "date", required: true },
      { name: "confirmation_date", label: "Confirmation Date", type: "date" },
      {
        name: "employment_type", label: "Employment Type", type: "select",
        options: [
          { value: "",          label: "Select Type" },
          { value: "Full-Time", label: "Full-Time" },
          { value: "Part-Time", label: "Part-Time" },
          { value: "Contract",  label: "Contract" },
          { value: "Intern",    label: "Intern" },
        ],
      },
      {
        name: "work_location", label: "Work Location", type: "select",
        options: [
          { value: "",           label: "Select Location" },
          { value: "kolkata",    label: "Kolkata" },
          { value: "delhi",      label: "Delhi" },
          { value: "bangalore",  label: "Bangalore" },
          { value: "hydrabad",   label: "Hyderabad" },
          { value: "pune",       label: "Pune" },
        ],
      },
   
      { name: "role_id",       label: "Role" },
    ],
  },
  {
    title: "Identity & Financial", icon: "🏦",
    fields: [
      { name: "pan_number",          label: "PAN Number" },
      { name: "aadhar_number",       label: "Aadhar Number" },
      { name: "bank_account_number", label: "Bank Account Number" },
      { name: "bank_name",           label: "Bank Name" },
      { name: "bank_ifsc_code",      label: "IFSC Code" },
      { name: "uan_number",          label: "UAN Number" },
      { name: "pf_account_number",   label: "PF Account Number" },
      { name: "esi_number",          label: "ESI Number" },
    ],
  },
];

/* ── STATUS BADGE ─────────────────────────────────────────── */
const STATUS_CONFIG = {
  active:     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  inactive:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  resigned:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
  terminated: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
  blocked:    { bg: "bg-gray-100",   text: "text-gray-600",    border: "border-gray-300",    dot: "bg-gray-400"    },
};

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.blocked;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function Avatar({ name, size = "sm" }) {
  const parts    = (name || "").split(" ");
  const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
  const palettes = [
    "bg-orange-100 text-orange-700", "bg-violet-100 text-violet-700",
    "bg-cyan-100 text-cyan-700",     "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
  ];
  const color = palettes[(initials.charCodeAt(0) || 0) % palettes.length];
  const sz    = size === "lg" ? "w-14 h-14 text-xl" : size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-[11px]";
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

/* ── ICONS ────────────────────────────────────────────────── */
const EyeIcon      = () => (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>);
const EditIcon     = () => (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>);
const UserEditIcon = () => (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/></svg>);
const TrashIcon    = () => (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>);
const RestoreIcon  = () => (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4"/></svg>);
const RefreshIcon  = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4"/></svg>);
const UploadIcon   = () => (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>);
const ExternalIcon = () => (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>);

function ActionBtn({ onClick, title, variant, children }) {
  const variants = {
    view:    "text-[#ff6b1a] bg-orange-50 hover:bg-orange-100",
    edit:    "text-amber-600 bg-amber-50 hover:bg-amber-100",
    own:     "text-violet-600 bg-violet-50 hover:bg-violet-100",
    delete:  "text-red-500 bg-red-50 hover:bg-red-100",
    restore: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100",
    upload:  "text-blue-600 bg-blue-50 hover:bg-blue-100",
  };
  return (
    <button onClick={onClick} title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:scale-105 ${variants[variant]}`}>
      {children}
    </button>
  );
}

/* ── RIGHT DRAWER ─────────────────────────────────────────── */
function Drawer({ title, subtitle, onClose, children, accentColor = "#ff6b1a" }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div
        className="w-full sm:max-w-lg bg-white shadow-2xl flex flex-col h-full border-l border-gray-100"
        style={{ animation: "slideIn 0.25s cubic-bezier(0.4,0,0.2,1) both" }}
      >
        <div
          className="flex items-start justify-between px-5 py-4 flex-shrink-0 border-b border-gray-100"
          style={{ borderTop: `3px solid ${accentColor}` }}
        >
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-5">{children}</div>
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );
}

/* ── FORM FIELD ───────────────────────────────────────────── */
/* ── FORM FIELD ───────────────────────────────────────────── */
function FormField({ field, value, onChange, departments = [], designations = [], reportManagers = [], form = {}, roles = [] }) {
  const [showPassword, setShowPassword] = useState(false);
  const base = "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/40 focus:border-[#ff6b1a] transition-all";

  if (field.name === "role_id") return (
    <select name="role_id" value={value || ""} onChange={onChange} className={base}>
      <option value="">Select Role</option>
      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
    </select>
  );
  if (field.name === "department_id") return (
    <select name={field.name} value={value || ""} onChange={onChange} className={base}>
      <option value="">Select Department</option>
      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select>
  );
  if (field.name === "designation_id") return (
    <select name={field.name} value={value || ""} onChange={onChange} className={base}>
      <option value="">Select Designation</option>
      {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select>
  );
  if (field.name === "reporting_to") return (
    <select
      value={form.reporting_to || ""}
      onChange={e => onChange({ target: { name: "reporting_to", value: e.target.value } })}
      className={base}
    >
      <option value="">Select Reporting Manager</option>
      {reportManagers.map(m => (
        <option key={m.user.id} value={m.user.id}>
          {m.user.first_name} {m.user.last_name}
        </option>
      ))}
    </select>
  );
  if (field.type === "select") return (
    <select name={field.name} value={value || ""} onChange={onChange} className={base}>
      {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  // NEW: password field with eye toggle
  if (field.type === "password") return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        name={field.name}
        placeholder={field.label}
        value={value || ""}
        onChange={onChange}
        required={field.required}
        className={`${base} pr-9`}
        autoComplete="new-password"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword(s => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff6b1a] transition-colors"
      >
        {showPassword ? (
          // Eye-off icon
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.994 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.5a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
          </svg>
        ) : (
          // Eye icon (reusing your existing style)
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <input type={field.type || "text"} name={field.name} placeholder={field.label}
      value={value || ""} onChange={onChange} required={field.required}
      className={base} autoComplete="off"/>
  );
}

/* ── MOBILE CARD ──────────────────────────────────────────── */
function MobileUserCard({ user, onView, onEdit, onDelete, onRestore, onUpload }) {
  const [expanded, setExpanded] = useState(false);
  const fullName = `${user.first_name} ${user.last_name}`;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar name={fullName} size="md"/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onView(user.id)} className="font-bold text-gray-900 text-sm hover:text-[#ff6b1a] transition-colors truncate">
              {fullName}
            </button>
            <Badge status={user.status}/>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
          <span className="font-mono text-[10px] text-[#ff6b1a] bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded mt-1 inline-block font-semibold">
            {user.employee_code || `CODEX-${String(user.id).padStart(5,"0")}`}
          </span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-[#ff6b1a] transition-colors">
          <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-2 bg-gray-50/50">
          {[
            ["Phone",               user.phone],
            ["Gender",              user.gender],
            ["City",                user.city],
            ["Personal Email",      user.personal_email],           // NEW
            ["Emergency Contact 2", user.emergency_contact_name_2], // NEW
            ["Emergency Phone 2",   user.emergency_contact_phone_2],// NEW
            ["Role",                user.roles?.map(r => r.display_name || r.name).join(", ")],
            ["Joined",              user.employee?.joining_date],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} className="flex justify-between items-start gap-2">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs text-gray-700 font-medium">{val}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center border-t border-gray-100 divide-x divide-gray-100">
        {[
          { label: "View",   icon: <EyeIcon/>,      color: "hover:text-[#ff6b1a] hover:bg-orange-50",  action: () => onView(user.id) },
          { label: "Edit",   icon: <EditIcon/>,     color: "hover:text-amber-600 hover:bg-amber-50",   action: () => onEdit(user.id, false) },
          { label: "Own",    icon: <UserEditIcon/>, color: "hover:text-violet-600 hover:bg-violet-50", action: () => onEdit(user.id, true) },
          { label: "Docs",   icon: <UploadIcon/>,   color: "hover:text-blue-600 hover:bg-blue-50",     action: () => onUpload(user.id) },
          { label: "Delete", icon: <TrashIcon/>,    color: "hover:text-red-500 hover:bg-red-50",       action: () => onDelete(user.id) },
        ].map(({ label, icon, color, action }) => (
          <button key={label} onClick={action} className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs text-gray-400 transition-colors ${color}`}>
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end   = Math.min(currentPage * itemsPerPage, totalItems);
  const getPageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1,2,3,4,5,"…",totalPages];
    if (currentPage >= totalPages - 3) return [1,"…",totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [1,"…",currentPage-1,currentPage,currentPage+1,"…",totalPages];
  };
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white flex-wrap gap-2">
      <span className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-600">{start}–{end}</span> of <span className="font-semibold text-gray-600">{totalItems}</span> users
      </span>
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => onPageChange(currentPage-1)} disabled={currentPage===1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-[#ff6b1a] hover:border-orange-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm">←</button>
        {getPageNums().map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button key={n} onClick={() => onPageChange(n)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all
                ${n === currentPage ? "border-[#ff6b1a] text-white" : "border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-[#ff6b1a] hover:border-orange-200"}`}
              style={n === currentPage ? { background: "linear-gradient(135deg,#ff6b1a,#ff9a56)" } : {}}>
              {n}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage+1)} disabled={currentPage===totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-[#ff6b1a] hover:border-orange-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm">→</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function UserManagement() {
  const [reportManagers, setReportManagers] = useState([]);
  const [departments,    setDepartments]    = useState([]);
  const [designations,   setDesignations]   = useState([]);
  const [roles,          setRoles]          = useState([]);
  const [users,          setUsers]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [drawer,         setDrawer]         = useState(null);
  const [selectedUser,   setSelectedUser]   = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [ownUpdate,      setOwnUpdate]      = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [toast,          setToast]          = useState(null);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [viewTab,        setViewTab]        = useState("details");
  const [userDocs,       setUserDocs]       = useState([]);
  const [docsLoading,    setDocsLoading]    = useState(false);

  const ITEMS_PER_PAGE = 10;

  /* ── Fetch dropdowns ── */
  useEffect(() => {
    const h = authHeaders();
    Promise.all([
      fetch("http://localhost:8080/api/role/all",    { headers: h }).then(r => r.json()),
      fetch("http://localhost:8080/api/department",  { headers: h }).then(r => r.json()),
      fetch("http://localhost:8080/api/designation", { headers: h }).then(r => r.json()),
    ]).then(([rd, dd, dg]) => {
      setRoles(rd.data || []);
      setDepartments(dd.data || []);
      setDesignations(dg.data || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!form.designation_id) { setReportManagers([]); return; }
    fetch(`http://localhost:8080/api/auth/reporting-managers/${form.designation_id}`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setReportManagers(d.data || [])).catch(console.error);
  }, [form.designation_id]);

  const showToast   = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const closeDrawer = () => { setDrawer(null); setSelectedUser(null); setForm(EMPTY_FORM); setOwnUpdate(false); setViewTab("details"); setUserDocs([]); };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value === "" ? null : value }));
  };

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const getUsers = async () => {
    setLoading(true);
    try {
      const res  = await fetch(APIS.getAll(), { headers: authHeaders() });
      const data = await res.json();
      setUsers(data.users || []);
    } catch { showToast("Failed to fetch users", "error"); }
    finally  { setLoading(false); }
  };

  useEffect(() => { getUsers(); }, []);

  /* ── Fetch user documents ── */
  const fetchUserDocs = async (userId) => {
    setDocsLoading(true);
    try {
      const res  = await fetch(APIS.getUserDocs(userId), { headers: authHeaders() });
      const data = await res.json();
      setUserDocs(data.documents || data.data || []);
    } catch { setUserDocs([]); }
    finally { setDocsLoading(false); }
  };

  const handleDocDeleted = (docId) => {
    setUserDocs(prev => prev.filter(d => d.id !== docId));
    showToast("Document deleted");
  };

  const cleanFormData = (data) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(k => {
      if (cleaned[k] === "" || cleaned[k] === "Invalid date") cleaned[k] = null;
    });
    return cleaned;
  };

  const createUser = async () => {
    if (!form.email || !form.password_hash || !form.first_name || !form.last_name || !form.phone || !form.joining_date) {
      showToast("Please fill all required fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch(APIS.register(), {
        method:  "POST",
        headers: authHeaders(true),
        body:    JSON.stringify(cleanFormData(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error creating user");
      showToast(data.message || "User created successfully");
      closeDrawer();
      getUsers();
    } catch (e) {
      showToast(e.message || "Failed to create user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openView = async (id) => {
    const u = users.find(u => u.id === id);
    if (!u) return;
    setSelectedUser(u);
    setViewTab("details");
    setDrawer("view");
    await fetchUserDocs(id);
  };

  const openEdit = (id, own = false) => {
    const u = users.find(u => u.id === id);
    if (!u) return;
    const fmt = d => d ? new Date(d).toISOString().split("T")[0] : "";
    setForm({
      ...EMPTY_FORM,
      ...u,
      ...u.employee,
      reporting_to:             u.employee?.reporting_to        || "",
      joining_date:             fmt(u.employee?.joining_date),
      confirmation_date:        fmt(u.employee?.confirmation_date),
      // Explicitly map the 3 new fields
      personal_email:           u.personal_email            || "",
      emergency_contact_name_2:  u.emergency_contact_name_2  || "",
      emergency_contact_phone_2: u.emergency_contact_phone_2 || "",
      password_hash: "",
    });
    setSelectedUser(u);
    setOwnUpdate(own);
    setDrawer("edit");
    fetchUserDocs(id);
  };

  const openUpload = async (id) => {
    const u = users.find(u => u.id === id);
    if (!u) return;
    setSelectedUser(u);
    setDrawer("upload");
    await fetchUserDocs(id);
  };

  const updateUser = async () => {
    setSubmitting(true);
    try {
      const url  = ownUpdate ? APIS.updateOwn() : APIS.update(selectedUser.id);
      const res  = await fetch(url, {
        method:  "PUT",
        headers: authHeaders(true),
        body:    JSON.stringify(cleanFormData(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      showToast(data.message || "User updated");
      closeDrawer();
      getUsers();
    } catch (e) {
      showToast(e.message || "Failed to update user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async id => {
    if (!confirm("Delete this user?")) return;
    try {
      const res  = await fetch(APIS.delete(id), { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      showToast(data.message || "User deleted");
      getUsers();
    } catch (e) { showToast(e.message || "Failed to delete user", "error"); }
  };

  const restoreUser = async id => {
    try {
      const res  = await fetch(APIS.restore(id), { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      showToast(data.message || "User restored");
      getUsers();
    } catch (e) { showToast(e.message || "Failed to restore user", "error"); }
  };

  /* ── Filter & paginate ── */
  const filtered  = users.filter(u => {
    const q = `${u.first_name} ${u.last_name} ${u.email} ${u.employee_code}`.toLowerCase();
    return q.includes(search.toLowerCase()) && (statusFilter === "all" || u.status === statusFilter);
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* ── Form renderer ── */
  const renderForm = () => (
    <div className="space-y-6">
      {FORM_SECTIONS.map(section => (
        <div key={section.title} className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">{section.icon}</span>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{section.title}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.fields.map(field => (
              <div key={field.name} className={field.span ? "col-span-1 sm:col-span-2" : ""}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  {field.label}{field.required && <span className="text-[#ff6b1a] ml-0.5">*</span>}
                </label>
                <FormField
                  field={field} value={form[field.name] ?? ""} onChange={handleChange}
                  departments={departments} designations={designations}
                  reportManagers={reportManagers} form={form} roles={roles}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  /* ── Tab button ── */
  const TabBtn = ({ label, icon, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
        active
          ? "text-[#ff6b1a] bg-orange-50 border border-orange-100"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span>{icon}</span> {label}
    </button>
  );

  const COLS = ["USER #", "NAME", "EMAIL", "STATE", "STATUS", "ROLE", "ACTIONS"];

  /* ═══════════════════════════════════════════ RENDER ═══ */
  return (
    <div className="min-h-screen bg-[#f6f7f9]">

      {/* ── TOAST ── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[200] flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold animate-[slideDown_0.3s_ease_both]
            ${toast.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-white text-gray-800 border-orange-200"}`}
          style={{ borderLeft: `4px solid ${toast.type === "error" ? "#ef4444" : "#ff6b1a"}` }}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${toast.type === "error" ? "bg-red-500" : "bg-[#ff6b1a]"}`}>
            {toast.type === "error" ? "✕" : "✓"}
          </span>
          {toast.msg}
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto">

        {/* ── PAGE HEADER ── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                User <span style={{ color: "#ff6b1a" }}>Management</span>
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">Manage all system users, roles and access</p>
            </div>
            <button
              onClick={() => { setForm(EMPTY_FORM); setDrawer("create"); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ff6b1a 0%, #ff9a56 100%)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Create User
            </button>
          </div>

          {/* ── SEARCH + FILTER ── */}
          <div className="flex items-center gap-2 flex-wrap w-full">
            <div className="relative flex-1 min-w-[160px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input
                placeholder="Search by name, email, code..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/30 focus:border-[#ff6b1a] placeholder-gray-400 transition-all"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/30 focus:border-[#ff6b1a] text-gray-600 transition-all">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
              <option value="blocked">Blocked</option>
            </select>
            <button onClick={getUsers} title="Refresh"
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-[#ff6b1a]/30 text-gray-400 hover:text-[#ff6b1a] transition-all">
              <RefreshIcon/>
            </button>
          </div>
        </div>

        {/* ── MOBILE VIEW ── */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">All Users</span>
            <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm"><Spinner/> Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">👤</div>
              <span className="text-sm text-gray-400">No users found</span>
            </div>
          ) : (
            <div className="space-y-3">
              {paginated.map(u => (
                <MobileUserCard key={u.id} user={u} onView={openView} onEdit={openEdit}
                  onDelete={deleteUser} onRestore={restoreUser} onUpload={openUpload}/>
              ))}
            </div>
          )}
          <Pagination currentPage={currentPage} totalPages={totalPages}
            onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE}/>
        </div>

{/* ── DESKTOP TABLE ── */}
<div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
    <div className="flex items-center gap-2">
      <div className="w-1 h-4 rounded-full" style={{ background: "#ff6b1a" }}/>
      <h2 className="text-sm font-bold text-gray-800">All Users</h2>
    </div>
    <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full font-medium">
      {filtered.length} result{filtered.length !== 1 ? "s" : ""}
    </span>
  </div>

  {loading ? (
    <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-sm">
      <Spinner/> Loading users...
    </div>
  ) : (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-[#fafafa]">
            {COLS.map(h => (
              <th
                key={h}
                className="px-3 py-2 text-[10px] font-bold text-gray-400 tracking-wider uppercase whitespace-nowrap text-left"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={COLS.length} className="py-12 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">👤</div>
                  <span className="text-sm text-gray-400">No users found</span>
                </div>
              </td>
            </tr>
          ) : paginated.map((user, idx) => (
            <tr
              key={user.id}
              className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors group"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {/* Employee Code */}
              <td className="px-3 py-2 whitespace-nowrap">
                <button
                  onClick={() => openView(user.id)}
                  className="font-mono text-[10px] font-bold text-[#ff6b1a] hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-1.5 py-0.5 rounded-md transition-all"
                >
                  {user.employee_code || `CODEX-${String(user.id).padStart(5, "0")}`}
                </button>
              </td>

              {/* Name */}
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Avatar name={`${user.first_name} ${user.last_name}`} size="xs"/>
                  <span className="font-semibold text-gray-800 text-sm">
                    {user.first_name} {user.last_name}
                  </span>
                </div>
              </td>

              {/* Email */}
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="text-sm text-gray-500">
                  {user.email || <span className="text-gray-300">—</span>}
                </span>
              </td>

              {/* State */}
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="text-xs text-gray-500">
                  {user.state || <span className="text-gray-300">—</span>}
                </span>
              </td>

              {/* Status */}
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge status={user.status}/>
              </td>

              {/* Role */}
              <td className="px-3 py-2 whitespace-nowrap">
                {user.roles?.length ? (
                  <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full">
                    {user.roles.map(r => r.display_name || r.name).join(", ")}
                  </span>
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <ActionBtn onClick={() => openView(user.id)}        variant="view"   title="View"><EyeIcon/></ActionBtn>
                  <ActionBtn onClick={() => openEdit(user.id, false)} variant="edit"   title="Edit"><EditIcon/></ActionBtn>
                  <ActionBtn onClick={() => openEdit(user.id, true)}  variant="own"    title="Own Update"><UserEditIcon/></ActionBtn>
                  <ActionBtn onClick={() => openUpload(user.id)}      variant="upload" title="Upload Documents"><UploadIcon/></ActionBtn>
                  <ActionBtn onClick={() => openEdit(user.id)}        variant="delete" title="Delete"><TrashIcon/></ActionBtn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
    totalItems={filtered.length}
    itemsPerPage={ITEMS_PER_PAGE}
  />
</div>
      </div>

      {/* ══ CREATE DRAWER ══ */}
      {drawer === "create" && (
        <Drawer title="Create New User" subtitle="PMS HRMS · Accessibilities" onClose={closeDrawer}>
          {renderForm()}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
            <button onClick={closeDrawer} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">Cancel</button>
            <button onClick={createUser} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-60 shadow-md shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ff6b1a 0%, #ff9a56 100%)" }}>
              {submitting && <Spinner/>} Create User
            </button>
          </div>
        </Drawer>
      )}

      {/* ══ EDIT DRAWER ══ */}
      {drawer === "edit" && selectedUser && (
        <Drawer
          title={`Edit — ${selectedUser?.first_name} ${selectedUser?.last_name}`}
          subtitle={ownUpdate ? `Own Update · /update-profile/own` : `Admin Update · /update/${selectedUser?.id}`}
          onClose={closeDrawer}
        >
          <div className="flex items-center justify-between mb-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-700">Update Mode</p>
              <p className="text-xs text-gray-400 mt-0.5">{ownUpdate ? "Own profile → /update-profile/own" : `Admin update → /update/${selectedUser?.id}`}</p>
            </div>
            <button onClick={() => setOwnUpdate(v => !v)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={ownUpdate ? { background: "#ff6b1a" } : { background: "#d1d5db" }}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${ownUpdate ? "translate-x-6" : "translate-x-1"}`}/>
            </button>
          </div>

          <div className="flex items-center gap-1 mb-5 p-1 bg-gray-50 rounded-xl border border-gray-100">
            <TabBtn icon="📝" label="Profile"   active={viewTab === "details"}   onClick={() => setViewTab("details")}/>
            <TabBtn icon="📁" label="Documents" active={viewTab === "documents"} onClick={() => setViewTab("documents")}/>
          </div>

          {viewTab === "details" ? (
            <>
              {renderForm()}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
                <button onClick={closeDrawer} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button onClick={updateUser} disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-60 shadow-md shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #ff6b1a 0%, #ff9a56 100%)" }}>
                  {submitting && <Spinner/>} Save Changes
                </button>
              </div>
            </>
          ) : (
            <DocumentUploadPanel
              userId={selectedUser.id}
              existingDocs={userDocs}
              onUploaded={() => { fetchUserDocs(selectedUser.id); showToast("Documents uploaded successfully"); }}
              onDocDeleted={handleDocDeleted}
            />
          )}
        </Drawer>
      )}

      {/* ══ UPLOAD DRAWER ══ */}
      {drawer === "upload" && selectedUser && (
        <Drawer
          title={`Documents — ${selectedUser?.first_name} ${selectedUser?.last_name}`}
          subtitle={selectedUser?.employee_code}
          onClose={closeDrawer}
          accentColor="#3b82f6"
        >
          <DocumentUploadPanel
            userId={selectedUser.id}
            existingDocs={userDocs}
            onUploaded={() => { fetchUserDocs(selectedUser.id); showToast("Documents uploaded successfully"); }}
            onDocDeleted={handleDocDeleted}
          />
        </Drawer>
      )}

      {/* ══ VIEW DRAWER ══ */}
      {drawer === "view" && selectedUser && (
        <Drawer title="User Details" subtitle={selectedUser.employee_code} onClose={closeDrawer}>
          <div className="flex items-center gap-4 p-4 rounded-xl border mb-4"
            style={{ background: "linear-gradient(135deg, #fff7f3 0%, #fff 100%)", borderColor: "#ffe0cc" }}>
            <Avatar name={`${selectedUser.first_name} ${selectedUser.last_name}`} size="lg"/>
            <div className="min-w-0">
              <p className="text-lg font-extrabold text-orange-500 truncate">{selectedUser.first_name} {selectedUser.last_name}</p>
              <p className="text-sm text-gray-500 truncate">{selectedUser.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#ff6b1a] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg">
                  {selectedUser.employee_code}
                </span>
                <Badge status={selectedUser.status}/>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-5 p-1 bg-gray-50 rounded-xl border border-gray-100">
            <TabBtn icon="👤" label="Details"   active={viewTab === "details"}   onClick={() => setViewTab("details")}/>
            <TabBtn icon="📁" label="Documents" active={viewTab === "documents"} onClick={() => setViewTab("documents")}/>
          </div>

          {viewTab === "details" ? (
            <div className="space-y-5">
              {[
                { title: "Personal", icon: "👤", rows: [
                  ["Phone",          selectedUser.phone],
                  ["Secondary Phone", selectedUser.second_phone],
                  ["Gender",         selectedUser.gender],
                  ["Date of Birth",  selectedUser.date_of_birth],
                  ["Personal Email", selectedUser.personal_email],           // NEW
                  ["Secondary Email", selectedUser.second_email],
                  ["Last Login",     selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString("en-IN") : null],
                ]},
                { title: "Address", icon: "📍", rows: [
                  ["Present Address",    selectedUser.present_address],
                  ["Permanent Address",  selectedUser.permanent_address],
                  ["City",              selectedUser.city],
                  ["State",             selectedUser.state],
                  ["Country",           selectedUser.country],
                  ["Postal Code",       selectedUser.postal_code],
                  ["Emergency Contact",  selectedUser.emergency_contact_name],
                  ["Emergency Phone",    selectedUser.emergency_contact_phone],
                  ["Emergency Contact 2", selectedUser.emergency_contact_name_2],  // NEW
                  ["Emergency Phone 2",   selectedUser.emergency_contact_phone_2], // NEW
                ]},
                { title: "Employment", icon: "💼", rows: [
                  ["Department ID",    selectedUser.employee?.department_id],
                  ["Designation ID",   selectedUser.employee?.designation_id],
                  ["Reporting To",     selectedUser.employee?.reporting_to],
                  ["Employment Type",  selectedUser.employee?.employment_type],
                  ["Work Location",    selectedUser.employee?.work_location],
                  ["Joining Date",     selectedUser.employee?.joining_date],
                  ["Confirmation Date", selectedUser.employee?.confirmation_date],
                  ["Company Email",    selectedUser.employee?.company_email],
                  ["Role",             selectedUser.roles?.map(r => r.display_name || r.name).join(", ") || null],
                ]},
                { title: "Financial & Identity", icon: "🏦", rows: [
                  ["PAN Number",     selectedUser.employee?.pan_number],
                  ["Aadhar Number",  selectedUser.employee?.aadhar_number],
                  ["Bank Name",      selectedUser.employee?.bank_name],
                  ["Account Number", selectedUser.employee?.bank_account_number],
                  ["IFSC Code",      selectedUser.employee?.bank_ifsc_code],
                  ["UAN Number",     selectedUser.employee?.uan_number],
                  ["PF Account",     selectedUser.employee?.pf_account_number],
                  ["ESI Number",     selectedUser.employee?.esi_number],
                ]},
              ].map(section => (
                <div key={section.title} className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">{section.icon}</span>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{section.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {section.rows.map(([label, val]) => (
                      <div key={label}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">
                          {val || <span className="text-gray-300 font-normal text-xs">Not provided</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ViewDocumentsPanel
              docs={userDocs}
              loading={docsLoading}
              onDocDeleted={handleDocDeleted}
            />
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
            <button onClick={closeDrawer} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">Close</button>
            <button
              onClick={() => openEdit(selectedUser.id, false)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-xl shadow-md shadow-orange-200 hover:shadow-orange-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ff6b1a 0%, #ff9a56 100%)" }}>
              <EditIcon/> Edit User
            </button>
          </div>
        </Drawer>
      )}

      <style>{`
        @keyframes slideDown { from { transform: translateY(-8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}