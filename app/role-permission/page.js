"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8080/api";

function getToken() {
  if (typeof window !== "undefined") return localStorage.getItem("token") || "";
  return "";
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Color palettes — light bg / light text / dark bg / dark text ─────────────
const MODULE_PALETTE = {
  users:         { lb: "#ede9fe", lt: "#6d28d9", db: "rgba(109,40,217,0.25)", dt: "#c4b5fd" },
  employees:     { lb: "#dbeafe", lt: "#1d4ed8", db: "rgba(29,78,216,0.25)",  dt: "#93c5fd" },
  projects:      { lb: "#d1fae5", lt: "#065f46", db: "rgba(6,95,70,0.25)",    dt: "#6ee7b7" },
  tasks:         { lb: "#cffafe", lt: "#0e7490", db: "rgba(14,116,163,0.25)", dt: "#67e8f9" },
  leads:         { lb: "#ffedd5", lt: "#c2410c", db: "rgba(194,65,12,0.25)",  dt: "#fdba74" },
  deals:         { lb: "#fef3c7", lt: "#92400e", db: "rgba(146,64,14,0.25)",  dt: "#fcd34d" },
  clients:       { lb: "#ccfbf1", lt: "#0f766e", db: "rgba(15,118,110,0.25)", dt: "#5eead4" },
  payroll:       { lb: "#fce7f3", lt: "#9d174d", db: "rgba(157,23,77,0.25)",  dt: "#f9a8d4" },
  invoices:      { lb: "#e0e7ff", lt: "#3730a3", db: "rgba(55,48,163,0.25)",  dt: "#a5b4fc" },
  leaves:        { lb: "#ecfccb", lt: "#3f6212", db: "rgba(63,98,18,0.25)",   dt: "#bef264" },
  attendance:    { lb: "#e0f2fe", lt: "#0369a1", db: "rgba(3,105,161,0.25)",  dt: "#7dd3fc" },
  assets:        { lb: "#ffe4e6", lt: "#9f1239", db: "rgba(159,18,57,0.25)",  dt: "#fda4af" },
  system:        { lb: "#fee2e2", lt: "#991b1b", db: "rgba(153,27,27,0.25)",  dt: "#fca5a5" },
  communication: { lb: "#fae8ff", lt: "#86198f", db: "rgba(134,25,143,0.25)", dt: "#e879f9" },
  performance:   { lb: "#fef9c3", lt: "#854d0e", db: "rgba(133,77,14,0.25)",  dt: "#fde047" },
  departments:   { lb: "#f0fdf4", lt: "#15803d", db: "rgba(21,128,61,0.25)",  dt: "#86efac" },
  payments:      { lb: "#fff7ed", lt: "#c2410c", db: "rgba(194,65,12,0.25)",  dt: "#fdba74" },
  roles:         { lb: "#ede9fe", lt: "#7c3aed", db: "rgba(124,58,237,0.25)", dt: "#c4b5fd" },
  permissions:   { lb: "#fdf2f8", lt: "#a21caf", db: "rgba(162,28,175,0.25)", dt: "#e879f9" },
};

function getModuleColor(mod, isDark) {
  const p = MODULE_PALETTE[mod?.toLowerCase()] || {
    lb: "#f3f4f6", lt: "#374151", db: "rgba(75,85,99,0.25)", dt: "#d1d5db",
  };
  return isDark
    ? { background: p.db, color: p.dt }
    : { background: p.lb, color: p.lt };
}

// Role badge palette — light and dark
const ROLE_PALETTE = {
  admin:           { lb: "#fff7ed", lt: "#c2410c", db: "rgba(194,65,12,0.2)",  dt: "#fb923c" },
  administrator:   { lb: "#fff7ed", lt: "#c2410c", db: "rgba(194,65,12,0.2)",  dt: "#fb923c" },
  project_manager: { lb: "#eff6ff", lt: "#1d4ed8", db: "rgba(29,78,216,0.2)",  dt: "#60a5fa" },
  hr_manager:      { lb: "#f0fdf4", lt: "#15803d", db: "rgba(21,128,61,0.2)",  dt: "#4ade80" },
  employee:        { lb: "#f9fafb", lt: "#374151", db: "rgba(75,85,99,0.2)",   dt: "#9ca3af" },
};

function getRoleBadgeStyle(roleName, isDark) {
  const key = roleName?.toLowerCase().replace(/ /g, "_");
  const p = ROLE_PALETTE[key] || ROLE_PALETTE.employee;
  return isDark
    ? { background: p.db, color: p.dt, border: `1px solid ${p.dt}30` }
    : { background: p.lb, color: p.lt, border: `1px solid ${p.lt}25` };
}

// Status badge
function getStatusStyle(status, isDark) {
  if (status === "active") {
    return isDark
      ? { background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }
      : { background: "#ecfdf5",               color: "#065f46", border: "1px solid #a7f3d0" };
  }
  return isDark
    ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }
    : { background: "#fef2f2",              color: "#991b1b", border: "1px solid #fecaca" };
}

function Avatar({ name }) {
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <span className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold flex-shrink-0 text-sm">
      {initials}
    </span>
  );
}

// ── View Permissions Modal ─────────────────────────────────────────────────────
function ViewPermissionsModal({ user, rolesWithPermissions, isDark, onClose }) {
  const [activeModule, setActiveModule] = useState("all");
  const [searchPerm, setSearchPerm] = useState("");

  const rolePermissions = user.roles.flatMap(r => {
    const found = rolesWithPermissions.find(rp => rp.id === r.id);
    return (found?.permissions || []).map(p => ({ ...p, roleName: r.display_name }));
  });

  const uniquePerms = Object.values(
    rolePermissions.reduce((acc, p) => { acc[p.id] = p; return acc; }, {})
  );

  const grouped = uniquePerms.reduce((acc, p) => {
    const mod = p.module || "other";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const modules = Object.keys(grouped).sort();

  const filteredGrouped = Object.entries(grouped).reduce((acc, [mod, perms]) => {
    if (activeModule !== "all" && mod !== activeModule) return acc;
    const filtered = perms.filter(p =>
      p.name.toLowerCase().includes(searchPerm.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchPerm.toLowerCase())
    );
    if (filtered.length) acc[mod] = filtered;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-color)", background: isDark ? "rgba(249,115,22,0.08)" : "#fff7ed" }}>
          <div className="flex items-center gap-3">
            <Avatar name={`${user.first_name} ${user.last_name}`} />
            <div>
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                {user.first_name} {user.last_name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {user.roles.map(r => (
                  <span key={r.id} className="text-xs font-medium" style={{ color: "#f97316" }}>
                    {r.display_name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "#f97316" }}>{uniquePerms.length}</span> permissions
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search + Module tabs */}
        <div className="px-6 py-3 space-y-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <input type="text" placeholder="Search permissions…" value={searchPerm}
            onChange={e => setSearchPerm(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
          <div className="flex gap-1.5 overflow-x-auto pb-1 table-scroll">
            {["all", ...modules].map(mod => (
              <button key={mod} onClick={() => setActiveModule(mod)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={activeModule === mod
                  ? { background: "#f97316", color: "#fff" }
                  : { background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border-color)" }
                }>
                {mod === "all" ? "All" : mod.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {Object.entries(filteredGrouped).length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>No permissions match your search.</div>
          ) : Object.entries(filteredGrouped).map(([mod, perms]) => {
            const mc = getModuleColor(mod, isDark);
            return (
              <div key={mod}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                    style={mc}>{mod.replace(/_/g, " ")}</span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{perms.length} permissions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map(p => (
                    <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ border: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
                      <div className="mt-0.5 h-4 w-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: isDark ? "rgba(249,115,22,0.2)" : "#ffedd5" }}>
                        <svg className="h-2.5 w-2.5" style={{ color: "#f97316" }} fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium font-mono truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4"
          style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
          <button onClick={onClose}
            className="px-5 py-2 text-sm rounded-lg font-medium text-white transition-colors"
            style={{ background: "#f97316" }}
            onMouseEnter={e => e.currentTarget.style.background = "#ea6a05"}
            onMouseLeave={e => e.currentTarget.style.background = "#f97316"}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Permissions Modal ─────────────────────────────────────────────────────
function PermissionModal({ user, allPermissions, initialSelectedIds, isDark, onClose, onSave }) {
  const [selected, setSelected] = useState(new Set(initialSelectedIds));
  const [saving, setSaving] = useState(false);
  const [searchPerm, setSearchPerm] = useState("");
  const [activeModule, setActiveModule] = useState("all");

  const modules = ["all", ...Object.keys(allPermissions)];

  const filteredPerms = Object.entries(allPermissions).reduce((acc, [mod, perms]) => {
    if (activeModule !== "all" && mod !== activeModule) return acc;
    const filtered = perms.filter(p =>
      p.name.toLowerCase().includes(searchPerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchPerm.toLowerCase())
    );
    if (filtered.length) acc[mod] = filtered;
    return acc;
  }, {});

  const togglePerm = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = (perms) => {
    const ids = perms.map(p => p.id);
    const allOn = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => allOn ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const roleId = user.roles?.[0]?.id;
      await onSave(roleId, [...selected]);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const totalPerms = Object.values(allPermissions).flat().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-color)", background: isDark ? "rgba(249,115,22,0.08)" : "#fff7ed" }}>
          <div className="flex items-center gap-3">
            <Avatar name={`${user.first_name} ${user.last_name}`} />
            <div>
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "#f97316" }}>{selected.size}</span>/{totalPerms} selected
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search + tabs */}
        <div className="px-6 py-3 space-y-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <input type="text" placeholder="Search permissions…" value={searchPerm}
            onChange={e => setSearchPerm(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
          <div className="flex gap-1.5 overflow-x-auto pb-1 table-scroll">
            {modules.map(mod => (
              <button key={mod} onClick={() => setActiveModule(mod)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={activeModule === mod
                  ? { background: "#f97316", color: "#fff" }
                  : { background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border-color)" }
                }>
                {mod === "all" ? "All" : mod.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {Object.entries(filteredPerms).length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>No permissions match your search.</div>
          ) : Object.entries(filteredPerms).map(([mod, perms]) => {
            const mc = getModuleColor(mod, isDark);
            const allOn = perms.every(p => selected.has(p.id));
            return (
              <div key={mod}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={mc}>
                      {mod.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{perms.length} permissions</span>
                  </div>
                  <button onClick={() => toggleAll(perms)}
                    className="text-xs font-medium transition-colors"
                    style={{ color: "#f97316" }}>
                    {allOn ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map(p => (
                    <label key={p.id} className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={selected.has(p.id)
                        ? { border: "1px solid #fdba74", background: isDark ? "rgba(249,115,22,0.1)" : "#fff7ed" }
                        : { border: "1px solid var(--border-color)", background: "var(--bg-primary)" }
                      }>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => togglePerm(p.id)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium font-mono truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{p.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)", background: "var(--bg-secondary)" }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--bg-secondary)"}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm rounded-lg text-white font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
            style={{ background: "#f97316" }}
            onMouseEnter={e => !saving && (e.currentTarget.style.background = "#ea6a05")}
            onMouseLeave={e => e.currentTarget.style.background = "#f97316"}>
            {saving && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {saving ? "Saving…" : "Save permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RolePermissionPage() {
  const [users, setUsers] = useState([]);
  const [allPermissions, setAllPermissions] = useState({});
  const [rolesWithPermissions, setRolesWithPermissions] = useState([]);
  const [rolePermCountOverrides, setRolePermCountOverrides] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [modalUser, setModalUser] = useState(null);
  const [modalInitialIds, setModalInitialIds] = useState([]);
  const [viewUser, setViewUser] = useState(null);

  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored === "true") { setDark(true); document.documentElement.classList.add("dark"); }
  }, []);

  const toggleDark = () => {
    setDark(d => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("darkMode", String(next));
      return next;
    });
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, permsRes, rolesRes] = await Promise.all([
        apiFetch("/auth/all"),
        apiFetch("/permissions"),
        apiFetch("/permissions/roles-permissions"),
      ]);
      setUsers(usersRes.users || []);
      setAllPermissions(permsRes.data || {});
      setRolesWithPermissions(rolesRes.data || []);
      setRolePermCountOverrides({});
    } catch {
      setError("Failed to load data. Check your connection and bearer token.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getPermCountForUser = (user) =>
    user.roles.reduce((total, r) => {
      if (rolePermCountOverrides[r.id] !== undefined) return total + rolePermCountOverrides[r.id];
      const found = rolesWithPermissions.find(rp => rp.id === r.id);
      return total + (found?.permissions?.length || 0);
    }, 0);

  const openEditModal = (user) => {
    const currentIds = user.roles.flatMap(r => {
      if (rolePermCountOverrides[r.id] !== undefined) return rolePermCountOverrides[`ids_${r.id}`] || [];
      const found = rolesWithPermissions.find(rp => rp.id === r.id);
      return (found?.permissions || []).map(p => p.id);
    });
    setModalInitialIds(currentIds);
    setModalUser(user);
  };

  const savePermissions = async (roleId, permissionIds) => {
    await apiFetch(`/permissions/update-permission/${roleId}`, {
      method: "PUT",
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
    setRolePermCountOverrides(prev => ({
      ...prev,
      [roleId]: permissionIds.length,
      [`ids_${roleId}`]: permissionIds,
    }));
    setRolesWithPermissions(prev =>
      prev.map(r => {
        if (r.id !== roleId) return r;
        const allFlat = Object.values(allPermissions).flat();
        return { ...r, permissions: allFlat.filter(p => permissionIds.includes(p.id)) };
      })
    );
    showToast("Permissions updated successfully!");
  };

  const handleSaveAndClose = async (roleId, permissionIds) => {
    try { await savePermissions(roleId, permissionIds); }
    catch { showToast("Failed to save permissions.", "error"); throw new Error("save failed"); }
  };

  const filtered = users.filter(u => {
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.roles.some(r => r.name === roleFilter);
    return matchSearch && matchRole;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const uniqueRoles = [...new Map(users.flatMap(u => u.roles).map(r => [r.id, r])).values()];

  const cs = { background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }; // card style
  const tp = { color: "var(--text-primary)" };
  const tm = { color: "var(--text-secondary)" };

  return (
    <div className="min-h-screen transition-colors duration-300"
      style={{ background: "var(--background)", color: "var(--text-primary)" }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slideDown
          ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
          {toast.type === "error"
            ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 shadow-sm"
        style={{ background: "var(--bg-navbar)", borderBottom: "1px solid var(--border-color)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #fb923c, #ea580c)" }}>
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none" style={tp}>Role &amp; Permissions</h1>
              <p className="text-xs mt-0.5" style={tm}>Manage user access control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />, action: loadData, title: "Refresh" },
            ].map((b, i) => (
              <button key={i} onClick={b.action} title={b.title}
                className="p-2 rounded-lg transition-colors"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
                onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-secondary)"}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{b.icon}</svg>
              </button>
            ))}
            <button onClick={toggleDark} title="Toggle dark mode"
              className="p-2 rounded-lg transition-colors"
              style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--bg-secondary)"}>
              {dark
                ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              }
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Users",       value: users.length,                                    grad: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
            { label: "Roles",             value: uniqueRoles.length,                              grad: "linear-gradient(135deg,#f97316,#ea580c)" },
            { label: "Total Permissions", value: Object.values(allPermissions).flat().length,     grad: "linear-gradient(135deg,#10b981,#059669)" },
            { label: "Active",            value: users.filter(u => u.status === "active").length, grad: "linear-gradient(135deg,#0ea5e9,#0284c7)" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 shadow-sm" style={cs}>
              <p className="text-xs font-medium mb-1" style={tm}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ background: s.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm" style={cs}>
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-secondary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search users…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
            <option value="all">All Roles</option>
            {uniqueRoles.map(r => <option key={r.id} value={r.name}>{r.display_name}</option>)}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 text-sm flex items-center gap-3"
            style={{ background: dark ? "rgba(239,68,68,0.1)" : "#fef2f2", border: "1px solid #fecaca", color: dark ? "#f87171" : "#991b1b" }}>
            <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-xl p-12 flex items-center justify-center shadow-sm" style={cs}>
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8" style={{ color: "#f97316" }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm" style={tm}>Loading users…</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden md:block rounded-xl shadow-sm overflow-hidden" style={cs}>
              <div className="overflow-x-auto table-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
                      {["Role", "Status", "Last Login", "Permissions", "Actions"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide" style={tm}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={tm}>No users found.</td></tr>
                    ) : paginated.map((user, idx) => {
                      const permCount = getPermCountForUser(user);
                      return (
                        <tr key={user.id} className="transition-colors"
                          style={{ borderTop: idx === 0 ? "none" : "1px solid var(--border-color)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--table-hover)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                          {/* Role */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-1.5">
                              {user.roles.map(r => (
                                <span key={r.id}
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                                  style={getRoleBadgeStyle(r.name, dark)}>
                                  {r.display_name}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={getStatusStyle(user.status, dark)}>
                              <span className="inline-block h-1.5 w-1.5 rounded-full"
                                style={{ background: user.status === "active" ? (dark ? "#34d399" : "#059669") : (dark ? "#f87171" : "#dc2626") }} />
                              {user.status}
                            </span>
                          </td>

                          {/* Last Login */}
                          <td className="px-5 py-3.5 text-xs" style={tm}>
                            {user.last_login_at
                              ? new Date(user.last_login_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </td>

                          {/* Perms count */}
                          <td className="px-5 py-3.5">
                            <span className="text-xs" style={tm}>
                              <span className="font-semibold" style={{ color: "#f97316" }}>{permCount}</span> perms
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setViewUser(user)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                                style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)", background: "var(--bg-secondary)" }}
                                onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-secondary)"}>
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              <button onClick={() => openEditModal(user)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors"
                                style={{ background: "#f97316" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#ea6a05"}
                                onMouseLeave={e => e.currentTarget.style.background = "#f97316"}>
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile cards ── */}
            <div className="md:hidden space-y-3">
              {paginated.length === 0 ? (
                <div className="text-center py-12 text-sm" style={tm}>No users found.</div>
              ) : paginated.map(user => {
                const permCount = getPermCountForUser(user);
                return (
                  <div key={user.id} className="rounded-xl p-4 shadow-sm space-y-3" style={cs}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${user.first_name} ${user.last_name}`} />
                        <div>
                          <p className="font-semibold text-sm" style={tp}>{user.first_name} {user.last_name}</p>
                          <p className="text-xs" style={tm}>{user.email}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={getStatusStyle(user.status, dark)}>
                        <span className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: user.status === "active" ? (dark ? "#34d399" : "#059669") : (dark ? "#f87171" : "#dc2626") }} />
                        {user.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map(r => (
                        <span key={r.id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={getRoleBadgeStyle(r.name, dark)}>
                          {r.display_name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border-color)" }}>
                      <p className="text-xs" style={tm}>
                        <span className="font-semibold" style={{ color: "#f97316" }}>{permCount}</span> permissions
                      </p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                          style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)", background: "var(--bg-secondary)" }}>
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button onClick={() => openEditModal(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors"
                          style={{ background: "#f97316" }}>
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl px-5 py-3 shadow-sm" style={cs}>
                <p className="text-sm" style={tm}>
                  Showing <span className="font-medium" style={tp}>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}</span> of{" "}
                  <span className="font-medium" style={tp}>{filtered.length}</span> users
                </p>
                <div className="flex items-center gap-1">
                  {[["«", () => setPage(1)], ["‹", () => setPage(p => Math.max(1, p - 1))]].map(([l, a]) => (
                    <button key={l} onClick={a} disabled={page === 1}
                      className="px-2.5 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40"
                      style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>{l}</button>
                  ))}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, i, arr) => { if (i > 0 && arr[i - 1] !== p - 1) acc.push("…"); acc.push(p); return acc; }, [])
                    .map((p, i) => p === "…"
                      ? <span key={`e${i}`} className="px-2" style={tm}>…</span>
                      : <button key={p} onClick={() => setPage(p)}
                          className="min-w-[2rem] px-2 py-1.5 text-xs rounded-lg transition-colors"
                          style={page === p
                            ? { background: "#f97316", border: "1px solid #f97316", color: "#fff", fontWeight: 600 }
                            : { border: "1px solid var(--border-color)", color: "var(--text-secondary)" }
                          }>{p}</button>
                    )
                  }
                  {[["›", () => setPage(p => Math.min(totalPages, p + 1))], ["»", () => setPage(totalPages)]].map(([l, a]) => (
                    <button key={l} onClick={a} disabled={page === totalPages}
                      className="px-2.5 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40"
                      style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Roles Overview ── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={tm}>Roles Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rolesWithPermissions.map(role => {
              const totalPerms = Object.values(allPermissions).flat().length || 1;
              const pct = Math.min(100, (role.permissions.length / totalPerms) * 100);
              const uniqueMods = [...new Set(role.permissions.map(p => p.module).filter(Boolean))];

              return (
                <div key={role.id} className="rounded-xl p-4 shadow-sm space-y-3" style={cs}>
                  {/* Title + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm" style={tp}>{role.display_name}</p>
                      <p className="text-xs mt-0.5" style={tm}>{role.description}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                      style={role.is_active
                        ? (dark ? { background: "rgba(16,185,129,0.15)", color: "#34d399" } : { background: "#ecfdf5", color: "#065f46" })
                        : (dark ? { background: "rgba(107,114,128,0.2)", color: "#9ca3af" } : { background: "#f9fafb", color: "#6b7280" })
                      }>
                      <span className="h-1.5 w-1.5 rounded-full inline-block"
                        style={{ background: role.is_active ? "#10b981" : "#9ca3af" }} />
                      {role.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: dark ? "rgba(255,255,255,0.08)" : "#f3f4f6" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: "linear-gradient(90deg,#fb923c,#ea580c)" }} />
                    </div>
                    <span className="text-xs flex-shrink-0 font-medium" style={{ color: "#f97316" }}>
                      {role.permissions.length} perms
                    </span>
                  </div>

                  {/* Module tags */}
                  <div className="flex flex-wrap gap-1">
                    {uniqueMods.slice(0, 5).map(mod => (
                      <span key={mod}
                        className="px-1.5 py-0.5 rounded text-xs font-medium capitalize"
                        style={getModuleColor(mod, dark)}>
                        {mod.replace(/_/g, " ")}
                      </span>
                    ))}
                    {uniqueMods.length > 5 && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{ background: dark ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: "var(--text-secondary)" }}>
                        +{uniqueMods.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Modals */}
      {viewUser && (
        <ViewPermissionsModal
          user={viewUser}
          rolesWithPermissions={rolesWithPermissions}
          isDark={dark}
          onClose={() => setViewUser(null)}
        />
      )}
      {modalUser && (
        <PermissionModal
          user={modalUser}
          allPermissions={allPermissions}
          initialSelectedIds={modalInitialIds}
          isDark={dark}
          onClose={() => setModalUser(null)}
          onSave={handleSaveAndClose}
        />
      )}
    </div>
  );
}