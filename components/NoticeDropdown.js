"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, RefreshCw, ChevronRight } from "lucide-react";
import Link from "next/link";

const API = "http://localhost:8080/api/notices";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

const priorityColor = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

const avatarColors = [
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-emerald-400 to-emerald-600",
  "from-rose-400 to-rose-600",
  "from-amber-400 to-amber-600",
  "from-cyan-400 to-cyan-600",
];

function getAvatarColor(name) {
  if (!name) return avatarColors[0];
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

// ── localStorage helpers — scoped per user so different users don't share ──
function getLsKey() {
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  return `notice_read_ids_${userId || "guest"}`;
}
function loadReadIds() {
  try {
    const saved = localStorage.getItem(getLsKey());
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}
function saveReadIds(set) {
  try {
    localStorage.setItem(getLsKey(), JSON.stringify([...set]));
  } catch {}
}

export default function NotificationDropdown({ token }) {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const dropdownRef = useRef(null);

  // ── Persisted read IDs — loaded from localStorage on mount, survives refresh ──
  const [readIds, setReadIds] = useState(() => loadReadIds());

  const addReadId = (id) => {
    setReadIds((prev) => {
      const next = new Set([...prev, id]);
      saveReadIds(next);
      return next;
    });
  };

  const addAllReadIds = (ids) => {
    setReadIds((prev) => {
      const next = new Set([...prev, ...ids]);
      saveReadIds(next);
      return next;
    });
  };

  // ── Merge server data with persisted read state ──
  const applyReadState = (rawNotices, ids) =>
    rawNotices.map((n) => ({
      ...n,
      is_read: !!n.is_read || ids.has(n.id),
    }));

  // ── Fetch badge count from server (always accurate) ──
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${API}/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.unread_count !== undefined) setUnreadCount(data.unread_count);
    } catch {}
  };

  // ── Fetch notices list, apply localStorage read state ──
  const fetchNotices = async (currentReadIds) => {
    const ids = currentReadIds ?? readIds;
    setLoading(true);
    try {
      const res = await fetch(`${API}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.data) setNotices(applyReadState(data.data, ids));
    } catch {}
    setLoading(false);
  };

  // ── On mount: poll unread count every 30s ──
  useEffect(() => {
    if (!token) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // ── Fetch notices whenever dropdown opens ──
  useEffect(() => {
    if (open) fetchNotices(readIds);
  }, [open]);

  // ── Close on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSelectedNotice(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Mark single notice as read ──
  const markAsRead = async (noticeId) => {
    // 1. Instant UI flip
    setNotices((prev) =>
      prev.map((n) => (n.id === noticeId ? { ...n, is_read: true } : n))
    );
    // 2. Persist to localStorage — survives refresh
    addReadId(noticeId);
    // 3. Decrement badge
    setUnreadCount((prev) => Math.max(0, prev - 1));
    // 4. Notify server
    try {
      await fetch(`${API}/read/${noticeId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  // ── Mark ALL as read ──
  const markAllAsRead = async () => {
    const unread = notices.filter((n) => !n.is_read);
    // Optimistic: flip all in UI and persist
    setNotices((prev) => prev.map((n) => ({ ...n, is_read: true })));
    addAllReadIds(notices.map((n) => n.id));
    setUnreadCount(0);
    for (const n of unread) {
      try {
        await fetch(`${API}/read/${n.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
  };

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    if (!notice.is_read) markAsRead(notice.id);
  };

  const previewNotices = notices.slice(0, 4);

  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── Bell Button ── */}
      <button
        onClick={() => { setOpen(!open); setSelectedNotice(null); }}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-orange-500 text-white rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 top-12 w-[380px] md:w-[420px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
          {!selectedNotice ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  Notices
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchNotices(readIds)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    title="Refresh"
                  >
                    <RefreshCw
                      size={14}
                      className={`text-gray-500 ${loading ? "animate-spin" : ""}`}
                    />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                    >
                      <CheckCheck size={14} />
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>

              {/* Section label */}
              {notices.length > 0 && (
                <div className="px-5 pt-3 pb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Today
                  </p>
                </div>
              )}

              {/* Notice list — max 4 */}
              <div className="overflow-y-auto max-h-[340px]">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : previewNotices.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    No notices
                  </div>
                ) : (
                  previewNotices.map((notice) => (
                    <button
                      key={notice.id}
                      onClick={() => handleNoticeClick(notice)}
                      className={`
                        w-full text-left px-5 py-3.5 flex gap-3 transition
                        border-b border-gray-50 dark:border-gray-800 last:border-0
                        hover:bg-gray-50 dark:hover:bg-gray-800
                        ${!notice.is_read
                          ? "bg-red-50/50 dark:bg-red-900/10"   // unread → red tint
                          : "bg-white dark:bg-gray-900"          // read   → plain white
                        }
                      `}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-br ${getAvatarColor(
                          notice.creator_name || "Admin"
                        )} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                      >
                        {getInitials(notice.creator_name || "Admin")}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate flex items-center gap-1.5">
                            {/* Always show dot: 🔴 unread, 🟢 read */}
                            <span
                              className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${
                                notice.is_read ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            {notice.title}
                          </p>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                            {timeAgo(notice.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {notice.content}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">
                            By {notice.creator_name || "Admin"}
                          </span>
                          {notice.priority && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                priorityColor[notice.priority] || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {notice.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer link */}
              <Link href="/notices">
                <div className="flex items-center justify-center gap-1 px-5 py-3.5 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    View all notices
                  </span>
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              </Link>
            </>
          ) : (
            /* ── Detail view ── */
            <div>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <X size={16} className="text-gray-500" />
                </button>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  Notification Detail
                </h3>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`w-11 h-11 min-w-[44px] rounded-full bg-gradient-to-br ${getAvatarColor(
                      selectedNotice.creator_name || "Admin"
                    )} flex items-center justify-center text-white text-sm font-bold shadow`}
                  >
                    {getInitials(selectedNotice.creator_name || "Admin")}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      Posted by{" "}
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {selectedNotice.creator_name || "Admin"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {timeAgo(selectedNotice.created_at)}
                    </p>
                  </div>
                </div>

                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {selectedNotice.title}
                </h2>

                <div className="flex gap-2 mb-3 flex-wrap">
                  {selectedNotice.priority && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        priorityColor[selectedNotice.priority] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {selectedNotice.priority} priority
                    </span>
                  )}
                  {selectedNotice.notice_type && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {selectedNotice.notice_type}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  {selectedNotice.content}
                </p>

                <div className="text-xs text-gray-400 space-y-1 border-t border-gray-100 dark:border-gray-700 pt-3">
                  {selectedNotice.valid_from && (
                    <p>
                      Valid:{" "}
                      <span className="text-gray-600 dark:text-gray-300">
                        {selectedNotice.valid_from} → {selectedNotice.valid_to}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}