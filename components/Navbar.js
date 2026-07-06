"use client";

import { Bell, Menu, Moon, Sun, MessageSquare, X, Megaphone } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";


import NotificationDropdown from "@/components/NotificationDropdown";
import NoticeDropdown from "@/components/NoticeDropdown";

// ── unread badge imports ──────────────────────────────────────────────────
import { useSocket }      from "@/src/hooks/useSocket";
import { useUnreadCount } from "@/src/hooks/useUnreadCount";

const API = "http://localhost:8080/api/auth";

export default function Navbar({ isOpen, setIsOpen }) {
  const [user,        setUser]        = useState({});
  const [dark,        setDark]        = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [noticeOpen,  setNoticeOpen]  = useState(false);

  const notifRef  = useRef(null);
  const noticeRef = useRef(null);

  const token  = typeof window !== "undefined" ? localStorage.getItem("token")  : null;
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // ── live unread count for chat icon ─────────────────────────────────────
  // Reuses the singleton socket — zero extra connections
  const { socketRef }   = useSocket();
  const { totalUnread } = useUnreadCount(socketRef);

  // ── Theme ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // ── Fetch logged-in user ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !userId) return;
    fetch(`${API}/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.user); })
      .catch(e => console.error("Navbar user fetch error:", e));
  }, []);

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (noticeRef.current && !noticeRef.current.contains(e.target)) setNoticeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Prevent body scroll when either panel is open on mobile ────────────
  useEffect(() => {
    const anyOpen = notifOpen || noticeOpen;
    document.body.style.overflow = (anyOpen && window.innerWidth < 768) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [notifOpen, noticeOpen]);

  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";
  const roleName = user?.roles?.[0]?.name?.toUpperCase() || "EMPLOYEE";

  return (
    <>
      <header
        className={`fixed top-0 right-0 h-16 z-50 flex items-center justify-between px-4 sm:px-6 transition-all duration-300 ${isOpen ? "md:left-72" : "md:left-20"} left-0`}
        style={{
          backgroundColor: "var(--bg-navbar)",
          borderBottom:    "1px solid var(--border-color)",
          transition:      "background-color 0.3s ease, border-color 0.3s ease",
        }}
      >
        {/* ── Left: hamburger + logo ─────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          >
            <Menu size={20} style={{ color: "var(--text-secondary)" }} />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#ff6b1a,#ff9a56)" }} />
            <span style={{ color: "var(--text-primary)" }} className="text-sm font-semibold">
              Codex <span style={{ color: "var(--text-secondary)" }} className="font-normal">Orbit</span>
            </span>
          </div>
        </div>

        {/* ── Right: actions ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 sm:gap-1.5">

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(prev => !prev)}
            title="Toggle dark mode"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          >
            {dark
              ? <Sun size={18} className="text-yellow-400" />
              : <Moon size={18} style={{ color: "var(--text-secondary)" }} />
            }
          </button>

          {/* ── Chat icon with live unread badge ───────────────────────── */}
          <Link href="/chatPage">
            <div
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20"
              title={totalUnread > 0 ? `${totalUnread} unread messages` : "Chat"}
            >
              <MessageSquare
                size={18}
                style={{ color: totalUnread > 0 ? "#f97316" : "var(--text-secondary)" }}
              />
              {totalUnread > 0 && (
                <span
                  className="
                    absolute -top-1 -right-1
                    min-w-[16px] h-4 px-1
                    flex items-center justify-center
                    rounded-full text-[9px] font-bold leading-none
                    text-white select-none
                    ring-2 ring-white dark:ring-gray-900
                    animate-bounce
                  "
                  style={{ background: "linear-gradient(135deg,#ff6b1a,#ff9a56)" }}
                >
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
          </Link>

          {/* ── Notice bell (announcements/notices module) ─────────────── */}
          <div className="relative" ref={noticeRef}>
            <NoticeDropdown token={token} externalOpen={noticeOpen} setExternalOpen={setNoticeOpen} />
          </div>

          {/* ── Notification bell (general notifications) ──────────────── */}
          <div className="relative" ref={notifRef}>
            <NotificationDropdown token={token} externalOpen={notifOpen} setExternalOpen={setNotifOpen} />
          </div>

          <div className="h-7 w-px mx-1.5" style={{ backgroundColor: "var(--border-color)" }} />

          {/* Profile */}
          <Link href="/profile">
            <div className="flex items-center gap-2.5 cursor-pointer pl-1 pr-2 py-1.5 rounded-xl transition-colors">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#ff6b1a,#ff9a56)" }}
              >
                {initials}
              </div>
              <div className="hidden md:block leading-tight">
                <p className="text-[13px] font-semibold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                  {user.first_name || "User"} {user.last_name || ""}
                </p>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  {roleName}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* ── Mobile notification overlay ─────────────────────────────────────── */}
      {notifOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNotifOpen(false)} />
          <div
            className="relative rounded-2xl shadow-2xl z-10 flex flex-col w-full max-w-sm"
            style={{
              backgroundColor: "var(--bg-secondary)",
              maxHeight:        "80vh",
              border:           "1px solid var(--border-color)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <div className="flex items-center gap-2">
                <Bell size={16} style={{ color: "var(--text-secondary)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Notifications</span>
              </div>
              <button
                onClick={() => setNotifOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              >
                <X size={16} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <NotificationDropdown token={token} inlineMode={true} onClose={() => setNotifOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile notice overlay ───────────────────────────────────────────── */}
      {noticeOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNoticeOpen(false)} />
          <div
            className="relative rounded-2xl shadow-2xl z-10 flex flex-col w-full max-w-sm"
            style={{
              backgroundColor: "var(--bg-secondary)",
              maxHeight:        "80vh",
              border:           "1px solid var(--border-color)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <div className="flex items-center gap-2">
                <Megaphone size={16} style={{ color: "var(--text-secondary)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Notices</span>
              </div>
              <button
                onClick={() => setNoticeOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              >
                <X size={16} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <NoticeDropdown token={token} inlineMode={true} onClose={() => setNoticeOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}