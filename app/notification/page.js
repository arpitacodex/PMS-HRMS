"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, CheckCheck, RefreshCw, Loader2, BellOff, Search,
} from "lucide-react";

const API = "http://localhost:8080/api/notifications";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const TYPE_COLORS = {
  info:    { bg: "#3b82f622", icon: "#3b82f6", label: "Info" },
  success: { bg: "#22c55e22", icon: "#22c55e", label: "Success" },
  warning: { bg: "#f9731622", icon: "#f97316", label: "Warning" },
  error:   { bg: "#ef444422", icon: "#ef4444", label: "Error" },
  default: { bg: "#6b728022", icon: "#6b7280", label: "Notice" },
};

function getTypeStyle(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

/** Returns a human-friendly day label for grouping */
function getDayLabel(dateStr) {
  const date  = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  if (sameDay(date, today))     return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  // Within the same year — show "Mon, 12 Jun"
  if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }

  // Older — show "12 Jun 2023"
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Groups an array of notifications by day label, preserving order */
function groupByDay(notifications) {
  const map = new Map(); // label → [items]
  for (const n of notifications) {
    const label = getDayLabel(n.created_at);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(n);
  }
  return [...map.entries()]; // [[label, [items]], ...]
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState("all");
  const [markingAll, setMarkingAll]       = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res  = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await fetch(`${API}/mark-read/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    const unread = notifications.filter((n) => !n.is_read);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await Promise.all(
        unread.map((n) =>
          fetch(`${API}/mark-read/${n.id}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
    } catch (err) {
      console.error("Mark all read error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    const matchSearch =
      !search ||
      (n.message || n.title || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all"    ? true :
      filter === "unread" ? !n.is_read :
                             n.is_read;
    return matchSearch && matchFilter;
  });

  const grouped = groupByDay(filtered); // [[label, items], ...]

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
              <Bell size={20} color="#fff" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                Notifications
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{
                  background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                  color: "#fff",
                }}
              >
                {markingAll
                  ? <Loader2 size={13} className="animate-spin" />
                  : <CheckCheck size={13} />
                }
                Mark all read
              </button>
            )}
            <button
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
              title="Refresh"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>

        {/* ── Search + Filter ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
            <input
              type="text"
              placeholder="Search notifications…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Filter pills */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
            style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
          >
            {[
              { key: "all",    label: "All" },
              { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
              { key: "read",   label: "Read" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                style={
                  filter === key
                    ? { background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff" }
                    : { color: "var(--text-secondary)", backgroundColor: "transparent" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: "#3b82f6" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading notifications…</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <BellOff size={24} style={{ color: "var(--text-secondary)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {search ? "No notifications match your search" : "Nothing here"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {search ? "Try different keywords" : "You're all caught up!"}
            </p>
          </div>

        ) : (
          <div className="space-y-6">
            {grouped.map(([dayLabel, items]) => (
              <div key={dayLabel}>

                {/* ── Day divider ───────────────────────────────────── */}
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {dayLabel}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-color)" }} />
                  <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                    {items.length} notification{items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* ── Cards for this day ────────────────────────────── */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {items.map((n, idx) => {
                    const s = getTypeStyle(n.type);
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && markRead(n.id)}
                        className="flex items-start gap-4 px-4 sm:px-5 py-4 transition-colors cursor-pointer group"
                        style={{
                          borderBottom: idx < items.length - 1 ? "1px solid var(--border-color)" : "none",
                          backgroundColor: n.is_read ? "transparent" : s.bg,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--table-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.is_read ? "transparent" : s.bg; }}
                      >
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: s.bg }}
                        >
                          <Bell size={15} style={{ color: s.icon }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13px] leading-snug"
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: n.is_read ? 400 : 600,
                            }}
                          >
                            {n.message || n.title}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {/* Type badge */}
                            {n.type && (
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: s.bg, color: s.icon }}
                              >
                                {s.label}
                              </span>
                            )}
                            {/* Exact time */}
                            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                              {new Date(n.created_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit", minute: "2-digit", hour12: true,
                              })}
                            </span>
                            {/* Relative hint */}
                            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                              · {timeAgo(n.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Unread dot */}
                        {!n.is_read && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                            style={{ backgroundColor: s.icon }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-xs mt-8" style={{ color: "var(--text-secondary)" }}>
            {unreadCount > 0
              ? `${unreadCount} unread · click any to mark as read`
              : "All notifications read · you're up to date"}
          </p>
        )}

      </div>
    </div>
  );
}