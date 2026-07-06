"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCurrentUserId } from "@/src/lib/auth";

export function useUnreadCount(socketRef) {
  const [totalUnread,  setTotalUnread]  = useState(0);
  const [directUnread, setDirectUnread] = useState(new Map());
  const [groupUnread,  setGroupUnread]  = useState(new Map());

  const currentUserId = getCurrentUserId();
  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    // ── Full snapshot (on connect push + manual refresh) ─────────────────────
    const onUnreadCounts = ({ total_unread, direct_chats = [], group_chats = [] }) => {
      setTotalUnread(Number(total_unread) || 0);

      const dMap = new Map();
      direct_chats.forEach(({ chat_id, unread_count }) => {
        const count = Number(unread_count);
        if (count > 0) dMap.set(Number(chat_id), count);
      });
      setDirectUnread(dMap);

      const gMap = new Map();
      group_chats.forEach(({ chat_id, unread_count }) => {
        const count = Number(unread_count);
        if (count > 0) gMap.set(Number(chat_id), count);
      });
      setGroupUnread(gMap);
    };

    // ── Navbar total only ─────────────────────────────────────────────────────
    const onUnreadCountUpdate = ({ total_unread }) => {
      setTotalUnread(Number(total_unread) || 0);
    };

    // ── Single chat badge update ──────────────────────────────────────────────
    const onChatUnreadUpdate = ({ type, chat_id, unread_count }) => {
      const id    = Number(chat_id);
      const count = Number(unread_count);
      if (isNaN(id)) return;

      if (type === "direct") {
        setDirectUnread(prev => {
          const next = new Map(prev);
          count <= 0 ? next.delete(id) : next.set(id, count);
          return next;
        });
      } else if (type === "group") {
        setGroupUnread(prev => {
          const next = new Map(prev);
          count <= 0 ? next.delete(id) : next.set(id, count);
          return next;
        });
      }
    };

    // ── Optimistic bump: new incoming DM (text OR attachment) ─────────────────
    const onNewDirect = (msg) => {
      const uid = Number(currentUserIdRef.current);
      // Only bump for the receiver, never for the sender
      if (Number(msg.receiver_id) !== uid) return;
      if (Number(msg.sender_id)   === uid) return;

      const senderId = Number(msg.sender_id);
      if (isNaN(senderId)) return;

      setDirectUnread(prev => {
        const next = new Map(prev);
        next.set(senderId, (next.get(senderId) || 0) + 1);
        return next;
      });
      setTotalUnread(prev => prev + 1);
    };

    // ── Optimistic bump: new incoming group message (text OR attachment) ──────
    const onNewGroup = (msg) => {
      const uid = Number(currentUserIdRef.current);
      // Never bump for the sender
      if (Number(msg.sender_id) === uid) return;

      // Handle all possible field name variants from the backend
      const groupId = Number(
        msg.chat_group_id ?? msg.chatGroupId ?? msg.group_id ?? msg.groupId
      );
      if (!groupId || isNaN(groupId)) return;

      setGroupUnread(prev => {
        const next = new Map(prev);
        next.set(groupId, (next.get(groupId) || 0) + 1);
        return next;
      });
      setTotalUnread(prev => prev + 1);
    };

    // ── Re-request full counts after socket reconnects (fixes refresh bug) ────
    // The server pushes unread_counts immediately on connection inside
    // notification.socket.js, but on a page refresh the listener wasn't
    // registered yet when that push fired. Listening to "connect" ensures
    // we always catch the authoritative snapshot after every (re)connection.
    const onConnect = () => {
      socket.emit("get_unread_counts");
    };

    socket.on("unread_counts",       onUnreadCounts);
    socket.on("unread_count_update", onUnreadCountUpdate);
    socket.on("chat_unread_update",  onChatUnreadUpdate);
    socket.on("new_direct_message",  onNewDirect);
    socket.on("new_group_message",   onNewGroup);
    socket.on("connect",             onConnect);

    // If the socket is already connected when this effect runs (tab switch,
    // fast reconnect, hot reload) request counts immediately.
    if (socket.connected) {
      socket.emit("get_unread_counts");
    }

    return () => {
      socket.off("unread_counts",       onUnreadCounts);
      socket.off("unread_count_update", onUnreadCountUpdate);
      socket.off("chat_unread_update",  onChatUnreadUpdate);
      socket.off("new_direct_message",  onNewDirect);
      socket.off("new_group_message",   onNewGroup);
      socket.off("connect",             onConnect);
    };

  // Depend on the socket instance itself, not .connected.
  // .connected is a boolean that flips repeatedly; depending on it causes
  // the effect to re-run and re-register listeners on every reconnect cycle,
  // which can stack duplicate handlers. socketRef.current changes only when
  // the socket object is replaced (e.g. after a full disconnect/reconnect).
  }, [socketRef?.current, currentUserId]);

  // ── Getters ──────────────────────────────────────────────────────────────────
  const getDirectCount = useCallback(
    (userId)  => directUnread.get(Number(userId))  || 0,
    [directUnread]
  );

  const getGroupCount = useCallback(
    (groupId) => groupUnread.get(Number(groupId)) || 0,
    [groupUnread]
  );

  // ── Mark read helpers ─────────────────────────────────────────────────────────
  // Optimistic clear — server confirms via chat_unread_update shortly after.
  // We calculate the removed amount first so totalUnread stays in sync.

  const markDirectRead = useCallback((senderId) => {
    const socket = socketRef?.current;
    if (!socket || !senderId) return;

    socket.emit("mark_direct_read", { sender_id: Number(senderId) });

    setDirectUnread(prev => {
      const next    = new Map(prev);
      const removed = next.get(Number(senderId)) || 0;
      next.delete(Number(senderId));
      if (removed > 0) setTotalUnread(t => Math.max(0, t - removed));
      return next;
    });
  }, [socketRef]);

  const markGroupRead = useCallback((groupId) => {
    const socket = socketRef?.current;
    if (!socket || !groupId) return;

    socket.emit("mark_group_read", { chat_group_id: Number(groupId) });

    setGroupUnread(prev => {
      const next    = new Map(prev);
      const removed = next.get(Number(groupId)) || 0;
      next.delete(Number(groupId));
      if (removed > 0) setTotalUnread(t => Math.max(0, t - removed));
      return next;
    });
  }, [socketRef]);

  // ── Manual full refresh (e.g. on window focus) ───────────────────────────────
  const refreshCounts = useCallback(() => {
    socketRef?.current?.emit("get_unread_counts");
  }, [socketRef]);

  return {
    totalUnread,
    getDirectCount,
    getGroupCount,
    markDirectRead,
    markGroupRead,
    refreshCounts,
  };
}