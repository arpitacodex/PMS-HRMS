"use client";

import { Megaphone, Loader2, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUnreadNoticeCount } from "@/src/hooks/useUnreadNotificationCount";

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
  return new Date(dateStr).toLocaleDateString();
}

export default function NoticeDropdown({
  token,
  externalOpen,
  setExternalOpen,
  inlineMode = false,
  onClose,
}) {
  const router = useRouter();
  const { unreadCount, setUnreadCount } = useUnreadNoticeCount(token);

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  const isOpen = inlineMode ? true : !!externalOpen;

  const fetchNotices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        // Only show unread notices — already-read ones are filtered out on load
        setNotices(data.data.filter((n) => !n.is_read));
      }
    } catch (err) {
      console.error("Fetch notices error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) fetchNotices();
  }, [isOpen, fetchNotices]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(fetchNotices, 15000);
    return () => clearInterval(interval);
  }, [isOpen, fetchNotices]);

  // Mark as read + remove from list
  const markAndRemove = useCallback(async (noticeId) => {
    // Instantly remove from UI
    setNotices((prev) => prev.filter((n) => n.id !== noticeId));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`${API}/mark-read/${noticeId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Mark notice as read error:", err);
    }
  }, [token, setUnreadCount]);

  const handleItemClick = async (notice) => {
    await markAndRemove(notice.id);
    if (notice.link) router.push(notice.link);
    if (inlineMode) onClose?.();
    else setExternalOpen?.(false);
  };

  // × button — mark read & remove without navigating
  const handleDismiss = async (e, notice) => {
    e.stopPropagation(); // don't trigger handleItemClick
    await markAndRemove(notice.id);
  };

const listBody = (
  <>
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Notifications</span>
      {notices.length > 0 && (
        <button
          onClick={async () => {
            const ids = notices.map((n) => n.id);
            setNotices([]);
            setUnreadCount(0);
            await Promise.allSettled(
              ids.map((id) =>
                fetch(`${API}/mark-read/${id}`, {
                  method: "PATCH",
                  headers: { Authorization: `Bearer ${token}` },
                })
              )
            );
          }}
          className="text-[11px] font-medium text-orange-500 hover:text-orange-600 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>

    {/* List */}
    <div className="max-h-96 overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
        </div>
      ) : notices.length > 0 ? (
        notices.map((notice) => (
          <div
            key={notice.id}
            onClick={() => handleItemClick(notice)}
            className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-orange-50 dark:hover:bg-white/5 group"
            style={{
              borderBottom: "1px solid var(--border-color)",
              backgroundColor: "rgba(249,115,22,0.06)",
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#f9731622" }}>
              <Megaphone size={15} style={{ color: "#f97316" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-snug font-semibold" style={{ color: "var(--text-primary)" }}>
                {notice.message || notice.title}
              </p>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {timeAgo(notice.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <button
                onClick={(e) => handleDismiss(e, notice)}
                className="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-white/10"
                title="Dismiss"
              >
                <X size={11} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="py-10 text-center text-[13px]" style={{ color: "var(--text-secondary)" }}>
          No new notifications
        </div>
      )}
    </div>

    {/* ── View all footer link ─────────────────────────────────────── */}
    <div
      className="px-4 py-2.5 flex items-center justify-center"
      style={{ borderTop: "1px solid var(--border-color)" }}
    >
      <button
        onClick={() => {
          router.push("/notification");
          if (inlineMode) onClose?.();
          else setExternalOpen?.(false);
        }}
        className="text-[12px] font-semibold text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1"
      >
        View all notifications →
      </button>
    </div>
  </>
);

  if (inlineMode) return listBody;

  return (
    <>
      <button
        onClick={() => setExternalOpen?.((prev) => !prev)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20"
        title={unreadCount > 0 ? `${unreadCount} unread notices` : "Notices"}
      >
        <Megaphone size={18} style={{ color: unreadCount > 0 ? "#f97316" : "var(--text-secondary)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold leading-none text-white select-none ring-2 ring-white dark:ring-gray-900"
            style={{ background: "linear-gradient(135deg,#ff6b1a,#ff9a56)" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {externalOpen && (
        <div
          className="hidden md:flex absolute right-0 top-11 mt-1 w-80 rounded-xl shadow-2xl flex-col z-50"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          {listBody}
        </div>
      )}
    </>
  );
}