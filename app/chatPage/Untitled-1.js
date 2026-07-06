"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Search, ArrowLeft, Plus, Users,
  Edit2, Trash2, UserPlus, MessageSquare, Loader2, RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useReactions } from "@/src/components/chat/EmojiPicker";
import { EmojiPickerButton } from "@/src/components/chat/EmojiPicker";

import { useSocket }       from "@/src/hooks/useSocket";
import { useGroups }       from "@/src/hooks/useGroups";
import { useGroupChat }    from "@/src/hooks/useGroupChat";
import { useDirectChat }   from "@/src/hooks/useDirectChat";
import { useAttachments }  from "@/src/hooks/useAttachments";
import { useMentions }     from "@/src/hooks/useMentions";
import { useUnreadCount }  from "@/src/hooks/useUnreadCount";

import MentionNotificationBell from "@/src/components/chat/MentionNotificationBell";
import { UnreadBadge }         from "@/src/components/chat/UnreadBadge";
import { ReplyPreview }        from "@/src/components/chat/ReplyPreview";

import { fetchAllUsers, fetchGroupMembers } from "@/src/lib/api";
import { getCurrentUserId } from "@/src/lib/auth";

import {
  Avatar, Toast, ConnectionBanner,
  TypingIndicator, MessageList,
} from "@/src/components/chat/ui";
import {
  CreateGroupModal, RenameGroupModal, DeleteGroupModal,
  AddMemberModal, MembersModal,
} from "@/src/components/chat/GroupModals";
import { AttachmentButton, AttachmentPreview } from "@/src/components/chat/AttachmentUI";
import MentionInput from "@/src/components/chat/MentionInput";

const TAB = { GROUPS: "groups", DIRECT: "direct" };

export default function ChatPage() {
  const { socketRef, connected, onlineUsers, connectionError } = useSocket();

  const {
    groups, groupsLoading,
    deletedGroupId,                                              // ← group_deleted socket signal
    createGroup, updateGroupName, deleteGroup, addMember, removeMember, makeAdmin,
  } = useGroups();

  const {
    pendingFiles, uploading, uploadError,
    addFiles, removeFile, clearFiles, sendDirect, sendGroup, hasPending,
  } = useAttachments();

  const {
    notifications: mentionNotifications,
    unreadCount:   mentionUnread,
    markAllRead:   markMentionsRead,
    markOneRead:   markMentionRead,
  } = useMentions(socketRef);

  const {
    totalUnread,
    getDirectCount,
    getGroupCount,
    markDirectRead,
    markGroupRead,
  } = useUnreadCount(socketRef);

  // ========== STATE ==========
  const [allUsers,          setAllUsers]          = useState([]);
  const [usersLoading,      setUsersLoading]      = useState(true);
  const [membersMap,        setMembersMap]        = useState(new Map());
  const [membersLoading,    setMembersLoading]    = useState(false);
  const [activeTab,         setActiveTab]         = useState(TAB.GROUPS);
  const [selectedGroup,     setSelectedGroup]     = useState(null);
  const [selectedUser,      setSelectedUser]      = useState(null);
  const [showSidebar,       setShowSidebar]       = useState(true);
  const [showScrollButton,  setShowScrollButton]  = useState(false);
  const [unreadScrollCount, setUnreadScrollCount] = useState(0);
  const [inputMsg,          setInputMsg]          = useState("");
  const [search,            setSearch]            = useState("");
  const [toast,             setToast]             = useState(null);
  const [modal,             setModal]             = useState(null);
  const [actionLoading,     setActionLoading]     = useState(false);
  const [replyingTo,        setReplyingTo]        = useState(null);

  // ========== REFS ==========
  const msgEndRef     = useRef(null);
  const scrollAreaRef = useRef(null);
  const inputRef      = useRef(null);
  const currentUserId = getCurrentUserId();

  const { toggleReaction, getReactions, clearMessageReactions } = useReactions(currentUserId);

  // ========== CHAT HOOKS ==========
  const {
    messages: groupMessages, messagesLoading: groupLoading,
    sendMessage: sendGroupMsg, emitTyping: emitGroupTyping,
    typingUsers: groupTypingIds, loadMoreMessages: loadMoreGroup, hasMore: groupHasMore,
    addMessage: addGroupMessage, editMessage: editGroupMessage, deleteMessage: deleteGroupMessage,
    reactToMessage: reactToGroupMessage,
    deleteAttachment: deleteGroupAttachment,
    reactToAttachment: reactToGroupAttachment,
    replyToMessage: replyToGroupMessage,
  } = useGroupChat(selectedGroup, socketRef);

  const {
    messages: directMessages, messagesLoading: directLoading,
    sendMessage: sendDirectMsg, emitTyping: emitDirectTyping,
    isRemoteTyping: partnerTyping, loadMoreMessages: loadMoreDirect, hasMore: directHasMore,
    addMessage: addDirectMessage, editMessage: editDirectMessage, deleteMessage: deleteDirectMessage,
    reactToMessage: reactToDirectMessage,
    deleteAttachment: deleteDirectAttachment,
    reactToAttachment: reactToDirectAttachment,
    replyToMessage: replyToDirectMessage,
  } = useDirectChat(selectedUser, socketRef);

  // ========== COMPUTED ==========
  const isGroupTab = activeTab === TAB.GROUPS;
  const messages   = isGroupTab ? groupMessages : directMessages;
  const msgLoading = isGroupTab ? groupLoading  : directLoading;
  const hasMore    = isGroupTab ? groupHasMore  : directHasMore;
  const loadMore   = isGroupTab ? loadMoreGroup : loadMoreDirect;

  const handleReact = useCallback((messageId, emoji) => {
    if (isGroupTab) reactToGroupMessage(messageId, emoji);
    else            reactToDirectMessage(messageId, emoji);
  }, [isGroupTab, reactToGroupMessage, reactToDirectMessage]);

  const chatTitle = isGroupTab
    ? (selectedGroup?.group_name ?? "")
    : selectedUser
      ? `${selectedUser.first_name} ${selectedUser.last_name ?? ""}`.trim()
      : "";

  const currentMembers   = membersMap.get(selectedGroup?.id) ?? [];
  const groupMemberUsers = allUsers.filter(u =>
    currentMembers.some(m => Number(m.user_id) === Number(u.id))
  );
  const nonMemberUsers = allUsers.filter(u =>
    Number(u.id) !== Number(currentUserId) &&
    !currentMembers.some(m => Number(m.user_id) === Number(u.id))
  );
  const groupTypingNames = groupTypingIds
    .map(id => allUsers.find(u => Number(u.id) === Number(id))?.first_name ?? "Someone")
    .filter(Boolean);

  const currentUserRole    = currentMembers.find(m => Number(m.user_id) === Number(currentUserId))?.role;
  const isCurrentUserAdmin = currentUserRole === "admin";

  const memberCount = membersMap.has(selectedGroup?.id)
    ? currentMembers.length
    : (selectedGroup?.members?.length ?? 0);

  const chatSubtitle = isGroupTab
    ? `${selectedGroup?.group_type ?? "group"} · ${memberCount} member${memberCount !== 1 ? "s" : ""}${membersLoading ? " …" : ""}`
    : selectedUser
      ? (onlineUsers.has(String(selectedUser.id)) ? "🟢 Online" : "Offline")
      : "";

  const filteredGroups = groups.filter(g =>
    (g.group_name || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = allUsers.filter(u => {
    if (Number(u.id) === Number(currentUserId)) return false;
    return `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase());
  });

  const mentionUsers = isGroupTab ? groupMemberUsers : allUsers;

  // ========== SCROLL ==========
  const scrollToBottom = useCallback(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
    setUnreadScrollCount(0);
  }, []);

  // ========== EFFECTS ==========
  useEffect(() => {
    setUsersLoading(true);
    fetchAllUsers()
      .then(l => setAllUsers(Array.isArray(l) ? l : []))
      .catch(() => setAllUsers([]))
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    try {
      const t = localStorage.getItem("chat_active_tab");
      const g = localStorage.getItem("chat_selected_group");
      const u = localStorage.getItem("chat_selected_user");
      if (t) setActiveTab(t);
      if (g) setSelectedGroup(JSON.parse(g));
      if (u) setSelectedUser(JSON.parse(u));
    } catch {}
  }, []);

  // Fetch group members on group switch
  useEffect(() => {
    const id = selectedGroup?.id;
    if (!id) return;
    setMembersLoading(true);
    fetchGroupMembers(id)
      .then(members => {
        setMembersMap(p => {
          const n = new Map(p);
          n.set(id, Array.isArray(members) ? members : []);
          return n;
        });
      })
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, [selectedGroup?.id]);

  useEffect(() => { clearFiles(); }, [selectedGroup?.id, selectedUser?.id]);

  useEffect(() => {
    if (scrollAreaRef.current && messages) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isNearBottom) { scrollToBottom(); setUnreadScrollCount(0); }
      else if (messages.length > 0) setUnreadScrollCount(prev => prev + 1);
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleScroll = () => {
      const el = scrollAreaRef.current;
      if (!el) return;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollButton(dist > 150);
      if (dist < 50) setUnreadScrollCount(0);
    };
    const el = scrollAreaRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [messages]);

  useEffect(() => {
    if (selectedGroup || selectedUser) inputRef.current?.focus();
  }, [selectedGroup?.id, selectedUser?.id]);

  // ── Handle group deleted via socket (non-admin members + admin) ─────────────
  // deletedGroupId is set by useGroups whenever group_deleted fires.
  // If the deleted group is currently open: close it, clear storage, redirect.
  useEffect(() => {
    if (!deletedGroupId) return;
    if (Number(selectedGroup?.id) === deletedGroupId) {
      setSelectedGroup(null);
      setModal(null);
      setReplyingTo(null);
      localStorage.removeItem("chat_selected_group");
      notify("This group has been deleted", "error");
    }
  }, [deletedGroupId]);                                          // eslint-disable-line react-hooks/exhaustive-deps

  // ========== HANDLERS ==========
  const notify     = useCallback((msg, type = "success") => setToast({ msg, type }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const handleSend = async () => {
    if (!inputMsg.trim() && !hasPending) return;
    try {
      if (replyingTo) {
        await handleReply(inputMsg);
      } else if (isGroupTab && selectedGroup) {
        if (hasPending) {
          const s = await sendGroup(selectedGroup.id, inputMsg);
          if (s) addGroupMessage(s);
        } else {
          sendGroupMsg(inputMsg);
        }
      } else if (!isGroupTab && selectedUser) {
        if (hasPending) {
          const s = await sendDirect(selectedUser.id, inputMsg);
          if (s) addDirectMessage(s);
        } else {
          sendDirectMsg(inputMsg);
        }
      }
      setInputMsg("");
      scrollToBottom();
    } catch (err) {
      notify(err.message || "Failed to send", "error");
    }
  };

  const handleInputChange = (val) => {
    setInputMsg(val);
    if (isGroupTab && selectedGroup) emitGroupTyping();
    else if (!isGroupTab && selectedUser) emitDirectTyping();
  };

  const handleCreateGroup = async (name, type, projectId) => {
    setActionLoading(true);
    try {
      const g = await createGroup(name, type, projectId);
      notify("Group created!");
      closeModal();
      if (g) handleSelectGroup(g);
    } catch (err) { notify(err.message || "Failed", "error"); }
    finally { setActionLoading(false); }
  };

  const handleRenameGroup = async (name) => {
    setActionLoading(true);
    try {
      await updateGroupName(selectedGroup.id, name);
      setSelectedGroup(s => s ? { ...s, group_name: name } : s);
      notify("Group renamed!");
      closeModal();
    } catch (err) { notify(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  // Admin delete: useGroups.deleteGroup() sets deletedGroupId → triggers the
  // useEffect above which handles close + redirect. No duplicate logic here.
  const handleDeleteGroup = async () => {
    setActionLoading(true);
    try {
      await deleteGroup(selectedGroup.id);
      closeModal();
      notify("Group deleted");
    } catch (err) { notify(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const handleAddMember = async (userId) => {
    setActionLoading(true);
    try {
      await addMember(selectedGroup.id, userId);
      setMembersMap(p => {
        const n = new Map(p);
        n.set(selectedGroup.id, [
          ...(p.get(selectedGroup.id) ?? []),
          { user_id: Number(userId), role: "member" },
        ]);
        return n;
      });
      notify("Member added!");
      closeModal();
    } catch (err) { notify(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const handleRemoveMember = async (userId) => {
    setActionLoading(true);
    try {
      await removeMember(selectedGroup.id, userId);
      setMembersMap(p => {
        const n = new Map(p);
        n.set(
          selectedGroup.id,
          (p.get(selectedGroup.id) ?? []).filter(m => Number(m.user_id) !== Number(userId))
        );
        return n;
      });
      notify("Member removed");
    } catch (err) { notify(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const handleMakeAdmin = async (userId) => {
    setActionLoading(true);
    try {
      await makeAdmin(selectedGroup.id, userId);
      setMembersMap(p => {
        const n = new Map(p);
        n.set(
          selectedGroup.id,
          (p.get(selectedGroup.id) ?? []).map(m =>
            Number(m.user_id) === Number(userId) ? { ...m, role: "admin" } : m
          )
        );
        return n;
      });
      notify("Promoted to admin!");
    } catch (err) { notify(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const handleEditMsg = isGroupTab ? editGroupMessage : editDirectMessage;

  const handleDeleteAttachment = useCallback(async (messageId, attachmentId) => {
    try {
      if (isGroupTab) await deleteGroupAttachment(messageId, attachmentId);
      else            await deleteDirectAttachment(messageId, attachmentId);
    } catch (err) {
      notify(err.message || "Failed to delete image", "error");
    }
  }, [isGroupTab, deleteGroupAttachment, deleteDirectAttachment, notify]);

  const handleReactAttachment = useCallback((messageId, attachmentId, emoji) => {
    if (isGroupTab) reactToGroupAttachment(messageId, attachmentId, emoji);
    else            reactToDirectAttachment(messageId, attachmentId, emoji);
  }, [isGroupTab, reactToGroupAttachment, reactToDirectAttachment]);

  const handleDeleteMsg = useCallback(async (messageId) => {
    try {
      if (isGroupTab) await deleteGroupMessage(messageId);
      else            await deleteDirectMessage(messageId);
    } catch (err) { notify(err.message || "Failed to delete", "error"); }
  }, [isGroupTab, deleteGroupMessage, deleteDirectMessage, notify]);

  const handleReply = useCallback(async (text) => {
    if (!replyingTo || !text.trim()) return;
    try {
      if (isGroupTab) await replyToGroupMessage(replyingTo.id, text);
      else            await replyToDirectMessage(replyingTo.id, text);
      setReplyingTo(null);
      scrollToBottom();
    } catch (err) {
      notify(err.message || "Failed to send reply", "error");
    }
  }, [replyingTo, isGroupTab, replyToGroupMessage, replyToDirectMessage, scrollToBottom, notify]);

  // ── Select group — mark as read ──────────────────────────────────────────────
  const handleSelectGroup = useCallback((g) => {
    setActiveTab(TAB.GROUPS);
    setSelectedGroup(g);
    setSelectedUser(null);
    localStorage.setItem("chat_active_tab", TAB.GROUPS);
    localStorage.setItem("chat_selected_group", JSON.stringify(g));
    localStorage.removeItem("chat_selected_user");
    if (window.innerWidth < 640) setShowSidebar(false);
    setUnreadScrollCount(0);
    setReplyingTo(null);
    markGroupRead(g.id);
  }, [markGroupRead]);

  // ── Select user — mark as read ───────────────────────────────────────────────
  const handleSelectUser = useCallback((u) => {
    setActiveTab(TAB.DIRECT);
    setSelectedUser(u);
    setSelectedGroup(null);
    localStorage.setItem("chat_active_tab", TAB.DIRECT);
    localStorage.setItem("chat_selected_user", JSON.stringify(u));
    localStorage.removeItem("chat_selected_group");
    if (window.innerWidth < 640) setShowSidebar(false);
    setUnreadScrollCount(0);
    setReplyingTo(null);
    markDirectRead(u.id);
  }, [markDirectRead]);

  const handleGoToMention = useCallback((notification) => {
    markMentionRead(notification.message_id);
    if (notification.type === "group" && notification.chat_group_id) {
      const group = groups.find(g => Number(g.id) === Number(notification.chat_group_id));
      if (group) handleSelectGroup(group);
    } else if (notification.type === "direct" && notification.sender_id) {
      const user = allUsers.find(u => Number(u.id) === Number(notification.sender_id));
      if (user) handleSelectUser(user);
    }
  }, [groups, allUsers, markMentionRead, handleSelectGroup, handleSelectUser]);

  // ========== RENDER ==========
  return (
    <>
      <style>{`
        @keyframes slide-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .animate-slide-up{animation:slide-up .25s ease-out}
        @keyframes bounce-in{0%{opacity:0;transform:scale(0.3)}50%{opacity:1;transform:scale(1.05)}70%{transform:scale(0.9)}100%{transform:scale(1)}}
        .animate-bounce-in{animation:bounce-in 0.4s cubic-bezier(0.68,-0.55,0.265,1.55)}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex bg-gray-50 h-[calc(100vh-64px)] overflow-hidden font-sans">

        {/* ════════════════════════════════════════════════════════
            SIDEBAR
            ════════════════════════════════════════════════════════ */}
        <aside className={`${showSidebar ? "w-full sm:w-80" : "w-0 overflow-hidden"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 flex-shrink-0`}>

          {/* Header */}
          <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-400 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Chats</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-300" : "bg-red-300 animate-pulse"}`} />
                {activeTab === TAB.GROUPS && (
                  <button
                    onClick={() => setModal("create")}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg"
                  >
                    <Plus size={14} /> New Group
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={15} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={activeTab === TAB.GROUPS ? "Search groups…" : "Search people…"}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/20 placeholder-white/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 bg-white/20 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab(TAB.GROUPS)}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === TAB.GROUPS ? "bg-white text-orange-600" : "text-white/80 hover:text-white"}`}
              >
                <Users size={12} />
                Groups
                {(() => {
                  const total = groups.reduce((s, g) => s + getGroupCount(g.id), 0);
                  return total > 0 ? (
                    <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {total > 99 ? "99+" : total}
                    </span>
                  ) : null;
                })()}
              </button>

              <button
                onClick={() => setActiveTab(TAB.DIRECT)}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === TAB.DIRECT ? "bg-white text-orange-600" : "text-white/80 hover:text-white"}`}
              >
                <MessageSquare size={12} />
                Direct
                {(() => {
                  const total = allUsers.reduce((s, u) => s + getDirectCount(u.id), 0);
                  return total > 0 ? (
                    <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {total > 99 ? "99+" : total}
                    </span>
                  ) : null;
                })()}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

            {/* ── GROUPS TAB ─────────────────────────────────────────────── */}
            {activeTab === TAB.GROUPS && (
              <>
                {groupsLoading && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 size={20} className="animate-spin text-orange-400" />
                  </div>
                )}
                {!groupsLoading && filteredGroups.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    {search ? "No groups found" : "No groups yet. Create one!"}
                  </div>
                )}
                {filteredGroups.map(g => {
                  const isActive = selectedGroup?.id === g.id;
                  const cnt      = membersMap.has(g.id)
                    ? (membersMap.get(g.id) ?? []).length
                    : (g.members?.length ?? 0);
                  const unread   = getGroupCount(g.id);
                  const lastMsg  = g.last_message;
                  const lastTime = g.last_message_at
                    ? new Date(g.last_message_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
                    : null;

                  return (
                    <div
                      key={g.id}
                      onClick={() => handleSelectGroup(g)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-orange-50 border-l-4 border-orange-500" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar name={g.group_name || "Group"} size={11} />
                        {unread > 0 && !isActive && (
                          <span className="absolute -top-1 -right-1">
                            <UnreadBadge count={unread} size="sm" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`font-semibold text-sm truncate ${unread > 0 && !isActive ? "text-gray-900" : "text-gray-700"}`}>
                            {g.group_name || "Unnamed"}
                          </p>
                          {lastTime && (
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{lastTime}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className={`text-xs truncate ${unread > 0 && !isActive ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                            {lastMsg || `${g.group_type} · ${cnt} member${cnt !== 1 ? "s" : ""}`}
                          </p>
                          {unread > 0 && isActive && (
                            <UnreadBadge count={unread} size="sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* ── DIRECT TAB ─────────────────────────────────────────────── */}
            {activeTab === TAB.DIRECT && (
              <>
                {usersLoading && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 size={20} className="animate-spin text-orange-400" />
                  </div>
                )}
                {!usersLoading && filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    {search ? "No users found" : "No users available"}
                  </div>
                )}
                {[...filteredUsers]
                  .sort((a, b) => {
                    const ua = getDirectCount(a.id), ub = getDirectCount(b.id);
                    if (ub !== ua) return ub - ua;
                    const ao = onlineUsers.has(String(a.id)), bo = onlineUsers.has(String(b.id));
                    if (ao !== bo) return ao ? -1 : 1;
                    return `${a.first_name}${a.last_name}`.localeCompare(`${b.first_name}${b.last_name}`);
                  })
                  .map(u => {
                    const isActive = selectedUser?.id === u.id;
                    const isOnline = onlineUsers.has(String(u.id));
                    const name     = `${u.first_name} ${u.last_name ?? ""}`.trim();
                    const unread   = getDirectCount(u.id);

                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-orange-50 border-l-4 border-orange-500" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar name={name} photo={u.profile_photo} size={11} online={isOnline} />
                          {unread > 0 && !isActive && (
                            <span className="absolute -top-1 -right-1">
                              <UnreadBadge count={unread} size="sm" />
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`font-semibold text-sm truncate ${unread > 0 && !isActive ? "text-gray-900" : "text-gray-700"}`}>
                              {name}
                            </p>
                            <span className={`text-[10px] flex-shrink-0 font-medium ${isOnline ? "text-emerald-500" : "text-gray-400"}`}>
                              {isOnline ? "Online" : "Offline"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p className={`text-xs truncate ${unread > 0 && !isActive ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                              {u.role ?? u.designation ?? "Team member"}
                            </p>
                            {unread > 0 && (
                              <UnreadBadge count={unread} size="sm" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════
            CHAT AREA
            ════════════════════════════════════════════════════════ */}
        <main className={`flex-1 flex flex-col min-w-0 ${showSidebar ? "hidden sm:flex" : "flex"} relative`}>
          <ConnectionBanner connected={connected} error={connectionError} />

          {!selectedGroup && !selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center">
                <MessageSquare size={36} className="text-orange-300" />
              </div>
              <p className="font-medium text-gray-500">Select a conversation to start chatting</p>
              <button onClick={() => setModal("create")} className="text-sm text-orange-500 hover:underline font-medium">
                + Create a new group
              </button>
            </div>
          ) : (
            <>
              {/* ── HEADER ───────────────────────────────────────────────── */}
              <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowSidebar(true)} className="sm:hidden p-2 rounded-lg hover:bg-gray-100">
                    <ArrowLeft size={18} className="text-gray-600" />
                  </button>
                  {isGroupTab
                    ? <Avatar name={chatTitle} size={10} />
                    : <Avatar name={chatTitle} photo={selectedUser?.profile_photo} size={10} online={onlineUsers.has(String(selectedUser?.id))} />
                  }
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{chatTitle}</h3>
                    <p className="text-xs text-gray-400">{chatSubtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <MentionNotificationBell
                    notifications={mentionNotifications}
                    unreadCount={mentionUnread}
                    onMarkAllRead={markMentionsRead}
                    onGoToMessage={handleGoToMention}
                  />

                  {isGroupTab && selectedGroup && (
                    <>
                      <button
                        onClick={() => isCurrentUserAdmin && setModal("addMember")}
                        disabled={!isCurrentUserAdmin}
                        className={`p-2 rounded-lg group transition-colors ${isCurrentUserAdmin ? "hover:bg-orange-50 cursor-pointer" : "opacity-30 cursor-not-allowed"}`}
                        title={isCurrentUserAdmin ? "Add member" : "Only admins can add members"}
                      >
                        <UserPlus size={18} className={`${isCurrentUserAdmin ? "text-gray-500 group-hover:text-orange-500" : "text-gray-400"}`} />
                      </button>
                      <button onClick={() => setModal("members")} className="p-2 hover:bg-orange-50 rounded-lg group" title="Members">
                        <Users size={18} className="text-gray-500 group-hover:text-orange-500" />
                      </button>
                      <button
                        onClick={() => isCurrentUserAdmin && setModal("rename")}
                        disabled={!isCurrentUserAdmin}
                        className={`p-2 rounded-lg group transition-colors ${isCurrentUserAdmin ? "hover:bg-orange-50 cursor-pointer" : "opacity-30 cursor-not-allowed"}`}
                        title={isCurrentUserAdmin ? "Rename group" : "Only admins can rename"}
                      >
                        <Edit2 size={18} className={`${isCurrentUserAdmin ? "text-gray-500 group-hover:text-orange-500" : "text-gray-400"}`} />
                      </button>
                      <button
                        onClick={() => isCurrentUserAdmin && setModal("delete")}
                        disabled={!isCurrentUserAdmin}
                        className={`p-2 rounded-lg group transition-colors ${isCurrentUserAdmin ? "hover:bg-red-50 cursor-pointer" : "opacity-30 cursor-not-allowed"}`}
                        title={isCurrentUserAdmin ? "Delete group" : "Only admins can delete"}
                      >
                        <Trash2 size={18} className={`${isCurrentUserAdmin ? "text-gray-500 group-hover:text-red-500" : "text-gray-400"}`} />
                      </button>
                    </>
                  )}
                </div>
              </header>

              {/* ── MESSAGES ─────────────────────────────────────────────── */}
              <div
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-orange-50/30 to-white"
              >
                {hasMore && !msgLoading && (
                  <div className="flex justify-center">
                    <button onClick={loadMore} className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                      <RefreshCw size={12} /> Load older messages
                    </button>
                  </div>
                )}
                {msgLoading && messages?.length === 0 && (
                  <div className="flex items-center justify-center pt-12">
                    <Loader2 size={24} className="animate-spin text-orange-400" />
                  </div>
                )}
                {!msgLoading && messages?.length === 0 && (
                  <div className="text-center text-gray-400 text-sm mt-12">
                    No messages yet. Say hello! 👋
                  </div>
                )}
                <MessageList
                  messages={messages || []}
                  showSender={isGroupTab}
                  onEdit={handleEditMsg}
                  onDelete={handleDeleteMsg}
                  onDeleteAttachment={handleDeleteAttachment}
                  onReactAttachment={handleReactAttachment}
                  getReactions={(id) => messages?.find(m => Number(m.id) === Number(id))?.reactions ?? {}}
                  onReact={handleReact}
                  onReply={(msg) => setReplyingTo(msg)}
                  allUsers={allUsers}
                />
                <div ref={msgEndRef} />
              </div>

              {/* ── SCROLL TO BOTTOM BUTTON ──────────────────────────────── */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-5 z-30 flex flex-col items-center gap-1 group"
                  style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
                >
                  {unreadScrollCount > 0 && (
                    <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg">
                      {unreadScrollCount > 99 ? "99+" : unreadScrollCount}
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center shadow-xl group-hover:bg-orange-500 group-hover:border-orange-500 transition-all duration-200 group-hover:scale-110 active:scale-95">
                    <ChevronDown size={20} className="text-orange-500 group-hover:text-white transition-colors duration-200" />
                  </div>
                </button>
              )}

              {isGroupTab && groupTypingNames.length > 0 && <TypingIndicator names={groupTypingNames} />}
              {!isGroupTab && partnerTyping && <TypingIndicator names={[selectedUser?.first_name ?? ""]} />}

              <AttachmentPreview files={pendingFiles} onRemove={removeFile} />
              {uploadError && (
                <div className="bg-red-50 border-t border-red-100 px-4 py-1.5 flex items-center justify-between">
                  <p className="text-xs text-red-500">{uploadError}</p>
                  <button onClick={clearFiles} className="text-xs text-red-400 hover:text-red-600 font-medium">Clear</button>
                </div>
              )}

              {/* ── INPUT BAR ────────────────────────────────────────────── */}
              <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
                {replyingTo && (
                  <ReplyPreview
                    message={replyingTo}
                    onCancel={() => setReplyingTo(null)}
                  />
                )}
                <div className="flex items-end gap-2">
                  <AttachmentButton onFiles={addFiles} disabled={uploading} />
                  <EmojiPickerButton
                    onEmojiSelect={(emoji) => {
                      setInputMsg(prev => prev + emoji);
                      inputRef.current?.focus();
                    }}
                    disabled={uploading}
                  />
                  <MentionInput
                    ref={inputRef}
                    value={inputMsg}
                    onChange={handleInputChange}
                    onSend={handleSend}
                    onTyping={() => {
                      if (isGroupTab && selectedGroup) emitGroupTyping();
                      else if (!isGroupTab && selectedUser) emitDirectTyping();
                    }}
                    users={mentionUsers}
                    currentUserId={currentUserId}
                    disabled={uploading}
                    placeholder={hasPending ? "Add a caption… (optional)" : `Message ${chatTitle}…`}
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!inputMsg.trim() && !hasPending) || uploading}
                    className="p-2.5 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-xl hover:from-orange-500 hover:to-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {uploading
                      ? <Loader2 size={18} className="animate-spin" />
                      : <Send size={18} />
                    }
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {modal === "create"    && <CreateGroupModal onClose={closeModal} onCreate={handleCreateGroup} loading={actionLoading} />}
      {modal === "rename"    && selectedGroup && isCurrentUserAdmin && <RenameGroupModal group={selectedGroup} onClose={closeModal} onRename={handleRenameGroup} loading={actionLoading} />}
      {modal === "delete"    && selectedGroup && isCurrentUserAdmin && <DeleteGroupModal group={selectedGroup} onClose={closeModal} onDelete={handleDeleteGroup} loading={actionLoading} />}
      {modal === "addMember" && selectedGroup && isCurrentUserAdmin && <AddMemberModal group={selectedGroup} nonMembers={nonMemberUsers} onClose={closeModal} onAdd={handleAddMember} loading={actionLoading || membersLoading} />}
      {modal === "members"   && selectedGroup && (
        <MembersModal
          group={{ ...selectedGroup, members: currentMembers }}
          members={groupMemberUsers}
          onClose={closeModal}
          onRemove={isCurrentUserAdmin ? handleRemoveMember : undefined}
          onMakeAdmin={isCurrentUserAdmin ? handleMakeAdmin : undefined}
          loading={actionLoading || membersLoading}
        />
      )}
    </>
  );
}