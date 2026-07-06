// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import {
//     fetchGroupMessages,
//     apiSendGroupMessage,
//     apiMarkGroupRead,
//     apiEditGroupMessage,
//     apiDeleteGroupMessage,
//     apiToggleGroupReaction,
//     apiDeleteAttachment,
//     apiToggleAttachmentReaction,
//     apiReplyGroupMessage,
// } from "@/src/lib/api";
// import { getCurrentUserId } from "@/src/lib/auth";
// import { isMentionedInMessage } from "@/src/hooks/useMentions";

// const TYPING_THROTTLE = 2000;
// const PAGE_SIZE       = 50;

// // ── Deleted-message ID persistence ───────────────────────────────────────────
// const DELETED_KEY = "chat_deleted_msg_ids";

// function getDeletedIds() {
//     try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || "[]")); }
//     catch { return new Set(); }
// }

// function persistDeletedId(messageId) {
//     try {
//         const ids = getDeletedIds();
//         ids.add(String(messageId));
//         localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
//     } catch {}
// }

// function patchDeletedMessages(list) {
//     const deletedIds = getDeletedIds();
//     if (!deletedIds.size) return list;
//     return list.map((m) =>
//         deletedIds.has(String(m.id))
//             ? { ...m, message: null, deleted_at: m.deleted_at || new Date().toISOString(), is_deleted: true, attachments: [] }
//             : m
//     );
// }

// function buildReactionsMap(reactions = []) {
//     if (!Array.isArray(reactions)) return {};
//     const map = {};
//     for (const r of reactions) {
//         if (!map[r.emoji]) map[r.emoji] = [];
//         map[r.emoji].push({
//             user_id:       r.user_id,
//             first_name:    r.user?.first_name,
//             last_name:     r.user?.last_name,
//             profile_photo: r.user?.profile_photo,
//         });
//     }
//     return map;
// }

// function tagMentions(list, currentUserId) {
//     if (!currentUserId || !list?.length) return list;
//     return list.map((m) => ({
//         ...m,
//         is_mentioned: isMentionedInMessage(m.message, currentUserId),
//     }));
// }

// function processMessages(list, currentUserId) {
//     const patched = patchDeletedMessages(Array.isArray(list) ? list : []);
//     const tagged  = tagMentions(patched, currentUserId);
//     return tagged.map((m) => ({
//         ...m,
//         reactions: buildReactionsMap(m.reactions),
//     }));
// }

// export function useGroupChat(selectedGroup, socketRef) {
//     const [messages, setMessages]               = useState([]);
//     const [messagesLoading, setMessagesLoading] = useState(false);
//     const [loadingMore, setLoadingMore]         = useState(false);
//     const [typingUsers, setTypingUsers]         = useState([]);
//     const [hasMore, setHasMore]                 = useState(false);
//     const [page, setPage]                       = useState(1);

//     const lastTypingRef  = useRef(0);
//     const currentGroupId = selectedGroup?.id;
//     const currentUserId  = getCurrentUserId();

//     // ── Load history (page 1) ─────────────────────────────────────────────────
//     useEffect(() => {
//         if (!currentGroupId) {
//             setMessages([]);
//             setTypingUsers([]);
//             setHasMore(false);
//             setPage(1);
//             return;
//         }
//         setMessagesLoading(true);
//         fetchGroupMessages(currentGroupId, 1)
//             .then((list) => {
//                 const processed = processMessages(list, currentUserId);
//                 setMessages(processed);
//                 setPage(1);
//                 setHasMore(Array.isArray(list) && list.length === PAGE_SIZE);
//                 apiMarkGroupRead(currentGroupId);
//             })
//             .catch(() => setMessages([]))
//             .finally(() => setMessagesLoading(false));
//     }, [currentGroupId, currentUserId]);

//     // ── Socket events ─────────────────────────────────────────────────────────
//     useEffect(() => {
//         const socket = socketRef?.current;
//         if (!socket || !currentGroupId) return;

//         socket.emit("join_group", { chatGroupId: currentGroupId });

//         const onNewMessage = (msg) => {
//             if (Number(msg.chat_group_id) !== Number(currentGroupId)) return;

//             setMessages((prev) => {
//                 const exists = prev.some(
//                     (m) => m.id && !m._temp && Number(m.id) === Number(msg.id)
//                 );
//                 if (exists) return prev;

//                 const tagged = {
//                     ...msg,
//                     reactions:    buildReactionsMap(msg.reactions),
//                     is_mentioned: isMentionedInMessage(msg.message, currentUserId),
//                 };
//                 return [...prev.filter((m) => !m._temp), tagged];
//             });

//             apiMarkGroupRead(currentGroupId);
//             socket.emit("group_message_read", { chat_group_id: currentGroupId });
//         };

//         const onMessageEdited = ({ message_id, message, is_edited, edited_at }) => {
//             setMessages((prev) =>
//                 prev.map((m) =>
//                     Number(m.id) === Number(message_id)
//                         ? { ...m, message, is_edited, edited_at,
//                             is_mentioned: isMentionedInMessage(message, currentUserId) }
//                         : m
//                 )
//             );
//         };

//         // ✅ This fires for BOTH whole-message delete AND attachment-only delete
//         // (backend now emits group_message_deleted in both cases when allGone + no text)
//         const onMessageDeleted = ({ message_id }) => {
//             persistDeletedId(message_id);
//             setMessages((prev) =>
//                 prev.map((m) =>
//                     Number(m.id) === Number(message_id)
//                         ? {
//                             ...m,
//                             message:     null,
//                             deleted_at:  new Date().toISOString(),
//                             is_deleted:  true,
//                             attachments: [],
//                             is_mentioned: false,
//                           }
//                         : m
//                 )
//             );
//         };

//         const onReactionUpdated = ({ message_id, reactions }) => {
//             setMessages((prev) =>
//                 prev.map((m) =>
//                     Number(m.id) === Number(message_id) ? { ...m, reactions } : m
//                 )
//             );
//         };

//         const onTyping = ({ chat_group_id, sender_id, isTyping }) => {
//             if (Number(chat_group_id) !== Number(currentGroupId)) return;
//             if (Number(sender_id) === Number(currentUserId)) return;
//             if (isTyping) {
//                 setTypingUsers((prev) =>
//                     prev.includes(sender_id) ? prev : [...prev, sender_id]
//                 );
//                 setTimeout(
//                     () => setTypingUsers((prev) => prev.filter((id) => id !== sender_id)),
//                     3000
//                 );
//             } else {
//                 setTypingUsers((prev) => prev.filter((id) => id !== sender_id));
//             }
//         };

//         // ── Partial attachment delete (some attachments still remain) ─────────
//         // Only fires when allGone = false (backend sends this when text or
//         // other attachments still exist on the message)
//         const onAttachmentDeleted = ({ messageId, attachmentId, allGone }) => {
//             if (allGone) return; // handled by onMessageDeleted above
//             setMessages((prev) =>
//                 prev.map((m) => {
//                     if (Number(m.id) !== Number(messageId)) return m;
//                     const remaining = (m.attachments || []).filter(
//                         (a) => Number(a.id) !== Number(attachmentId)
//                     );
//                     return { ...m, attachments: remaining };
//                 })
//             );
//         };

//         socket.on("new_group_message",      onNewMessage);
//         socket.on("group_message_edited",   onMessageEdited);
//         socket.on("group_message_deleted",  onMessageDeleted);
//         socket.on("group_reaction_updated", onReactionUpdated);
//         socket.on("group_typing",           onTyping);
//         socket.on("attachment_deleted",     onAttachmentDeleted);

//         return () => {
//             socket.off("new_group_message",      onNewMessage);
//             socket.off("group_message_edited",   onMessageEdited);
//             socket.off("group_message_deleted",  onMessageDeleted);
//             socket.off("group_reaction_updated", onReactionUpdated);
//             socket.off("group_typing",           onTyping);
//             socket.off("attachment_deleted",     onAttachmentDeleted);
//             socket.emit("leave_group", { chatGroupId: currentGroupId });
//         };
//     }, [currentGroupId, socketRef?.current?.connected, currentUserId]);

//     // ── Load more (older messages) ────────────────────────────────────────────
//     const loadMoreMessages = useCallback(async () => {
//         if (!currentGroupId || loadingMore || !hasMore) return;
//         const nextPage = page + 1;
//         setLoadingMore(true);
//         try {
//             const list = await fetchGroupMessages(currentGroupId, nextPage);
//             if (!Array.isArray(list) || list.length === 0) {
//                 setHasMore(false);
//                 return;
//             }
//             const processed = processMessages(list, currentUserId);
//             setMessages((prev) => [...processed, ...prev]);
//             setPage(nextPage);
//             setHasMore(list.length === PAGE_SIZE);
//         } catch (err) {
//             console.error("Load more error:", err);
//         } finally {
//             setLoadingMore(false);
//         }
//     }, [currentGroupId, page, hasMore, loadingMore, currentUserId]);

//     // ── Send ──────────────────────────────────────────────────────────────────
//     const sendMessage = useCallback(async (text) => {
//         if (!currentGroupId || !text.trim()) return;

//         const socket = socketRef?.current;
//         const optimistic = {
//             id:            `temp_${Date.now()}`,
//             _temp:         true,
//             chat_group_id: currentGroupId,
//             sender_id:     currentUserId,
//             message:       text.trim(),
//             attachments:   [],
//             reactions:     {},
//             is_mentioned:  false,
//             created_at:    new Date().toISOString(),
//         };
//         setMessages((prev) => [...prev, optimistic]);

//         if (socket?.connected) {
//             socket.emit("send_group_message", {
//                 chat_group_id: currentGroupId,
//                 message:       text.trim(),
//             });
//         } else {
//             try {
//                 const saved = await apiSendGroupMessage(currentGroupId, text.trim());
//                 setMessages((prev) =>
//                     prev.map((m) =>
//                         m._temp
//                             ? { ...saved, _temp: false,
//                                 reactions:    buildReactionsMap(saved.reactions),
//                                 is_mentioned: isMentionedInMessage(saved.message, currentUserId) }
//                             : m
//                     )
//                 );
//             } catch {
//                 setMessages((prev) => prev.filter((m) => !m._temp));
//             }
//         }
//     }, [currentGroupId, currentUserId, socketRef]);

//     // ── addMessage ────────────────────────────────────────────────────────────
//     const addMessage = useCallback((msg) => {
//         if (!msg) return;
//         setMessages((prev) => {
//             if (prev.some((m) => m.id && m.id === msg.id)) return prev;
//             return [...prev.filter((m) => !m._temp), {
//                 ...msg,
//                 reactions:    buildReactionsMap(msg.reactions),
//                 is_mentioned: isMentionedInMessage(msg.message, currentUserId),
//             }];
//         });
//     }, [currentUserId]);

//     // ── Edit ──────────────────────────────────────────────────────────────────
//     const editMessage = useCallback(async (messageId, newText) => {
//         if (!newText.trim()) return;
//         setMessages((prev) =>
//             prev.map((m) =>
//                 Number(m.id) === Number(messageId)
//                     ? { ...m, message: newText.trim(), is_edited: true,
//                         is_mentioned: isMentionedInMessage(newText.trim(), currentUserId) }
//                     : m
//             )
//         );
//         try {
//             const data    = await apiEditGroupMessage(messageId, newText.trim());
//             const updated = data?.data ?? data;
//             setMessages((prev) =>
//                 prev.map((m) =>
//                     Number(m.id) === Number(messageId)
//                         ? { ...m, ...updated,
//                             is_mentioned: isMentionedInMessage(updated.message, currentUserId) }
//                         : m
//                 )
//             );
//         } catch (err) {
//             fetchGroupMessages(currentGroupId, 1)
//                 .then((list) => { if (Array.isArray(list)) setMessages(processMessages(list, currentUserId)); })
//                 .catch(() => {});
//             throw err;
//         }
//     }, [currentGroupId, currentUserId]);

//     // ── Delete whole message ──────────────────────────────────────────────────
//     const deleteMessage = useCallback(async (messageId) => {
//         persistDeletedId(messageId);
//         setMessages((prev) =>
//             prev.map((m) =>
//                 Number(m.id) === Number(messageId)
//                     ? { ...m, message: null, deleted_at: new Date().toISOString(),
//                         is_deleted: true, attachments: [], is_mentioned: false }
//                     : m
//             )
//         );
//         try {
//             await apiDeleteGroupMessage(messageId);
//         } catch (err) {
//             fetchGroupMessages(currentGroupId, 1)
//                 .then((list) => { if (Array.isArray(list)) setMessages(processMessages(list, currentUserId)); })
//                 .catch(() => {});
//             throw err;
//         }
//     }, [currentGroupId, currentUserId]);

//     // ── Delete single attachment ──────────────────────────────────────────────
//     const deleteAttachment = useCallback(async (messageId, attachmentId) => {

//         // Optimistic update for sender's own UI
//         setMessages((prev) =>
//             prev.map((m) => {
//                 if (Number(m.id) !== Number(messageId)) return m;

//                 const remaining = (m.attachments || []).filter(
//                     (a) => Number(a.id) !== Number(attachmentId)
//                 );
//                 const hasText = !!(m.message && m.message.trim());

//                 // ✅ If this was the last attachment AND no text exists,
//                 //    show "This message was deleted" immediately for sender too
//                 if (remaining.length === 0 && !hasText) {
//                     persistDeletedId(messageId);
//                     return {
//                         ...m,
//                         attachments:  [],
//                         is_deleted:   true,
//                         deleted_at:   new Date().toISOString(),
//                         is_mentioned: false,
//                     };
//                 }

//                 return { ...m, attachments: remaining };
//             })
//         );

//         try {
//             await apiDeleteAttachment(attachmentId);
//             // Backend will emit group_message_deleted (if allGone+no text)
//             // or attachment_deleted (if partial) — both handled by socket listeners above
//         } catch (err) {
//             console.error("Delete attachment failed:", err);
//             // Rollback by reloading
//             fetchGroupMessages(currentGroupId, 1)
//                 .then((list) => { if (Array.isArray(list)) setMessages(processMessages(list, currentUserId)); })
//                 .catch(() => {});
//         }
//     }, [currentGroupId, currentUserId]);

//     // ── React to whole message ────────────────────────────────────────────────
//     const reactToMessage = useCallback(async (messageId, emoji) => {
//         try {
//             const { reactions } = await apiToggleGroupReaction(messageId, emoji);
//             setMessages((prev) =>
//                 prev.map((m) =>
//                     Number(m.id) === Number(messageId) ? { ...m, reactions } : m
//                 )
//             );
//         } catch (err) {
//             console.error("React failed:", err);
//         }
//     }, []);

//     // ── React to single attachment ────────────────────────────────────────────
//     const reactToAttachment = useCallback(async (messageId, attachmentId, emoji) => {
//         try {
//             await apiToggleAttachmentReaction(attachmentId, emoji);
//         } catch (err) {
//             console.error("Attachment react failed:", err);
//         }
//     }, []);

//     // ── Reply to a group message ──────────────────────────────────────────────
//     const replyToMessage = useCallback(async (replyToId, text) => {
//         if (!currentGroupId || !text.trim()) return;

//         const optimistic = {
//             id:            `temp_${Date.now()}`,
//             _temp:         true,
//             chat_group_id: currentGroupId,
//             sender_id:     currentUserId,
//             message:       text.trim(),
//             reply_to_id:   replyToId,
//             attachments:   [],
//             reactions:     {},
//             is_mentioned:  false,
//             created_at:    new Date().toISOString(),
//         };
//         setMessages((prev) => [...prev, optimistic]);

//         try {
//             const saved = await apiReplyGroupMessage(currentGroupId, replyToId, text.trim());
//             setMessages((prev) =>
//                 prev.map((m) =>
//                     m._temp
//                         ? { ...saved, _temp: false,
//                             reactions:    buildReactionsMap(saved.reactions),
//                             is_mentioned: isMentionedInMessage(saved.message, currentUserId) }
//                         : m
//                 )
//             );
//         } catch {
//             setMessages((prev) => prev.filter((m) => !m._temp));
//         }
//     }, [currentGroupId, currentUserId]);

//     // ── Typing ────────────────────────────────────────────────────────────────
//     const emitTyping = useCallback(() => {
//         const now = Date.now();
//         if (now - lastTypingRef.current < TYPING_THROTTLE) return;
//         lastTypingRef.current = now;
//         socketRef?.current?.emit("group_typing_start", { chat_group_id: currentGroupId });
//     }, [currentGroupId, socketRef]);

//     return {
//         messages,
//         messagesLoading,
//         loadingMore,
//         typingUsers,
//         hasMore,
//         sendMessage,
//         addMessage,
//         editMessage,
//         deleteMessage,
//         deleteAttachment,
//         reactToMessage,
//         reactToAttachment,
//         replyToMessage,
//         emitTyping,
//         loadMoreMessages,
//     };
// }



"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    fetchGroupMessages,
    apiSendGroupMessage,
    apiMarkGroupRead,
    apiEditGroupMessage,
    apiDeleteGroupMessage,
    apiToggleGroupReaction,
    apiDeleteAttachment,
    apiToggleAttachmentReaction,
    apiReplyGroupMessage,
} from "@/src/lib/api";
import { getCurrentUserId } from "@/src/lib/auth";
import { isMentionedInMessage } from "@/src/hooks/useMentions";

const TYPING_THROTTLE = 2000;
const PAGE_SIZE       = 50;

// ── Deleted-message ID persistence ───────────────────────────────────────────
const DELETED_KEY = "chat_deleted_msg_ids";

function getDeletedIds() {
    try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || "[]")); }
    catch { return new Set(); }
}

function persistDeletedId(messageId) {
    try {
        const ids = getDeletedIds();
        ids.add(String(messageId));
        localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
    } catch {}
}

function patchDeletedMessages(list) {
    const deletedIds = getDeletedIds();
    if (!deletedIds.size) return list;
    return list.map((m) =>
        deletedIds.has(String(m.id))
            ? { ...m, message: null, deleted_at: m.deleted_at || new Date().toISOString(), is_deleted: true, attachments: [] }
            : m
    );
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

function tagMentions(list, currentUserId) {
    if (!currentUserId || !list?.length) return list;
    return list.map((m) => ({
        ...m,
        is_mentioned: isMentionedInMessage(m.message, currentUserId),
    }));
}

function processMessages(list, currentUserId) {
    const patched = patchDeletedMessages(Array.isArray(list) ? list : []);
    const tagged  = tagMentions(patched, currentUserId);
    return tagged.map((m) => ({
        ...m,
        reactions: buildReactionsMap(m.reactions),
    }));
}

export function useGroupChat(selectedGroup, socketRef) {
    const [messages, setMessages]               = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [loadingMore, setLoadingMore]         = useState(false);
    const [typingUsers, setTypingUsers]         = useState([]);
    const [hasMore, setHasMore]                 = useState(false);
    const [page, setPage]                       = useState(1);

    const lastTypingRef  = useRef(0);
    const currentGroupId = selectedGroup?.id;
    const currentUserId  = getCurrentUserId();

    // ── Load history (page 1) ─────────────────────────────────────────────────
    useEffect(() => {
        if (!currentGroupId) {
            setMessages([]);
            setTypingUsers([]);
            setHasMore(false);
            setPage(1);
            return;
        }
        setMessagesLoading(true);
        fetchGroupMessages(currentGroupId, 1)
            .then((list) => {
                const processed = processMessages(list, currentUserId);
                setMessages(processed);
                setPage(1);
                setHasMore(Array.isArray(list) && list.length === PAGE_SIZE);
                apiMarkGroupRead(currentGroupId);
            })
            .catch(() => setMessages([]))
            .finally(() => setMessagesLoading(false));
    }, [currentGroupId, currentUserId]);

    // ── Socket events ─────────────────────────────────────────────────────────
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket || !currentGroupId) return;

        socket.emit("join_group", { chatGroupId: currentGroupId });

        const onNewMessage = (msg) => {
            if (Number(msg.chat_group_id) !== Number(currentGroupId)) return;

            setMessages((prev) => {
                const exists = prev.some(
                    (m) => m.id && !m._temp && Number(m.id) === Number(msg.id)
                );
                if (exists) return prev;

                const tagged = {
                    ...msg,
                    reactions:    buildReactionsMap(msg.reactions),
                    is_mentioned: isMentionedInMessage(msg.message, currentUserId),
                };
                return [...prev.filter((m) => !m._temp), tagged];
            });

            apiMarkGroupRead(currentGroupId);
            socket.emit("group_message_read", { chat_group_id: currentGroupId });
        };

        const onMessageEdited = ({ message_id, message, is_edited, edited_at }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    Number(m.id) === Number(message_id)
                        ? { ...m, message, is_edited, edited_at,
                            is_mentioned: isMentionedInMessage(message, currentUserId) }
                        : m
                )
            );
        };

        const onMessageDeleted = ({ message_id }) => {
            persistDeletedId(message_id);
            setMessages((prev) =>
                prev.map((m) =>
                    Number(m.id) === Number(message_id)
                        ? {
                            ...m,
                            message:     null,
                            deleted_at:  new Date().toISOString(),
                            is_deleted:  true,
                            attachments: [],
                            is_mentioned: false,
                          }
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

        const onTyping = ({ chat_group_id, sender_id, isTyping }) => {
            if (Number(chat_group_id) !== Number(currentGroupId)) return;
            if (Number(sender_id) === Number(currentUserId)) return;
            if (isTyping) {
                setTypingUsers((prev) =>
                    prev.includes(sender_id) ? prev : [...prev, sender_id]
                );
                setTimeout(
                    () => setTypingUsers((prev) => prev.filter((id) => id !== sender_id)),
                    3000
                );
            } else {
                setTypingUsers((prev) => prev.filter((id) => id !== sender_id));
            }
        };

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

        // FIX: Handle group_deleted — clear messages when the open group is deleted
        const onGroupDeleted = ({ chat_group_id }) => {
            if (Number(chat_group_id) !== Number(currentGroupId)) return;
            setMessages([]);
            setTypingUsers([]);
            setHasMore(false);
        };

        socket.on("new_group_message",      onNewMessage);
        socket.on("group_message_edited",   onMessageEdited);
        socket.on("group_message_deleted",  onMessageDeleted);
        socket.on("group_reaction_updated", onReactionUpdated);
        socket.on("group_typing",           onTyping);
        socket.on("attachment_deleted",     onAttachmentDeleted);
        socket.on("group_deleted",          onGroupDeleted);

        return () => {
            socket.off("new_group_message",      onNewMessage);
            socket.off("group_message_edited",   onMessageEdited);
            socket.off("group_message_deleted",  onMessageDeleted);
            socket.off("group_reaction_updated", onReactionUpdated);
            socket.off("group_typing",           onTyping);
            socket.off("attachment_deleted",     onAttachmentDeleted);
            socket.off("group_deleted",          onGroupDeleted);
            socket.emit("leave_group", { chatGroupId: currentGroupId });
        };
    }, [currentGroupId, socketRef?.current?.connected, currentUserId]);

    // ── Load more (older messages) ────────────────────────────────────────────
    const loadMoreMessages = useCallback(async () => {
        if (!currentGroupId || loadingMore || !hasMore) return;
        const nextPage = page + 1;
        setLoadingMore(true);
        try {
            const list = await fetchGroupMessages(currentGroupId, nextPage);
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
    }, [currentGroupId, page, hasMore, loadingMore, currentUserId]);

    // ── Send ──────────────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text) => {
        if (!currentGroupId || !text.trim()) return;

        const socket = socketRef?.current;
        const optimistic = {
            id:            `temp_${Date.now()}`,
            _temp:         true,
            chat_group_id: currentGroupId,
            sender_id:     currentUserId,
            message:       text.trim(),
            attachments:   [],
            reactions:     {},
            is_mentioned:  false,
            created_at:    new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);

        if (socket?.connected) {
            socket.emit("send_group_message", {
                chat_group_id: currentGroupId,
                message:       text.trim(),
            });
        } else {
            try {
                const saved = await apiSendGroupMessage(currentGroupId, text.trim());
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
    }, [currentGroupId, currentUserId, socketRef]);

    // ── addMessage ────────────────────────────────────────────────────────────
    const addMessage = useCallback((msg) => {
        if (!msg) return;
        setMessages((prev) => {
            if (prev.some((m) => m.id && m.id === msg.id)) return prev;
            return [...prev.filter((m) => !m._temp), {
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
            const data    = await apiEditGroupMessage(messageId, newText.trim());
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
            fetchGroupMessages(currentGroupId, 1)
                .then((list) => { if (Array.isArray(list)) setMessages(processMessages(list, currentUserId)); })
                .catch(() => {});
            throw err;
        }
    }, [currentGroupId, currentUserId]);

    // ── Delete whole message ──────────────────────────────────────────────────
    const deleteMessage = useCallback(async (messageId) => {
        persistDeletedId(messageId);
        setMessages((prev) =>
            prev.map((m) =>
                Number(m.id) === Number(messageId)
                    ? { ...m, message: null, deleted_at: new Date().toISOString(),
                        is_deleted: true, attachments: [], is_mentioned: false }
                    : m
            )
        );
        try {
            await apiDeleteGroupMessage(messageId);
        } catch (err) {
            fetchGroupMessages(currentGroupId, 1)
                .then((list) => { if (Array.isArray(list)) setMessages(processMessages(list, currentUserId)); })
                .catch(() => {});
            throw err;
        }
    }, [currentGroupId, currentUserId]);

    // ── Delete single attachment ──────────────────────────────────────────────
    const deleteAttachment = useCallback(async (messageId, attachmentId) => {
        setMessages((prev) =>
            prev.map((m) => {
                if (Number(m.id) !== Number(messageId)) return m;

                const remaining = (m.attachments || []).filter(
                    (a) => Number(a.id) !== Number(attachmentId)
                );
                const hasText = !!(m.message && m.message.trim());

                if (remaining.length === 0 && !hasText) {
                    persistDeletedId(messageId);
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
        } catch (err) {
            console.error("Delete attachment failed:", err);
            fetchGroupMessages(currentGroupId, 1)
                .then((list) => { if (Array.isArray(list)) setMessages(processMessages(list, currentUserId)); })
                .catch(() => {});
        }
    }, [currentGroupId, currentUserId]);

    // ── React to whole message ────────────────────────────────────────────────
    const reactToMessage = useCallback(async (messageId, emoji) => {
        try {
            const { reactions } = await apiToggleGroupReaction(messageId, emoji);
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

    // ── Reply to a group message ──────────────────────────────────────────────
    const replyToMessage = useCallback(async (replyToId, text) => {
        if (!currentGroupId || !text.trim()) return;

        const optimistic = {
            id:            `temp_${Date.now()}`,
            _temp:         true,
            chat_group_id: currentGroupId,
            sender_id:     currentUserId,
            message:       text.trim(),
            reply_to_id:   replyToId,
            attachments:   [],
            reactions:     {},
            is_mentioned:  false,
            created_at:    new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);

        try {
            const saved = await apiReplyGroupMessage(currentGroupId, replyToId, text.trim());
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
    }, [currentGroupId, currentUserId]);

    // ── Typing ────────────────────────────────────────────────────────────────
    const emitTyping = useCallback(() => {
        const now = Date.now();
        if (now - lastTypingRef.current < TYPING_THROTTLE) return;
        lastTypingRef.current = now;
        socketRef?.current?.emit("group_typing_start", { chat_group_id: currentGroupId });
    }, [currentGroupId, socketRef]);

    return {
        messages,
        messagesLoading,
        loadingMore,
        typingUsers,
        hasMore,
        sendMessage,
        addMessage,
        editMessage,
        deleteMessage,
        deleteAttachment,
        reactToMessage,
        reactToAttachment,
        replyToMessage,
        emitTyping,
        loadMoreMessages,
    };
}