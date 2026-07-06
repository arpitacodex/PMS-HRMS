"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

// ── Config ──────────────────────────────────────────────────────────────────
const API = "http://localhost:8080/api/auth";

const LOCKED_FIELDS = new Set([
  "email","personal_email","employee_code","role_id","department_id","designation_id",
  "reporting_to","joining_date","confirmation_date","employment_type",
  "work_location","company_email","status","pan_number","aadhar_number",
  "uan_number","pf_account_number","esi_number",
]);

const EDITABLE_KEYS = [
  "second_email","first_name","last_name","phone","second_phone",
  "date_of_birth","gender","present_address","permanent_address",
  "city","state","country","postal_code",
  "emergency_contact_name","emergency_contact_phone",
  "emergency_contact_name_2", "emergency_contact_phone_2",
  "bank_account_number","bank_name","bank_ifsc_code",
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
};
const fmtEmpType = (t) =>
  t ? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const getToken  = () => (typeof window !== "undefined" ? localStorage.getItem("token")  : null);
const getUserId = () => (typeof window !== "undefined" ? localStorage.getItem("userId") : null);

function shapeUser(u) {
  const emp = u.employee || {};
  return {
    id:                      u.id                    ?? "",
    employee_code:           u.employee_code         ?? "",
    email:                   u.email                 ?? "",
    personal_email:          u.personal_email        ?? "",
    second_email:            u.second_email          ?? "",
    first_name:              u.first_name            ?? "",
    last_name:               u.last_name             ?? "",
    phone:                   u.phone                 ?? "",
    second_phone:            u.second_phone          ?? "",
    date_of_birth:           u.date_of_birth         ?? "",
    gender:                  u.gender                ?? "",
    present_address:         u.present_address       ?? "",
    permanent_address:       u.permanent_address     ?? "",
    city:                    u.city                  ?? "",
    state:                   u.state                 ?? "",
    country:                 u.country               ?? "",
    postal_code:             u.postal_code           ?? "",
    emergency_contact_name:  u.emergency_contact_name  ?? "",
    emergency_contact_phone: u.emergency_contact_phone ?? "",
    emergency_contact_name_2:u.emergency_contact_name_2?? "",
    emergency_contact_phone_2:u.emergency_contact_phone_2?? "",
    status:                  u.status                ?? "",
    last_login_at:           u.last_login_at         ?? "",
    created_at:              u.created_at            ?? "",
    department_id:           emp.department_id       ?? "",
    designation_id:          emp.designation_id      ?? "",
    reporting_to:            emp.reporting_to        ?? "",
    joining_date:            emp.joining_date        ?? "",
    confirmation_date:       emp.confirmation_date   ?? "",
    employment_type:         emp.employment_type     ?? "",
    work_location:           emp.work_location       ?? "",
    company_email:           emp.company_email       ?? "",
    pan_number:              emp.pan_number          ?? "",
    aadhar_number:           emp.aadhar_number       ?? "",
    bank_account_number:     emp.bank_account_number ?? "",
    bank_name:               emp.bank_name           ?? "",
    bank_ifsc_code:          emp.bank_ifsc_code      ?? "",
    uan_number:              emp.uan_number          ?? "",
    pf_account_number:       emp.pf_account_number   ?? "",
    esi_number:              emp.esi_number          ?? "",
    department_name:  emp.department?.name  ?? (emp.department_id  ? `Dept #${emp.department_id}`  : "—"),
    designation_name: emp.designation?.name ?? (emp.designation_id ? `Desg #${emp.designation_id}` : "—"),
    role_display:     u.roles?.[0]?.display_name ?? "—",
  };
}

// ── Theme tokens ─────────────────────────────────────────────────────────────
const themes = {
  light: {
    bg:            "#f0f2f5",
    surface:       "#ffffff",
    surfaceHover:  "#fff8f3",
    border:        "#e4e7ec",
    borderSubtle:  "#f0f0f0",
    text:          "#0f1117",
    textSub:       "#5a6278",
    textMuted:     "#9aa0b0",
    textDisabled:  "#c0c6d4",
    inputBg:       "#f7f8fa",
    inputBgEdit:   "#ffffff",
    inputBorder:   "#e4e7ec",
    lockedBg:      "#f7f8fa",
    lockedText:    "#b0b8c8",
    warnBg:        "#fff8f2",
    warnBorder:    "#fde0c8",
    warnText:      "#c2410c",
    badgeOrangeBg: "#fff4ed",
    badgeOrangeFg: "#f97316",
    badgeOrangeBd: "#fde0c8",
    badgeGreenBg:  "#f0fdf4",
    badgeGreenFg:  "#16a34a",
    badgeGreenBd:  "#bbf7d0",
    badgeGrayBg:   "#f3f4f6",
    badgeGrayFg:   "#6b7280",
    badgeGrayBd:   "#e5e7eb",
    tabActiveFg:   "#f97316",
    tabInactiveFg: "#9aa0b0",
    stickyBg:      "#ffffff",
    stickyBorder:  "#e4e7ec",
    shadow:        "0 1px 8px rgba(0,0,0,.06)",
    cardShadow:    "0 1px 6px rgba(0,0,0,.04)",
    divider:       "#efefef",
    empCodeBg:     "#f3f4f6",
    empCodeFg:     "#888",
    subLabelGray:  "#bbb",
    sectionBarFg:  "#111",
    metaFg:        "#777",
  },
  dark: {
    bg:            "#0d0f14",
    surface:       "#161920",
    surfaceHover:  "#1e2230",
    border:        "#2a2e3d",
    borderSubtle:  "#232635",
    text:          "#eef0f6",
    textSub:       "#a0a8be",
    textMuted:     "#6b7290",
    textDisabled:  "#3d4259",
    inputBg:       "#1a1e2a",
    inputBgEdit:   "#1e2230",
    inputBorder:   "#2a2e3d",
    lockedBg:      "#151820",
    lockedText:    "#454c66",
    warnBg:        "#1f1508",
    warnBorder:    "#5c2d0a",
    warnText:      "#fb923c",
    badgeOrangeBg: "#2a1500",
    badgeOrangeFg: "#fb923c",
    badgeOrangeBd: "#6b2d00",
    badgeGreenBg:  "#052014",
    badgeGreenFg:  "#4ade80",
    badgeGreenBd:  "#065f46",
    badgeGrayBg:   "#1e2130",
    badgeGrayFg:   "#9ca3af",
    badgeGrayBd:   "#374151",
    tabActiveFg:   "#fb923c",
    tabInactiveFg: "#606680",
    stickyBg:      "#111318",
    stickyBorder:  "#22263a",
    shadow:        "0 1px 12px rgba(0,0,0,.4)",
    cardShadow:    "0 1px 10px rgba(0,0,0,.3)",
    divider:       "#1f2335",
    empCodeBg:     "#1e2130",
    empCodeFg:     "#606880",
    subLabelGray:  "#454c66",
    sectionBarFg:  "#eef0f6",
    metaFg:        "#8890aa",
  },
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [user,      setUser]      = useState(null);
  const [snapshot,  setSnapshot]  = useState(null);
  const [editMode,  setEditMode]  = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [darkMode,  setDarkMode]  = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setDarkMode(mq.matches);
      const handler = (e) => setDarkMode(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  const t = darkMode ? themes.dark : themes.light;

  const fetchUser = async (silent = false) => {
    const token  = getToken();
    const userId = getUserId();
    if (!token || !userId) {
      Swal.fire({ icon:"error", title:"Not logged in", text:"Please log in to view your profile.", confirmButtonColor:"#f97316" });
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        Swal.fire({ icon:"warning", title:"Session expired", text:"Please log in again.", confirmButtonColor:"#f97316" });
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        const shaped = shapeUser(data.user);
        setUser(shaped);
        setSnapshot(shaped);
      } else {
        Swal.fire({ icon:"error", title:"Error", text: data.message || "Failed to load profile.", confirmButtonColor:"#f97316" });
      }
    } catch {
      Swal.fire({ icon:"error", title:"Network Error", text:"Could not reach the server.", confirmButtonColor:"#f97316" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (LOCKED_FIELDS.has(name)) return;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    Swal.fire({
      title:"Edit Profile?", text:"You can update your personal and contact details.",
      icon:"info", showCancelButton:true,
      confirmButtonText:"Yes, Edit", cancelButtonText:"Cancel", confirmButtonColor:"#f97316",
    }).then((r) => { if (r.isConfirmed) setEditMode(true); });
  };

  const handleCancel = () => {
    setUser(snapshot);
    setEditMode(false);
  };

  const updateProfile = async () => {
    const confirm = await Swal.fire({
      title:"Save Changes?", icon:"question", showCancelButton:true,
      confirmButtonText:"Yes, Update", cancelButtonText:"Cancel", confirmButtonColor:"#f97316",
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const payload = {};
      EDITABLE_KEYS.forEach((k) => {
        if (user[k] !== undefined && user[k] !== null && user[k] !== "")
          payload[k] = user[k];
      });
      const res  = await fetch(`${API}/update-profile/own`, {
        method:"PUT",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        await Swal.fire({ icon:"success", title:"Profile Updated", text: data.message || "Updated successfully.", confirmButtonColor:"#f97316" });
        setEditMode(false);
        fetchUser(true);
      } else {
        Swal.fire({ icon:"error", title:"Update Failed", text: data.message || "Something went wrong.", confirmButtonColor:"#f97316" });
      }
    } catch {
      Swal.fire({ icon:"error", title:"Network Error", text:"Could not reach the server.", confirmButtonColor:"#f97316" });
    } finally {
      setSaving(false);
    }
  };

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  const tabs = [
    { id:"personal",   label:"Personal",   icon:"👤", short:"Info" },
    { id:"address",    label:"Address",    icon:"📍", short:"Addr" },
    { id:"emergency",  label:"Emergency",  icon:"🚨", short:"SOS"  },
    { id:"employment", label:"Employment", icon:"💼", short:"Work" },
    { id:"finance",    label:"Finance",    icon:"🏦", short:"Bank" },
  ];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background: darkMode ? "#0d0f14" : "#f0f2f5" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
        <div style={{
          width:40, height:40, borderRadius:"50%",
          borderTop:"3px solid #f97316",
          borderRight:`3px solid ${darkMode ? "#2a2e3d" : "#ffe8d6"}`,
          borderBottom:`3px solid ${darkMode ? "#2a2e3d" : "#ffe8d6"}`,
          borderLeft:`3px solid ${darkMode ? "#2a2e3d" : "#ffe8d6"}`,
          animation:"lspin .8s linear infinite",
        }} />
        <span style={{ fontSize:11, color: darkMode ? "#6b7290" : "#bbb", letterSpacing:2 }}>LOADING…</span>
      </div>
      <style>{`@keyframes lspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background: t.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif", colorScheme: darkMode ? "dark" : "light" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .anim-fade { animation: fadeUp .28s ease forwards; }

        .p-tab { transition: all .15s !important; }
        .p-tab-light:hover { background: #fff8f3 !important; color: #f97316 !important; }
        .p-tab-dark:hover  { background: #1e2230 !important; color: #fb923c !important; }

        .p-fi-light:focus { outline:none !important; border-color:#f97316 !important; box-shadow:0 0 0 3px rgba(249,115,22,.12) !important; }
        .p-fi-dark:focus  { outline:none !important; border-color:#fb923c !important; box-shadow:0 0 0 3px rgba(251,146,60,.18) !important; }

        .btn-orange { transition: background .15s, transform .12s, box-shadow .15s; }
        .btn-orange:hover:not(:disabled) { background: #ea580c !important; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(249,115,22,.38) !important; }
        .btn-orange:active { transform: scale(.97) !important; }

        .btn-ghost-light { transition: all .15s; }
        .btn-ghost-light:hover { background: #f0f0f0 !important; }
        .btn-ghost-light:active { transform: scale(.97) !important; }

        .btn-ghost-dark { transition: all .15s; }
        .btn-ghost-dark:hover { background: #252836 !important; }
        .btn-ghost-dark:active { transform: scale(.97) !important; }

        .no-scroll::-webkit-scrollbar { display:none; }
        .no-scroll { -ms-overflow-style:none; scrollbar-width:none; }

        .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
        .badge  { padding:3px 9px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:.6px; text-transform:uppercase; }

        .theme-toggle { cursor:pointer; transition: transform .2s; border:none; background:none; padding:0; }
        .theme-toggle:hover { transform: rotate(20deg) scale(1.15); }

        @media (max-width:639px) {
          .grid-3, .grid-2 { grid-template-columns:1fr !important; }
          .full-span        { grid-column:span 1 !important; }
          .ph-inner     { flex-direction:column !important; align-items:flex-start !important; gap:12px !important; }
          .hdr-actions  { width:100% !important; }
          .hdr-actions button { flex:1 !important; justify-content:center !important; font-size:12px !important; padding:10px !important; }
          .meta-row  { flex-direction:column !important; gap:3px !important; }
          .meta-item { font-size:11px !important; }
          .page-title  { font-size:15px !important; }
          .emp-badge   { display:none !important; }
          .last-login  { display:none !important; }
          .avatar-box  { width:58px !important; height:58px !important; font-size:20px !important; border-radius:14px !important; }
          .user-name   { font-size:16px !important; }
          .tab-full    { display:none !important; }
          .tab-short   { display:inline !important; }
          .card-inner  { padding:16px !important; }
          .edit-warn   { flex-direction:column !important; gap:4px !important; }
          .sec-sub     { display:none !important; }
        }
        @media (min-width:640px) and (max-width:1023px) {
          .grid-3    { grid-template-columns:repeat(2,1fr) !important; }
          .tab-full  { display:inline !important; }
          .tab-short { display:none !important; }
        }
        @media (min-width:1024px) {
          .tab-full  { display:inline !important; }
          .tab-short { display:none !important; }
        }
      `}</style>

      {/* ════════ STICKY HEADER ════════ */}
      <div style={{
        background: t.stickyBg,
        borderTop: "none",
        borderRight: "none",
        borderBottom: `1px solid ${t.stickyBorder}`,
        borderLeft: "none",
        position:"sticky", top:0, zIndex:20, boxShadow: t.shadow,
      }}>
        <div style={{ maxWidth:1140, margin:"0 auto", padding:"0 20px" }}>

          {/* Top bar */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between", height:52,
            borderTop: "none",
            borderRight: "none",
            borderBottom: `1px solid ${t.borderSubtle}`,
            borderLeft: "none",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:4, height:20, background:"#f97316", borderRadius:3 }} />
              <span className="page-title" style={{ fontSize:17, fontWeight:700, color: t.text, letterSpacing:-.3 }}>My Profile</span>
              <span className="emp-badge" style={{ padding:"2px 8px", borderRadius:5, background: t.empCodeBg, fontSize:11, color: t.empCodeFg, fontWeight:500 }}>
                {user.employee_code || "—"}
              </span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span className="last-login" style={{ fontSize:11, color: t.textMuted }}>
                Last login: {formatDate(user.last_login_at)}
              </span>
              <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                style={{
                  width:34, height:34, borderRadius:8,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background: t.empCodeBg, color: t.text,
                  borderTop: `1px solid ${t.border}`,
                  borderRight: `1px solid ${t.border}`,
                  borderBottom: `1px solid ${t.border}`,
                  borderLeft: `1px solid ${t.border}`,
                  cursor:"pointer", transition:"all .2s",
                }}>
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>

          {/* Profile row */}
          <div className="ph-inner" style={{ display:"flex", alignItems:"center", gap:18, paddingTop:16, paddingBottom: editMode ? 0 : 16 }}>

            {/* Avatar */}
            <div style={{ position:"relative", flexShrink:0 }}>
              <div className="avatar-box" style={{
                width:68, height:68, borderRadius:18,
                background:"linear-gradient(135deg,#f97316,#c2410c)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:24, fontWeight:800, color:"#fff",
                boxShadow:"0 4px 18px rgba(249,115,22,.35)",
              }}>{initials}</div>
              <div style={{
                position:"absolute", bottom:-2, right:-2,
                width:14, height:14, borderRadius:"50%",
                background: user.status === "active" ? "#22c55e" : (darkMode ? "#374151" : "#9ca3af"),
                borderTop: `2px solid ${t.stickyBg}`,
                borderRight: `2px solid ${t.stickyBg}`,
                borderBottom: `2px solid ${t.stickyBg}`,
                borderLeft: `2px solid ${t.stickyBg}`,
              }} />
            </div>

            {/* Name + meta */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:7, marginBottom:7 }}>
                <h1 className="user-name" style={{ margin:0, fontSize:18, fontWeight:700, color: t.text, letterSpacing:-.3 }}>
                  {user.first_name || "—"} {user.last_name || ""}
                </h1>
                <span className="badge" style={{
                  background: t.badgeOrangeBg, color: t.badgeOrangeFg,
                  borderTop: `1px solid ${t.badgeOrangeBd}`,
                  borderRight: `1px solid ${t.badgeOrangeBd}`,
                  borderBottom: `1px solid ${t.badgeOrangeBd}`,
                  borderLeft: `1px solid ${t.badgeOrangeBd}`,
                }}>{user.role_display}</span>
                <span className="badge" style={{
                  background: user.status==="active" ? t.badgeGreenBg  : t.badgeGrayBg,
                  color:      user.status==="active" ? t.badgeGreenFg  : t.badgeGrayFg,
                  borderTop:    `1px solid ${user.status==="active" ? t.badgeGreenBd : t.badgeGrayBd}`,
                  borderRight:  `1px solid ${user.status==="active" ? t.badgeGreenBd : t.badgeGrayBd}`,
                  borderBottom: `1px solid ${user.status==="active" ? t.badgeGreenBd : t.badgeGrayBd}`,
                  borderLeft:   `1px solid ${user.status==="active" ? t.badgeGreenBd : t.badgeGrayBd}`,
                }}>{user.status}</span>
              </div>
              <div className="meta-row" style={{ display:"flex", flexWrap:"wrap", gap:"3px 16px" }}>
                {[
                  { icon:"✉️", val:user.email },
                  { icon:"📞", val:user.phone },
                  { icon:"🏢", val:user.department_name },
                  { icon:"🏷️", val:user.designation_name },
                ].map((item,i) => (
                  <span key={i} className="meta-item" style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color: t.metaFg }}>
                    <span>{item.icon}</span>{item.val || "—"}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="hdr-actions" style={{ display:"flex", gap:8, flexShrink:0 }}>
              {!editMode ? (
                <button onClick={handleEdit} className="btn-orange" style={{
                  display:"flex", alignItems:"center", gap:6,
                  background:"#f97316", color:"#fff",
                  borderTop:"none", borderRight:"none", borderBottom:"none", borderLeft:"none",
                  borderRadius:9, padding:"10px 20px", fontSize:13, fontWeight:600,
                  cursor:"pointer", boxShadow:"0 2px 10px rgba(249,115,22,.28)", whiteSpace:"nowrap",
                }}>
                  <PencilIcon /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={updateProfile} disabled={saving} className="btn-orange" style={{
                    display:"flex", alignItems:"center", gap:6,
                    background:"#f97316", color:"#fff",
                    borderTop:"none", borderRight:"none", borderBottom:"none", borderLeft:"none",
                    borderRadius:9, padding:"10px 20px", fontSize:13, fontWeight:600,
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow:"0 2px 10px rgba(249,115,22,.28)", opacity: saving ? .75 : 1, whiteSpace:"nowrap",
                  }}>
                    {saving
                      ? <span style={{
                          width:13, height:13,
                          borderTop:"2px solid #fff",
                          borderRight:"2px solid rgba(255,255,255,.3)",
                          borderBottom:"2px solid rgba(255,255,255,.3)",
                          borderLeft:"2px solid rgba(255,255,255,.3)",
                          borderRadius:"50%", display:"inline-block", animation:"spin .8s linear infinite",
                        }} />
                      : <CheckIcon />}
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button onClick={handleCancel} className={darkMode ? "btn-ghost-dark" : "btn-ghost-light"} style={{
                    display:"flex", alignItems:"center", gap:6,
                    background: t.surface, color: t.textSub,
                    borderTop: `1px solid ${t.border}`,
                    borderRight: `1px solid ${t.border}`,
                    borderBottom: `1px solid ${t.border}`,
                    borderLeft: `1px solid ${t.border}`,
                    borderRadius:9, padding:"10px 16px", fontSize:13, fontWeight:600,
                    cursor:"pointer", whiteSpace:"nowrap",
                  }}>
                    <CloseIcon /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Edit warning */}
          {editMode && (
            <div className="edit-warn" style={{
              display:"flex", alignItems:"center", gap:8,
              margin:"10px 0", padding:"9px 14px",
              background: t.warnBg,
              borderTop: `1px solid ${t.warnBorder}`,
              borderRight: `1px solid ${t.warnBorder}`,
              borderBottom: `1px solid ${t.warnBorder}`,
              borderLeft: `1px solid ${t.warnBorder}`,
              borderRadius:9,
            }}>
              <span style={{ fontSize:14 }}>⚠️</span>
              <p style={{ margin:0, fontSize:12, color: t.warnText }}>
                <strong>Edit Mode Active</strong> — Fields marked with 🔒 are managed by HR and cannot be changed.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="no-scroll" style={{
            display:"flex", overflowX:"auto",
            borderTop: `1px solid ${t.borderSubtle}`,
            borderRight: "none",
            borderBottom: "none",
            borderLeft: "none",
            marginLeft:-20, marginRight:-20, paddingLeft:20,
          }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`p-tab ${darkMode ? "p-tab-dark" : "p-tab-light"}`}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"12px 16px", background:"transparent",
                  borderTop: "none",
                  borderRight: "none",
                  borderBottom: activeTab===tab.id
                    ? `2px solid ${darkMode ? "#fb923c" : "#f97316"}`
                    : "2px solid transparent",
                  borderLeft: "none",
                  color: activeTab===tab.id ? t.tabActiveFg : t.tabInactiveFg,
                  fontSize:11, fontWeight:700, cursor:"pointer",
                  whiteSpace:"nowrap", letterSpacing:.5, marginBottom:-1,
                }}>
                <span style={{ fontSize:13 }}>{tab.icon}</span>
                <span className="tab-full">{tab.label.toUpperCase()}</span>
                <span className="tab-short">{tab.short.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ CONTENT ════════ */}
      <div style={{ maxWidth:1140, margin:"0 auto", padding:"20px 20px 60px" }}>
        <div className="anim-fade card-inner" style={{
          background: t.surface,
          borderTop: `1px solid ${t.border}`,
          borderRight: `1px solid ${t.border}`,
          borderBottom: `1px solid ${t.border}`,
          borderLeft: `1px solid ${t.border}`,
          borderRadius:14, padding:24, boxShadow: t.cardShadow,
        }}>

          {activeTab === "personal" && (
            <>
              <SectionHeader title="Personal Information" subtitle="Your basic personal details" t={t} />
              <div className="grid-3">
                <Field label="First Name"      name="first_name"    value={user.first_name}    onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Last Name"       name="last_name"     value={user.last_name}     onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Email"           name="email"         value={user.email}         editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Personal Email"  name="personal_email" value={user.personal_email} editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Secondary Email" name="second_email"  value={user.second_email}  onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Phone"           name="phone"         value={user.phone}         onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Secondary Phone" name="second_phone"  value={user.second_phone}  onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Date of Birth"   name="date_of_birth" type="date"
                  value={user.date_of_birth?.split("T")[0]}
                  displayValue={formatDate(user.date_of_birth)}
                  onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Gender" name="gender" value={user.gender} onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode}
                  type="select" options={["Male","Female","Other","Prefer not to say"]} />
                <Field label="Employee Code" name="employee_code" value={user.employee_code} editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Status"        value={user.status}                    editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Last Login"    value={formatDate(user.last_login_at)} editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Member Since"  value={formatDate(user.created_at)}    editMode={editMode} locked t={t} darkMode={darkMode} />
              </div>
            </>
          )}

          {activeTab === "address" && (
            <>
              <SectionHeader title="Address Details" subtitle="Current and permanent addresses" t={t} />
              <div className="grid-2" style={{ marginBottom:14 }}>
                <Field label="Present Address"   name="present_address"   value={user.present_address}   onChange={handleChange} editMode={editMode} fullWidth t={t} darkMode={darkMode} />
                <Field label="Permanent Address" name="permanent_address" value={user.permanent_address} onChange={handleChange} editMode={editMode} fullWidth t={t} darkMode={darkMode} />
              </div>
              <div className="grid-2">
                <Field label="City"        name="city"        value={user.city}        onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="State"       name="state"       value={user.state}       onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Country"     name="country"     value={user.country}     onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Postal Code" name="postal_code" value={user.postal_code} onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
              </div>
            </>
          )}

          {activeTab === "emergency" && (
            <>
              <SectionHeader title="Emergency Contact" subtitle="Who to reach in case of emergency" t={t} />
              <div className="grid-2" style={{ maxWidth:640 }}>
                <Field label="Contact Name"  name="emergency_contact_name"  value={user.emergency_contact_name}  onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Contact Phone" name="emergency_contact_phone" value={user.emergency_contact_phone} onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Emergency Contact Name 2"  name="emergency_contact_name_2"  value={user.emergency_contact_name_2}  onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Emergency Contact Phone 2" name="emergency_contact_phone_2" value={user.emergency_contact_phone_2} onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
              </div>
            </>
          )}

          {activeTab === "employment" && (
            <>
              <SectionHeader title="Employment Details" subtitle="HR-managed fields — contact HR to update" t={t} />
              <div className="grid-3">
                <Field label="Employee Code"     value={user.employee_code}                  editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Role"              value={user.role_display}                   editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Department"        value={user.department_name}                editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Designation"       value={user.designation_name}               editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Reporting To"      value={`User #${user.reporting_to || "—"}`} editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Employment Type"   value={fmtEmpType(user.employment_type)}    editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Work Location"     value={user.work_location}                  editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Company Email"     value={user.company_email}                  editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Joining Date"      value={formatDate(user.joining_date)}       editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Confirmation Date" value={formatDate(user.confirmation_date)}  editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Status"            value={user.status}                         editMode={editMode} locked t={t} darkMode={darkMode} />
              </div>
            </>
          )}

          {activeTab === "finance" && (
            <>
              <SectionHeader title="Finance & Compliance" subtitle="Bank and statutory details" t={t} />
              <SubSectionLabel label="Bank Details — Editable" color={darkMode ? "#fb923c" : "#f97316"} />
              <div className="grid-3">
                <Field label="Bank Account Number" name="bank_account_number" value={user.bank_account_number} onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Bank Name"           name="bank_name"           value={user.bank_name}           onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
                <Field label="Bank IFSC Code"      name="bank_ifsc_code"      value={user.bank_ifsc_code}      onChange={handleChange} editMode={editMode} t={t} darkMode={darkMode} />
              </div>
              <div style={{
                borderTop: `1px dashed ${t.divider}`,
                borderRight: "none",
                borderBottom: "none",
                borderLeft: "none",
                margin:"24px 0 20px",
              }} />
              <SubSectionLabel label="Statutory Details — HR Managed" color={t.subLabelGray} />
              <div className="grid-3">
                <Field label="PAN Number"        value={user.pan_number}        editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="Aadhar Number"     value={user.aadhar_number}     editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="UAN Number"        value={user.uan_number}        editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="PF Account Number" value={user.pf_account_number} editMode={editMode} locked t={t} darkMode={darkMode} />
                <Field label="ESI Number"        value={user.esi_number}        editMode={editMode} locked t={t} darkMode={darkMode} />
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, t }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
        <div style={{ width:3, height:15, background:"#f97316", borderRadius:2 }} />
        <h2 style={{ margin:0, fontSize:14, fontWeight:700, color: t.sectionBarFg, letterSpacing:-.2 }}>{title}</h2>
      </div>
      {subtitle && <p className="sec-sub" style={{ margin:"2px 0 0 11px", fontSize:12, color: t.subLabelGray }}>{subtitle}</p>}
    </div>
  );
}

function SubSectionLabel({ label, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
      <div style={{ width:3, height:12, background:color, borderRadius:2 }} />
      <span style={{ fontSize:10, fontWeight:700, color, letterSpacing:1.4, textTransform:"uppercase" }}>{label}</span>
    </div>
  );
}

function Field({ label, name, value, onChange, editMode, locked=false, type="text", options, displayValue, fullWidth, t, darkMode }) {
  const isEditable = editMode && !locked;
  const displayVal = displayValue || value || "";

  // All border properties use longhands exclusively — no shorthand — to avoid
  // React's "conflicting shorthand/longhand" warning on re-renders.
  const baseBorderRadius = 8;
  const basePadding = "9px 12px";
  const baseFontSize = 13;

  const editStyle = {
    width: "100%",
    borderRadius: baseBorderRadius,
    padding: basePadding,
    fontSize: baseFontSize,
    fontFamily: "inherit",
    transition: "all .15s",
    background: t.inputBgEdit,
    borderTop: `1.5px solid ${darkMode ? "#fb923c" : "#f97316"}`,
    borderRight: `1.5px solid ${darkMode ? "#fb923c" : "#f97316"}`,
    borderBottom: `1.5px solid ${darkMode ? "#fb923c" : "#f97316"}`,
    borderLeft: `1.5px solid ${darkMode ? "#fb923c" : "#f97316"}`,
    color: t.text,
  };

  const lockedStyle = {
    width: "100%",
    borderRadius: baseBorderRadius,
    padding: basePadding,
    fontSize: baseFontSize,
    fontFamily: "inherit",
    transition: "all .15s",
    background: t.lockedBg,
    borderTop: `1px solid ${t.border}`,
    borderRight: `1px solid ${t.border}`,
    borderBottom: `1px solid ${t.border}`,
    borderLeft: `1px solid ${t.border}`,
    color: t.lockedText,
    cursor: "not-allowed",
  };

  const viewStyle = {
    width: "100%",
    borderRadius: baseBorderRadius,
    padding: basePadding,
    fontSize: baseFontSize,
    fontFamily: "inherit",
    transition: "all .15s",
    background: t.inputBg,
    borderTop: `1px solid ${t.inputBorder}`,
    borderRight: `1px solid ${t.inputBorder}`,
    borderBottom: `1px solid ${t.inputBorder}`,
    borderLeft: `1px solid ${t.inputBorder}`,
    color: t.textSub,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, gridColumn: fullWidth ? "span 2" : undefined }}>
      <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, fontWeight:700, color: t.textMuted, letterSpacing:1.1, textTransform:"uppercase" }}>
        {label}
        {locked && (
          <span title="Managed by HR" style={{ color: t.textDisabled, lineHeight:0 }}>
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
        )}
      </label>

      {isEditable && type === "select" ? (
        <select name={name} value={value || ""} onChange={onChange}
          className={darkMode ? "p-fi-dark" : "p-fi-light"}
          style={{ ...editStyle, appearance:"auto" }}>
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={isEditable ? (type === "select" ? "text" : type) : "text"}
          name={name}
          value={isEditable ? (value || "") : (displayVal || "—")}
          onChange={isEditable ? onChange : undefined}
          readOnly={!isEditable}
          className={isEditable ? (darkMode ? "p-fi-dark" : "p-fi-light") : ""}
          style={isEditable ? editStyle : locked ? lockedStyle : viewStyle}
        />
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const PencilIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const CloseIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const MoonIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
  </svg>
);
const SunIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="5"/>
    <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);