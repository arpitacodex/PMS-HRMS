"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchDirectMessages,
  apiSendDirectMessage,
  apiMarkDirectRead,
  apiEditDirectMessage,
  apiDeleteDirectMessage,
  apiToggleDirectReaction,
  apiDeleteAttachment,
  apiToggleAttachmentReaction,
  apiReplyDirectMessage,
} from "@/src/lib/api";
import { getCurrentUserId } from "@/src/lib/auth";
import { isMentionedInMessage } from "@/src/hooks/useMentions";

const TYPING_THROTTLE = 2000;
const PAGE_SIZE       = 50;

function tagMentions(list, currentUserId) {
  if (!currentUserId || !list?.length) return list;
  return list.map((m) => ({
    ...m,
    is_mentioned: isMentionedInMessage(m.message, currentUserId),
  }));
}

function sanitizeList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((m) => {
    if (m.is_deleted || m.deleted_at || m.message_deleted_at) {
      return { ...m, message: null, attachments: [], is_mentioned: false };
    }
    return m;
  });
}

function buildReactionsMap(reactions = []) {
  if (!Array.isArray(reactions)) return {};
  const map = {};
  for (const r of reactions) {
    if (!map[r.emoji]) map[r.emoji] = [];
    map[r.emoji].push({
      user_id:       r.user_id,
      first_name:    r.user?.first_name,
      last_name:     r.user?.last_name,
      profile_photo: r.user?.profile_photo,
    });
  }
  return map;
}

function processMessages(list, currentUserId) {
  const clean  = sanitizeList(list);
  const tagged = tagMentions(clean, currentUserId);
  return tagged.map((m) => ({
    ...m,
    reactions: buildReactionsMap(m.reactions),
  }));
}

export function useDirectChat(selectedUser, socketRef) {
  const [messages, setMessages]               = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [isRemoteTyping, setIsRemoteTyping]   = useState(false);
  const [hasMore, setHasMore]                 = useState(false);
  const [page, setPage]                       = useState(1);

  const lastTypingRef    = useRef(0);
  const typingTimerRef   = useRef(null);
  const partnerId        = selectedUser?.id;
  const partnerIdRef     = useRef(partnerId);
  const currentUserId    = getCurrentUserId();
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => { partnerIdRef.current     = partnerId;     }, [partnerId]);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  // ── Load history (page 1) ─────────────────────────────────────────────────
  useEffect(() => {
    if (!partnerId) {
      setMessages([]);
      setIsRemoteTyping(false);
      setHasMore(false);
      setPage(1);
      return;
    }
    setMessagesLoading(true);
    fetchDirectMessages(partnerId, 1)
      .then((list) => {
        const processed = processMessages(list, currentUserId);
        setMessages(processed);
        setPage(1);
        setHasMore(Array.isArray(list) && list.length === PAGE_SIZE);
        apiMarkDirectRead(partnerId);
        socketRef?.current?.emit("mark_read", { sender_id: partnerId });
      })
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));
  }, [partnerId]);

  // ── Socket events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const onNewMessage = (msg) => {
      const pid = partnerIdRef.current;
      const uid = currentUserIdRef.current;

      const fromPartner =
        Number(msg.sender_id)   === Number(pid) &&
        Number(msg.receiver_id) === Number(uid);

      const fromMe =
        Number(msg.sender_id)   === Number(uid) &&
        Number(msg.receiver_id) === Number(pid);

      if (!fromPartner && !fromMe) return;

      setMessages((prev) => {
        const exists = prev.some(
          (m) => m.id && !m._temp && Number(m.id) === Number(msg.id)
        );
        if (exists) return prev;

        const tagged = {
          ...msg,
          reactions:    buildReactionsMap(msg.reactions),
          is_mentioned: isMentionedInMessage(msg.message, uid),
        };

        const withoutTemp = prev.filter((m) => !m._temp);
        return [...withoutTemp, tagged];
      });

      if (fromPartner) {
        apiMarkDirectRead(pid);
        socket.emit("mark_read", { sender_id: pid });
      }
    };

    const onMessageEdited = ({ message_id, message, is_edited, edited_at }) => {
      const uid = currentUserIdRef.current;
      setMessages((prev) =>
        prev.map((m) =>
          Number(m.id) === Number(message_id)
            ? { ...m, message, is_edited, edited_at,
                is_mentioned: isMentionedInMessage(message, uid) }
            : m
        )
      );
    };

    // ✅ Handles BOTH whole-message delete AND attachment-only delete
    // (backend now emits direct_message_deleted in both cases when allGone + no text)
    const onMessageDeleted = ({ message_id }) => {
      setMessages((prev) =>
        prev.map((m) =>
          Number(m.id) === Number(message_id)
            ? { ...m, message: null, deleted_at: new Date().toISOString(),
                is_deleted: true, attachments: [], is_mentioned: false }
            : m
        )
      );
    };

    const onReactionUpdated = ({ message_id, reactions }) => {
      setMessages((prev) =>
        prev.map((m) =>
          Number(m.id) === Number(message_id) ? { ...m, reactions } : m
        )
      );
    };

    const onTyping = ({ sender_id, isTyping }) => {
      if (Number(sender_id) !== Number(partnerIdRef.current)) return;
      setIsRemoteTyping(isTyping);
      if (isTyping) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(
          () => setIsRemoteTyping(false), 3000
        );
      }
    };

    const onRead = ({ reader_id }) => {
      if (Number(reader_id) !== Number(partnerIdRef.current)) return;
      setMessages((prev) =>
        prev.map((m) =>
          Number(m.sender_id) === Number(currentUserIdRef.current)
            ? { ...m, is_read: true }
            : m
        )
      );
    };

    // ── Partial attachment delete (some attachments still remain) ─────────
    // Only fires when allGone = false
    const onAttachmentDeleted = ({ messageId, attachmentId, allGone }) => {
      if (allGone) return; // handled by onMessageDeleted above
      setMessages((prev) =>
        prev.map((m) => {
          if (Number(m.id) !== Number(messageId)) return m;
          const remaining = (m.attachments || []).filter(
            (a) => Number(a.id) !== Number(attachmentId)
          );
          return { ...m, attachments: remaining };
        })
      );
    };

    socket.on("new_direct_message",      onNewMessage);
    socket.on("direct_message_edited",   onMessageEdited);
    socket.on("direct_message_deleted",  onMessageDeleted);
    socket.on("direct_reaction_updated", onReactionUpdated);
    socket.on("typing",                  onTyping);
    socket.on("messages_read",           onRead);
    socket.on("attachment_deleted",      onAttachmentDeleted);

    return () => {
      socket.off("new_direct_message",      onNewMessage);
      socket.off("direct_message_edited",   onMessageEdited);
      socket.off("direct_message_deleted",  onMessageDeleted);
      socket.off("direct_reaction_updated", onReactionUpdated);
      socket.off("typing",                  onTyping);
      socket.off("messages_read",           onRead);
      socket.off("attachment_deleted",      onAttachmentDeleted);
      clearTimeout(typingTimerRef.current);
    };
  }, [socketRef?.current?.connected]);

  // ── Load more (older messages) ────────────────────────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (!partnerId || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const list = await fetchDirectMessages(partnerId, nextPage);
      if (!Array.isArray(list) || list.length === 0) {
        setHasMore(false);
        return;
      }
      const processed = processMessages(list, currentUserId);
      setMessages((prev) => [...processed, ...prev]);
      setPage(nextPage);
      setHasMore(list.length === PAGE_SIZE);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [partnerId, page, hasMore, loadingMore, currentUserId]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!partnerId || !text.trim()) return;
    const socket = socketRef?.current;

    const optimistic = {
      id:           `temp_${Date.now()}`,
      _temp:        true,
      sender_id:    currentUserId,
      receiver_id:  partnerId,
      message:      text.trim(),
      attachments:  [],
      reactions:    {},
      is_read:      false,
      is_mentioned: false,
      created_at:   new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    if (socket?.connected) {
      socket.emit("send_direct_message", {
        receiver_id: partnerId,
        message:     text.trim(),
      });
    } else {
      try {
        const saved = await apiSendDirectMessage(partnerId, text.trim());
        setMessages((prev) =>
          prev.map((m) =>
            m._temp
              ? { ...saved, _temp: false,
                  reactions:    buildReactionsMap(saved.reactions),
                  is_mentioned: isMentionedInMessage(saved.message, currentUserId) }
              : m
          )
        );
      } catch {
        setMessages((prev) => prev.filter((m) => !m._temp));
      }
    }
  }, [partnerId, currentUserId, socketRef]);

  // ── addMessage ────────────────────────────────────────────────────────────
  const addMessage = useCallback((msg) => {
    if (!msg) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id && Number(m.id) === Number(msg.id))) return prev;
      return [...prev, {
        ...msg,
        reactions:    buildReactionsMap(msg.reactions),
        is_mentioned: isMentionedInMessage(msg.message, currentUserId),
      }];
    });
  }, [currentUserId]);

  // ── Edit ──────────────────────────────────────────────────────────────────
  const editMessage = useCallback(async (messageId, newText) => {
    if (!newText.trim()) return;
    setMessages((prev) =>
      prev.map((m) =>
        Number(m.id) === Number(messageId)
          ? { ...m, message: newText.trim(), is_edited: true,
              is_mentioned: isMentionedInMessage(newText.trim(), currentUserId) }
          : m
      )
    );
    try {
      const data    = await apiEditDirectMessage(messageId, newText.trim());
      const updated = data?.data ?? data;
      setMessages((prev) =>
        prev.map((m) =>
          Number(m.id) === Number(messageId)
            ? { ...m, ...updated,
                is_mentioned: isMentionedInMessage(updated.message, currentUserId) }
            : m
        )
      );
    } catch (err) {
      fetchDirectMessages(partnerId, 1)
        .then((list) => { if (Array.isArray(list)) setMessages(processMessages(list, currentUserId)); })
        .catch(() => {});
      throw err;
    }
  }, [partnerId, currentUserId]);

  // ── Delete whole message ──────────────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId) => {
    setMessages((prev) =>
      prev.map((m) =>
        Number(m.id) === Number(messageId)
          ? { ...m, message: null, deleted_at: new Date().toISOString(),
              is_deleted: true, attachments: [], is_mentioned: false }
          : m
      )
    );
    try {
      await apiDeleteDirectMessage(messageId);
    } catch (err) {
      fetchDirectMessages(partnerId, 1)
        .then((list) => { if (Array.isArray(list)) setMessages(processMessages(list, currentUserId)); })
        .catch(() => {});
      throw err;
    }
  }, [partnerId, currentUserId]);

  // ── Delete single attachment ──────────────────────────────────────────────
  const deleteAttachment = useCallback(async (messageId, attachmentId) => {

    // Optimistic update for sender's own UI
    setMessages((prev) =>
      prev.map((m) => {
        if (Number(m.id) !== Number(messageId)) return m;

        const remaining = (m.attachments || []).filter(
          (a) => Number(a.id) !== Number(attachmentId)
        );
        const hasText = !!(m.message && m.message.trim());

        // ✅ If this was the last attachment AND no text, show deleted state
        if (remaining.length === 0 && !hasText) {
          return {
            ...m,
            attachments:  [],
            is_deleted:   true,
            deleted_at:   new Date().toISOString(),
            is_mentioned: false,
          };
        }

        return { ...m, attachments: remaining };
      })
    );

    try {
      await apiDeleteAttachment(attachmentId);
      // Backend emits direct_message_deleted (allGone+no text) or
      // attachment_deleted (partial) — both handled by socket listeners above
    } catch (err) {
      console.error("Delete attachment failed:", err);
      fetchDirectMessages(partnerId, 1)
        .then((list) => { if (Array.isArray(list)) setMessages(processMessages(list, currentUserId)); })
        .catch(() => {});
    }
  }, [partnerId, currentUserId]);

  // ── React to whole message ────────────────────────────────────────────────
  const reactToMessage = useCallback(async (messageId, emoji) => {
    try {
      const { reactions } = await apiToggleDirectReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((m) =>
          Number(m.id) === Number(messageId) ? { ...m, reactions } : m
        )
      );
    } catch (err) {
      console.error("React failed:", err);
    }
  }, []);

  // ── React to single attachment ────────────────────────────────────────────
  const reactToAttachment = useCallback(async (messageId, attachmentId, emoji) => {
    try {
      await apiToggleAttachmentReaction(attachmentId, emoji);
    } catch (err) {
      console.error("Attachment react failed:", err);
    }
  }, []);

  // ── Reply to a message ────────────────────────────────────────────────────
  const replyToMessage = useCallback(async (replyToId, text) => {
    if (!partnerId || !text.trim()) return;

    const optimistic = {
      id:           `temp_${Date.now()}`,
      _temp:        true,
      sender_id:    currentUserId,
      receiver_id:  partnerId,
      message:      text.trim(),
      reply_to_id:  replyToId,
      attachments:  [],
      reactions:    {},
      is_read:      false,
      is_mentioned: false,
      created_at:   new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const saved = await apiReplyDirectMessage(replyToId, partnerId, text.trim());
      setMessages((prev) =>
        prev.map((m) =>
          m._temp
            ? { ...saved, _temp: false,
                reactions:    buildReactionsMap(saved.reactions),
                is_mentioned: isMentionedInMessage(saved.message, currentUserId) }
            : m
        )
      );
    } catch {
      setMessages((prev) => prev.filter((m) => !m._temp));
    }
  }, [partnerId, currentUserId]);

  // ── Typing ────────────────────────────────────────────────────────────────
  const emitTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingRef.current < TYPING_THROTTLE) return;
    lastTypingRef.current = now;
    socketRef?.current?.emit("typing_start", { receiver_id: partnerId });
  }, [partnerId, socketRef]);

  return {
    messages,
    messagesLoading,
    loadingMore,
    isRemoteTyping,
    hasMore,
    sendMessage,
    addMessage,
    editMessage,
    deleteMessage,
    deleteAttachment,
    reactToAttachment,
    reactToMessage,
    replyToMessage,
    emitTyping,
    loadMoreMessages,
  };
}