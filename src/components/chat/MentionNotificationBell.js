// src/components/chat/MentionNotificationBell.js
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, AtSign } from "lucide-react";
import { Avatar } from "./ui";

export default function MentionNotificationBell({
    notifications = [],
    unreadCount    = 0,
    onMarkAllRead,
    onGoToMessage,
}) {
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleGoTo = (notification) => {
        onGoToMessage?.(notification);
        setOpen(false);
    };

    const formatTime = (ts) => {
        if (!ts) return "";
        const d    = new Date(ts);
        const diff = (Date.now() - d) / 1000;
        if (diff < 60)    return "just now";
        if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`relative p-2 rounded-xl transition-all duration-200
                    ${open
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}
                title="Mentions"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5
                        min-w-[16px] h-4
                        bg-gradient-to-r from-orange-500 to-amber-500
                        text-white text-[9px] font-bold rounded-full
                        flex items-center justify-center px-0.5
                        shadow-sm animate-bounce-in">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification panel */}
            {open && (
                <div
                    ref={panelRef}
                    className="absolute top-full right-0 mt-2 z-[250]
                        w-80 bg-white dark:bg-gray-900
                        border border-gray-200 dark:border-gray-700
                        rounded-2xl shadow-2xl overflow-hidden"
                    style={{ animation: "mentionBellPop 0.16s cubic-bezier(.34,1.56,.64,1) both" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3
                        bg-gradient-to-r from-orange-500 to-amber-400">
                        <div className="flex items-center gap-2">
                            <AtSign size={15} className="text-white" />
                            <span className="text-sm font-bold text-white">Mentions</span>
                            {unreadCount > 0 && (
                                <span className="bg-white/30 text-white text-[10px]
                                    font-bold px-1.5 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => onMarkAllRead?.()}
                                    className="p-1 rounded-lg text-white/70 hover:text-white
                                        hover:bg-white/20 transition-colors"
                                    title="Mark all read"
                                >
                                    <CheckCheck size={14} />
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-lg text-white/70 hover:text-white
                                    hover:bg-white/20 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center
                                py-10 gap-3 text-gray-400 dark:text-gray-600">
                                <div className="w-12 h-12 rounded-full
                                    bg-gray-100 dark:bg-gray-800
                                    flex items-center justify-center">
                                    <AtSign size={22} className="opacity-50" />
                                </div>
                                <p className="text-sm font-medium">No mentions yet</p>
                                <p className="text-xs text-center px-6 text-gray-400">
                                    When someone @mentions you in a group, it will appear here
                                </p>
                            </div>
                        ) : (
                            notifications.map((n, idx) => {
                                // sender comes from backend as mentioned_by or sender
                                const senderObj  = n.mentioned_by ?? n.sender;
                                const senderName = senderObj
                                    ? `${senderObj.first_name} ${senderObj.last_name ?? ""}`.trim()
                                    : "Someone";

                                // Strip @[Name](id) tokens → @Name for preview
                                const preview = (n.message_text || "")
                                    .replace(/@\[([^\]]+)\]\(\d+\)/g, "@$1")
                                    .slice(0, 80);

                                return (
                                    <button
                                        key={`${n.message_id}_${idx}`}
                                        type="button"
                                        onClick={() => handleGoTo(n)}
                                        className={`w-full flex items-start gap-3 px-4 py-3
                                            text-left transition-colors
                                            border-b last:border-0
                                            border-gray-50 dark:border-gray-800
                                            ${n.read
                                                ? "hover:bg-gray-50 dark:hover:bg-gray-800"
                                                : "bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                            }`}
                                    >
                                        {/* Avatar with unread dot */}
                                        <div className="flex-shrink-0 mt-1 relative">
                                            <Avatar
                                                name={senderName}
                                                photo={senderObj?.profile_photo}
                                                size={9}
                                            />
                                            {!n.read && (
                                                <span className="absolute -top-0.5 -right-0.5
                                                    w-2.5 h-2.5 bg-orange-500 rounded-full
                                                    border-2 border-white dark:border-gray-900" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold
                                                text-gray-800 dark:text-gray-100">
                                                <span className="text-orange-500">{senderName}</span>
                                                {" mentioned you "}
                                                {n.group_name
                                                    ? <span>in <b>{n.group_name}</b></span>
                                                    : "in a group"
                                                }
                                            </p>
                                            {preview && (
                                                <p className="text-[11px] text-gray-500
                                                    dark:text-gray-400 mt-0.5 truncate">
                                                    {preview}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {formatTime(n.receivedAt || n.created_at)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes mentionBellPop {
                    from { opacity: 0; transform: scale(0.9) translateY(-8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes bounce-in {
                    0%   { transform: scale(0); }
                    60%  { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.3s cubic-bezier(.36,2,.1,1);
                }
            `}</style>
        </div>
    );
}