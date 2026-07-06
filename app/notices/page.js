"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  CheckCheck,
  AlertTriangle,
  Clock,
  Info,
  Calendar,
  Users,
  Tag,
  Filter,
  Search,
  FileText,
} from "lucide-react";

const API = "http://localhost:8080/api/notices";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

// function getUserRole() {
//   if (typeof window === "undefined") return "employee";
//   const keys = ["roles", "role", "userRoles", "user_roles", "userRole"];
//   for (const key of keys) {
//     const raw = localStorage.getItem(key);
//     if (!raw) continue;
//     try {
//       const parsed = JSON.parse(raw);
//       if (Array.isArray(parsed) && parsed[0]?.name)
//         return parsed[0].name.toLowerCase();
//       if (typeof parsed === "string") return parsed.toLowerCase();
//       if (parsed?.name) return parsed.name.toLowerCase();
//     } catch {
//       if (raw.length < 30) return raw.toLowerCase().trim();
//     }
//   }
//   try {
//     const token = localStorage.getItem("token");
//     if (token) {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       const r =
//         payload?.role ||
//         payload?.roles?.[0]?.name ||
//         payload?.roles?.[0] ||
//         payload?.user?.role;
//       if (r) return String(r).toLowerCase();
//     }
//   } catch {}
//   return "employee";
// }

function getUserRole() {
  if (typeof window === "undefined") return "employee";
  return (localStorage.getItem("role") || "employee").toLowerCase().trim();
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (
    parts.length === 1
      ? parts[0][0]
      : parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-indigo-100 text-indigo-600",
  "bg-rose-100 text-rose-600",
  "bg-cyan-100 text-cyan-600",
];

function getAvatarColor(name = "") {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] || AVATAR_COLORS[0];
}

const PRIORITY_CFG = {
  high: {
    label: "High",
    badge: "bg-red-50 text-red-600 border border-red-200",
    dot: "bg-red-500",
    accent: "border-l-red-500",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-50 text-amber-600 border border-amber-200",
    dot: "bg-amber-500",
    accent: "border-l-amber-500",
  },
  low: {
    label: "Low",
    badge: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    dot: "bg-emerald-500",
    accent: "border-l-emerald-500",
  },
};

const TYPE_CFG = {
  general: { icon: <Info size={11} />, color: "bg-gray-50 text-gray-600 border border-gray-200" },
  urgent:  { icon: <AlertTriangle size={11} />, color: "bg-red-50 text-red-600 border border-red-200" },
  meeting: { icon: <Users size={11} />, color: "bg-blue-50 text-blue-600 border border-blue-200" },
  event:   { icon: <Calendar size={11} />, color: "bg-purple-50 text-purple-600 border border-purple-200" },
  policy:  { icon: <Tag size={11} />, color: "bg-teal-50 text-teal-600 border border-teal-200" },
};

const NOTICE_TYPES = ["general", "policy", "event", "urgent", "meeting"];
const PRIORITIES   = ["low", "medium", "high"];

const emptyForm = {
  title: "",
  content: "",
  notice_type: "general",
  priority: "medium",
  target_audience: "all",
  valid_from: new Date().toISOString().split("T")[0],
  valid_to: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
};

// ─── Modal ──────────────────────────────────────────────────────────────────
function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {children}
    </label>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition text-sm"
    />
  );
}

function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition resize-none text-sm"
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition text-sm"
    >
      {children}
    </select>
  );
}

// ─── Notice Form ─────────────────────────────────────────────────────────────
function NoticeForm({ initial = emptyForm, onSubmit, loading, submitLabel }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="Enter notice title" />
      </div>
      <div>
        <Label>Content *</Label>
        <Textarea value={form.content} onChange={(e) => set("content", e.target.value)} required rows={5} placeholder="Write the full notice content here..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Notice Type</Label>
          <Select value={form.notice_type} onChange={(e) => set("notice_type", e.target.value)}>
            {NOTICE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <Label>Target Audience</Label>
        <Select value={form.target_audience} onChange={(e) => set("target_audience", e.target.value)}>
          <option value="all">All Employees</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Valid From</Label>
          <Input type="date" value={form.valid_from} onChange={(e) => set("valid_from", e.target.value)} />
        </div>
        <div>
          <Label>Valid To</Label>
          <Input type="date" value={form.valid_to} onChange={(e) => set("valid_to", e.target.value)} />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
      >
        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function NoticesPage() {
  const [notices, setNotices]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [editNotice, setEditNotice]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formLoading, setFormLoading]   = useState(false);
  const [error, setError]               = useState("");
  const [filterType, setFilterType]     = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch]             = useState("");
  const [localReadIds, setLocalReadIds] = useState(new Set());

  const token = getToken();
  const [canManage, setCanManage] = useState(() => {
    const r = getUserRole();
    return r === "admin" || r === "hr";
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!token || !userId) return;
    fetch(`http://localhost:8080/api/auth/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user?.roles?.length) {
          const roleName = data.user.roles[0].name.toLowerCase();
          setCanManage(roleName === "admin" || roleName === "hr");
        }
      })
      .catch(() => {});
  }, [token]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      let apiUnread = 0;
      const countRes = await fetch(`${API}/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
      const countData = await countRes.json();
      if (countData.unread_count !== undefined) { apiUnread = countData.unread_count; setUnreadCount(apiUnread); }
      const res  = await fetch(`${API}/`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data) {
        const sorted = [...data.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        // let unreadLeft = apiUnread;
        // const withReadState = sorted.map((n) => {
        //   if (unreadLeft > 0) { unreadLeft--; return { ...n, is_read: false }; }
        //   return { ...n, is_read: true };
        // });

        const withReadState = sorted.map((n) => ({
  ...n,
  is_read: n.noticeRecipients?.[0]?.is_read ?? true
}));
        setNotices(withReadState);
      }
    } catch {}
    setLoading(false);
  };

  const fetchUnreadCount = async () => {
    try {
      const res  = await fetch(`${API}/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.unread_count !== undefined) setUnreadCount(data.unread_count);
    } catch {}
  };

  useEffect(() => {
    const initLoad = async () => {
      let apiUnread = 0;
      try {
        const res  = await fetch(`${API}/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.unread_count !== undefined) { apiUnread = data.unread_count; setUnreadCount(apiUnread); }
      } catch {}
      setLoading(true);
      try {
        const res  = await fetch(`${API}/`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.data) {
          const sorted = [...data.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          let unreadLeft = apiUnread;
          // const withReadState = sorted.map((n) => {
          //   if (n.is_read === true) return { ...n, is_read: true };
          //   if (unreadLeft > 0) { unreadLeft--; return { ...n, is_read: false }; }
          //   return { ...n, is_read: true };
          // });

                  const withReadState = sorted.map((n) => ({
          ...n,
          is_read: n.noticeRecipients?.[0]?.is_read ?? true
        }));
          setNotices(withReadState);
        }
      } catch {}
      setLoading(false);
    };
    initLoad();
  }, []);

  const markRead = async (noticeId) => {
    setNotices((prev) => prev.map((n) => (n.id === noticeId ? { ...n, is_read: true } : n)));
    setLocalReadIds((prev) => new Set([...prev, noticeId]));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`${API}/read/${noticeId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };

  const markAllRead = async () => {
    const unread = notices.filter((n) => !n.is_read);
    if (unread.length === 0) {
      setNotices((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setLocalReadIds(new Set(notices.map((n) => n.id)));
      setUnreadCount(0);
      for (const n of notices) {
        try { await fetch(`${API}/read/${n.id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); } catch {}
      }
    } else {
      for (const n of unread) await markRead(n.id);
    }
  };

  const openNotice = (notice) => {
    setSelectedNotice(notice);
    if (!notice.is_read) markRead(notice.id);
  };

  const handleCreate = async (form) => {
    setFormLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/create`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to create notice"); setFormLoading(false); return; }
      setShowCreate(false); fetchNotices(); fetchUnreadCount();
    } catch { setError("Network error"); }
    setFormLoading(false);
  };

  const handleUpdate = async (form) => {
    setFormLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/update/${editNotice.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to update"); setFormLoading(false); return; }
      setEditNotice(null); fetchNotices();
    } catch { setError("Network error"); }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await fetch(`${API}/delete/${deleteTarget.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setDeleteTarget(null); fetchNotices(); fetchUnreadCount();
    } catch {}
    setFormLoading(false);
  };

  const filtered = notices.filter((n) => {
    if (filterType !== "all" && n.notice_type !== filterType) return false;
    if (filterPriority !== "all" && n.priority !== filterPriority) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const localUnread     = filtered.filter((n) => !n.is_read).length;
  const unreadFiltered  = localReadIds.size > 0 ? localUnread : unreadCount;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Bell size={18} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 leading-tight">Notices</h1>
              <p className="text-xs text-gray-400">Company announcements &amp; updates</p>
            </div>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold bg-orange-500 text-white px-2.5 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg hover:bg-emerald-100 transition"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            <button
              onClick={() => { fetchNotices(); fetchUnreadCount(); }}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            {canManage && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition shadow-sm"
              >
                <Plus size={14} /> Create Notice
              </button>
            )}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-gray-400 flex-shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
            >
              <option value="all">All Types</option>
              {NOTICE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
            >
              <option value="all">All Priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <span className="self-center text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {unreadFiltered > 0 && <span className="ml-1 text-orange-500 font-medium">({unreadFiltered} unread)</span>}
          </span>
        </div>
      </div>

      {/* Notice List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <FileText size={28} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">No notices found</p>
          {canManage && (
            <button onClick={() => setShowCreate(true)} className="text-xs font-semibold text-orange-500 hover:text-orange-600 mt-1">
              + Create the first notice
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notice) => {
            const pc          = PRIORITY_CFG[notice.priority] || PRIORITY_CFG.low;
            const tc          = TYPE_CFG[notice.notice_type]  || TYPE_CFG.general;
            const creatorName = notice.creator_name || "Admin";
            const isUnread    = !notice.is_read;

            return (
              <div
                key={notice.id}
                onClick={() => openNotice(notice)}
                className={`
                  group relative rounded-xl border-l-[3px] cursor-pointer
                  transition-all duration-200 hover:shadow-md hover:-translate-y-px bg-white
                  ${pc.accent} border border-gray-200
                  ${isUnread ? "shadow-sm" : "opacity-80"}
                `}
              >
                {/* Unread dot */}
                {isUnread && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500" />
                )}

                <div className="flex items-start gap-3 p-4 pr-8">
                  {/* Avatar */}
                  <div className={`w-9 h-9 min-w-[36px] rounded-full ${getAvatarColor(creatorName)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                    {getInitials(creatorName)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm truncate leading-tight ${isUnread ? "font-semibold text-gray-800" : "font-medium text-gray-500"}`}>
                        {notice.title}
                      </h3>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 ml-2">
                        {timeAgo(notice.created_at)}
                      </span>
                    </div>

                    {/* Preview */}
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 leading-relaxed">
                      {notice.content}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] text-gray-400">
                        By <span className="font-medium text-gray-600">{creatorName}</span>
                      </span>

                      {notice.priority && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${pc.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                          {pc.label}
                        </span>
                      )}

                      {notice.notice_type && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${tc.color}`}>
                          {tc.icon}
                          {notice.notice_type}
                        </span>
                      )}

                      {notice.valid_to && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock size={10} /> Until {notice.valid_to}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin actions (hover) */}
                  {canManage && (
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setEditNotice(notice)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(notice)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ MODALS ════════ */}

      {/* Notice Detail */}
      {selectedNotice && (
        <Modal title="Notice Detail" onClose={() => setSelectedNotice(null)}>
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className={`w-12 h-12 rounded-full ${getAvatarColor(selectedNotice.creator_name || "Admin")} flex items-center justify-center text-white text-sm font-bold shadow`}>
                {getInitials(selectedNotice.creator_name || "Admin")}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{selectedNotice.creator_name || "Admin"}</p>
                <p className="text-xs text-gray-400">
                  {timeAgo(selectedNotice.created_at)} · {new Date(selectedNotice.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-gray-800 leading-tight">{selectedNotice.title}</h2>

            <div className="flex flex-wrap gap-2">
              {selectedNotice.priority && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${PRIORITY_CFG[selectedNotice.priority]?.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CFG[selectedNotice.priority]?.dot}`} />
                  {selectedNotice.priority} priority
                </span>
              )}
              {selectedNotice.notice_type && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${TYPE_CFG[selectedNotice.notice_type]?.color}`}>
                  {TYPE_CFG[selectedNotice.notice_type]?.icon}
                  {selectedNotice.notice_type}
                </span>
              )}
              {selectedNotice.target_audience && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                  <Users size={11} /> {selectedNotice.target_audience}
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedNotice.content}</p>
            </div>

            {selectedNotice.valid_from && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                <Calendar size={13} className="flex-shrink-0 text-gray-400" />
                Valid from{" "}
                <span className="font-medium text-gray-700">{selectedNotice.valid_from}</span> to{" "}
                <span className="font-medium text-gray-700">{selectedNotice.valid_to}</span>
              </div>
            )}

            {canManage && (
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <button
                  onClick={() => { setSelectedNotice(null); setEditNotice(selectedNotice); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                >
                  <Pencil size={13} /> Edit Notice
                </button>
                <button
                  onClick={() => { setSelectedNotice(null); setDeleteTarget(selectedNotice); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create New Notice" onClose={() => { setShowCreate(false); setError(""); }}>
          {error && (
            <p className="text-xs text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              {error}
            </p>
          )}
          <NoticeForm onSubmit={handleCreate} loading={formLoading} submitLabel="Publish Notice" />
        </Modal>
      )}

      {/* Edit Modal */}
      {editNotice && (
        <Modal title="Edit Notice" onClose={() => { setEditNotice(null); setError(""); }}>
          {error && (
            <p className="text-xs text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              {error}
            </p>
          )}
          <NoticeForm
            initial={{
              title: editNotice.title,
              content: editNotice.content,
              notice_type: editNotice.notice_type || "general",
              priority: editNotice.priority || "medium",
              target_audience: editNotice.target_audience || "all",
              valid_from: editNotice.valid_from || emptyForm.valid_from,
              valid_to: editNotice.valid_to || emptyForm.valid_to,
            }}
            onSubmit={handleUpdate}
            loading={formLoading}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Delete Notice" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold">"{deleteTarget.title}"</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={formLoading}
                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}