// src/hooks/useMentions.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUserId } from "@/src/lib/auth";

// ── Token format helpers ──────────────────────────────────────────────────────

/**
 * Build the stored token: @[Full Name](userId)
 */
export function buildMentionToken(user) {
    const name = `${user.first_name} ${user.last_name ?? ""}`.trim();
    return `@[${name}](${user.id})`;
}

/**
 * Regex matching the stored token.
 * Capture groups: 1 = displayName, 2 = userId
 */
export const MENTION_TOKEN_RE = /@\[([^\]]+)\]\((\d+)\)/g;

/**
 * Parse all mention tokens in a string.
 * Returns [{ displayName, userId }]
 */
export function parseMentionTokens(text) {
    if (!text) return [];
    const results = [];
    let m;
    const re = new RegExp(MENTION_TOKEN_RE.source, "g");
    while ((m = re.exec(text)) !== null) {
        results.push({ displayName: m[1], userId: Number(m[2]) });
    }
    return results;
}

/**
 * Check if the current user is mentioned in a message.
 */
export function isMentionedInMessage(messageText, currentUserId) {
    if (!messageText || !currentUserId) return false;
    const mentions = parseMentionTokens(messageText);
    return mentions.some((mn) => Number(mn.userId) === Number(currentUserId));
}

// ── useMentions hook ──────────────────────────────────────────────────────────

export function useMentions(socketRef) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount,   setUnreadCount]   = useState(0);
    const currentUserId = getCurrentUserId();

    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket) return;

        // Backend emits "group_mention" — listen for it here
        const onMentioned = (data) => {
            // data shape from mentionParser.js:
            // { message_id, chat_group_id, group_name, message_text,
            //   mentioned_by, sender, sender_id, type, is_read, created_at }
            setNotifications((prev) => {
                // Deduplicate by message_id
                if (prev.some((n) => n.message_id === data.message_id)) return prev;
                return [
                    { ...data, read: false, receivedAt: Date.now() },
                    ...prev,
                ].slice(0, 50);
            });
            setUnreadCount((c) => c + 1);
        };

        socket.on("group_mention", onMentioned);
        return () => socket.off("group_mention", onMentioned);
    }, [socketRef]);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    const markOneRead = useCallback((messageId) => {
        setNotifications((prev) =>
            prev.map((n) =>
                n.message_id === messageId ? { ...n, read: true } : n
            )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return {
        notifications,
        unreadCount,
        markAllRead,
        markOneRead,
        clearAll,
    };
}