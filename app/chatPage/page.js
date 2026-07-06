"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Search, ArrowLeft, Plus, Users,
  Edit2, Trash2, UserPlus, MessageSquare, Loader2, RefreshCw,
  ChevronDown, MoreVertical,
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

// Wallpaper for the message area — driven by the app's theme tokens so it
// adapts automatically between light/dark instead of a hardcoded WhatsApp tint.
const CHAT_WALLPAPER_BG = {
  backgroundColor: "var(--bg-primary)",
  backgroundImage: `radial-gradient(circle at 25% 20%, rgba(249,115,22,0.06) 0, transparent 45%),
                     radial-gradient(circle at 75% 75%, rgba(249,115,22,0.06) 0, transparent 45%)`,
};

const ORANGE_GRADIENT = "linear-gradient(to bottom right, #FB923C, #F97316)";

export default function ChatPage() {
  const { socketRef, connected, onlineUsers, connectionError } = useSocket();

  const {
    groups, groupsLoading,
    deletedGroupId,
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
  const [headerMenuOpen,    setHeaderMenuOpen]    = useState(false);

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
      ? (onlineUsers.has(String(selectedUser.id)) ? "online" : "offline")
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
      if (g) {
        const parsed = JSON.parse(g);
        if (parsed && parsed.id != null) setSelectedGroup(parsed);
      }
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed && parsed.id != null) setSelectedUser(parsed);
      }
    } catch {
      localStorage.removeItem("chat_selected_group");
      localStorage.removeItem("chat_selected_user");
    }
  }, []);

  // Re-sync selectedGroup with the live groups list once it loads, and clear
  // the selection if the group no longer exists (deleted / stale localStorage).
  useEffect(() => {
    if (!selectedGroup || groupsLoading) return;
    const live = groups.find(g => Number(g.id) === Number(selectedGroup.id));
    if (live) {
      const changed =
        live.group_name !== selectedGroup.group_name ||
        live.group_type !== selectedGroup.group_type ||
        live.last_message !== selectedGroup.last_message;
      if (changed) {
        setSelectedGroup(live);
        localStorage.setItem("chat_selected_group", JSON.stringify(live));
      }
    } else {
      setSelectedGroup(null);
      setModal(null);
      setReplyingTo(null);
      localStorage.removeItem("chat_selected_group");
    }
  }, [groups, groupsLoading, selectedGroup]);

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

      <div
        className="flex h-[calc(100vh-64px)] overflow-hidden font-sans"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >

        {/* ════════════════════════════════════════════════════════
            SIDEBAR
            ════════════════════════════════════════════════════════ */}
        <aside
          className={`${showSidebar ? "w-full sm:w-[380px]" : "w-0 overflow-hidden"} flex flex-col transition-all duration-300 flex-shrink-0`}
          style={{ backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)" }}
        >

          {/* Header */}
          <div
            className="h-16 flex items-center justify-between px-4 flex-shrink-0"
            style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: ORANGE_GRADIENT }}
              >
                {`${getCurrentUserId() || ""}`.slice(0, 1) || "C"}
              </div>
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>Chats</h2>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400 animate-pulse"}`}
                title={connected ? "Connected" : "Disconnected"}
              />
              {activeTab === TAB.GROUPS && (
                <button
                  onClick={() => setModal("create")}
                  className="ml-2 w-9 h-9 flex items-center justify-center rounded-full text-white shadow-md transition-all active:scale-95 hover:opacity-90"
                  style={{ background: ORANGE_GRADIENT }}
                  title="New group"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Tab switcher */}
          <div
            className="flex px-2 pt-2 flex-shrink-0"
            style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}
          >
            <button
              onClick={() => setActiveTab(TAB.GROUPS)}
              className="flex-1 flex items-center justify-center gap-1.5 pb-2.5 text-sm font-medium relative transition-colors"
              style={{ color: activeTab === TAB.GROUPS ? "#F97316" : "var(--text-secondary)" }}
            >
              <Users size={14} /> Groups
              {(() => {
                const total = groups.reduce((s, g) => s + getGroupCount(g.id), 0);
                return total > 0 ? (
                  <span
                    className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{ background: ORANGE_GRADIENT }}
                  >
                    {total > 99 ? "99+" : total}
                  </span>
                ) : null;
              })()}
              {activeTab === TAB.GROUPS && (
                <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full" style={{ background: ORANGE_GRADIENT }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab(TAB.DIRECT)}
              className="flex-1 flex items-center justify-center gap-1.5 pb-2.5 text-sm font-medium relative transition-colors"
              style={{ color: activeTab === TAB.DIRECT ? "#F97316" : "var(--text-secondary)" }}
            >
              <MessageSquare size={14} /> Direct
              {(() => {
                const total = allUsers.reduce((s, u) => s + getDirectCount(u.id), 0);
                return total > 0 ? (
                  <span
                    className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{ background: ORANGE_GRADIENT }}
                  >
                    {total > 99 ? "99+" : total}
                  </span>
                ) : null;
              })()}
              {activeTab === TAB.DIRECT && (
                <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full" style={{ background: ORANGE_GRADIENT }} />
              )}
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 flex-shrink-0" style={{ backgroundColor: "var(--bg-secondary)" }}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: "var(--text-secondary)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={activeTab === TAB.GROUPS ? "Search groups" : "Search or start new chat"}
                className="w-full pl-10 pr-3 py-2 rounded-full text-sm focus:outline-none transition-all"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid transparent",
                }}
                onFocus={e => { e.target.style.border = "1px solid #FDBA74"; e.target.style.boxShadow = "0 0 0 2px rgba(249,115,22,0.25)"; }}
                onBlur={e => { e.target.style.border = "1px solid transparent"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">

            {activeTab === TAB.GROUPS && (
              <>
                {groupsLoading && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 size={20} className="animate-spin" style={{ color: "#F97316" }} />
                  </div>
                )}
                {!groupsLoading && filteredGroups.length === 0 && (
                  <div className="p-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
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
                      className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isActive ? "rgba(249,115,22,0.08)" : "transparent",
                        borderBottom: "1px solid var(--border-color)",
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "var(--table-hover)"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar name={g.group_name || "Group"} size={12} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-[15px] truncate ${isActive || unread > 0 ? "font-semibold" : "font-medium"}`}
                            style={{ color: "var(--text-primary)" }}
                          >
                            {g.group_name || "Unnamed"}
                          </p>
                          {lastTime && (
                            <span
                              className="text-[11px] flex-shrink-0"
                              style={{ color: unread > 0 && !isActive ? "#F97316" : "var(--text-secondary)", fontWeight: unread > 0 && !isActive ? 600 : 400 }}
                            >
                              {lastTime}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p
                            className="text-[13px] truncate"
                            style={{ color: unread > 0 && !isActive ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: unread > 0 && !isActive ? 500 : 400 }}
                          >
                            {lastMsg || `${g.group_type} · ${cnt} member${cnt !== 1 ? "s" : ""}`}
                          </p>
                          {unread > 0 && (
                            <span
                              className="text-white text-[10px] font-bold min-w-[19px] h-[19px] px-1 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: ORANGE_GRADIENT }}
                            >
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === TAB.DIRECT && (
              <>
                {usersLoading && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 size={20} className="animate-spin" style={{ color: "#F97316" }} />
                  </div>
                )}
                {!usersLoading && filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
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
                        className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isActive ? "rgba(249,115,22,0.08)" : "transparent",
                          borderBottom: "1px solid var(--border-color)",
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "var(--table-hover)"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar name={name} photo={u.profile_photo} size={12} online={isOnline} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p
                              className={`text-[15px] truncate ${isActive || unread > 0 ? "font-semibold" : "font-medium"}`}
                              style={{ color: "var(--text-primary)" }}
                            >
                              {name}
                            </p>
                            <span
                              className="text-[11px] flex-shrink-0 font-medium"
                              style={{ color: isOnline ? "#10b981" : "var(--text-secondary)" }}
                            >
                              {isOnline ? "online" : "offline"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p
                              className="text-[13px] truncate"
                              style={{ color: unread > 0 && !isActive ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: unread > 0 && !isActive ? 500 : 400 }}
                            >
                              {u.role ?? u.designation ?? "Team member"}
                            </p>
                            {unread > 0 && (
                              <span
                                className="text-white text-[10px] font-bold min-w-[19px] h-[19px] px-1 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: ORANGE_GRADIENT }}
                              >
                                {unread > 99 ? "99+" : unread}
                              </span>
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
            <div className="flex-1 flex flex-col items-center justify-center gap-3" style={CHAT_WALLPAPER_BG}>
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <MessageSquare size={40} style={{ color: "#FDBA74" }} />
              </div>
              <p className="font-medium mt-2" style={{ color: "var(--text-secondary)" }}>Select a conversation to start chatting</p>
              <button onClick={() => setModal("create")} className="text-sm font-medium hover:underline" style={{ color: "#F97316" }}>
                + Create a new group
              </button>
            </div>
          ) : (
            <>
              {/* ── HEADER ─ */}
              <header
                className="px-4 py-2.5 flex items-center justify-between shadow-sm flex-shrink-0 h-16"
                style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="sm:hidden p-2 -ml-1 rounded-full"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  {isGroupTab
                    ? <Avatar name={chatTitle} size={10} />
                    : <Avatar name={chatTitle} photo={selectedUser?.profile_photo} size={10} online={onlineUsers.has(String(selectedUser?.id))} />
                  }
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px] leading-tight truncate" style={{ color: "var(--text-primary)" }}>{chatTitle}</h3>
                    <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{chatSubtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <MentionNotificationBell
                    notifications={mentionNotifications}
                    unreadCount={mentionUnread}
                    onMarkAllRead={markMentionsRead}
                    onGoToMessage={handleGoToMention}
                  />

                  {isGroupTab && selectedGroup && (
                    <div className="relative">
                      <button
                        onClick={() => setHeaderMenuOpen(o => !o)}
                        className="p-2 rounded-full transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        title="Group options"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {headerMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setHeaderMenuOpen(false)} />
                          <div
                            className="absolute right-0 top-11 z-20 rounded-xl shadow-xl py-1.5 w-52 animate-slide-up"
                            style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
                          >
                            <button
                              onClick={() => { setHeaderMenuOpen(false); setModal("members"); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:opacity-80"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <Users size={15} style={{ color: "var(--text-secondary)" }} /> View members
                            </button>
                            <button
                              onClick={() => { setHeaderMenuOpen(false); isCurrentUserAdmin && setModal("addMember"); }}
                              disabled={!isCurrentUserAdmin}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm disabled:cursor-not-allowed"
                              style={{ color: isCurrentUserAdmin ? "var(--text-primary)" : "var(--text-secondary)", opacity: isCurrentUserAdmin ? 1 : 0.5 }}
                            >
                              <UserPlus size={15} style={{ color: "var(--text-secondary)" }} /> Add member
                            </button>
                            <button
                              onClick={() => { setHeaderMenuOpen(false); isCurrentUserAdmin && setModal("rename"); }}
                              disabled={!isCurrentUserAdmin}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm disabled:cursor-not-allowed"
                              style={{ color: isCurrentUserAdmin ? "var(--text-primary)" : "var(--text-secondary)", opacity: isCurrentUserAdmin ? 1 : 0.5 }}
                            >
                              <Edit2 size={15} style={{ color: "var(--text-secondary)" }} /> Rename group
                            </button>
                            <div className="h-px my-1" style={{ backgroundColor: "var(--border-color)" }} />
                            <button
                              onClick={() => { setHeaderMenuOpen(false); isCurrentUserAdmin && setModal("delete"); }}
                              disabled={!isCurrentUserAdmin}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm disabled:cursor-not-allowed"
                              style={{ color: isCurrentUserAdmin ? "#ef4444" : "var(--text-secondary)", opacity: isCurrentUserAdmin ? 1 : 0.5 }}
                            >
                              <Trash2 size={15} style={{ color: isCurrentUserAdmin ? "#f87171" : "var(--text-secondary)" }} /> Delete group
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </header>

              {/* ── MESSAGES ────────────── */}
              <div
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
                style={CHAT_WALLPAPER_BG}
              >
                {hasMore && !msgLoading && (
                  <div className="flex justify-center">
                    <button
                      onClick={loadMore}
                      className="text-xs px-3 py-1.5 rounded-full shadow-sm hover:underline flex items-center gap-1"
                      style={{ color: "#F97316", backgroundColor: "var(--bg-secondary)" }}
                    >
                      <RefreshCw size={12} /> Load older messages
                    </button>
                  </div>
                )}
                {msgLoading && messages?.length === 0 && (
                  <div className="flex items-center justify-center pt-12">
                    <Loader2 size={24} className="animate-spin" style={{ color: "#F97316" }} />
                  </div>
                )}
                {!msgLoading && messages?.length === 0 && (
                  <div className="flex justify-center mt-12">
                    <div
                      className="text-xs px-4 py-2 rounded-full shadow-sm"
                      style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                    >
                      No messages yet. Say hello! 👋
                    </div>
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
                    <span
                      className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg"
                      style={{ background: ORANGE_GRADIENT }}
                    >
                      {unreadScrollCount > 99 ? "99+" : unreadScrollCount}
                    </span>
                  )}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 group-hover:scale-110 active:scale-95"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <ChevronDown size={20} style={{ color: "#F97316" }} />
                  </div>
                </button>
              )}

              {isGroupTab && groupTypingNames.length > 0 && <TypingIndicator names={groupTypingNames} />}
              {!isGroupTab && partnerTyping && <TypingIndicator names={[selectedUser?.first_name ?? ""]} />}

              <AttachmentPreview files={pendingFiles} onRemove={removeFile} />
              {uploadError && (
                <div
                  className="px-4 py-1.5 flex items-center justify-between"
                  style={{ backgroundColor: "rgba(239,68,68,0.08)", borderTop: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <p className="text-xs" style={{ color: "#ef4444" }}>{uploadError}</p>
                  <button onClick={clearFiles} className="text-xs font-medium hover:opacity-80" style={{ color: "#f87171" }}>Clear</button>
                </div>
              )}

              {/* ── INPUT BAR ── */}
              <div
                className="px-3 py-2.5 flex-shrink-0"
                style={{ backgroundColor: "var(--bg-primary)", borderTop: "1px solid var(--border-color)" }}
              >
                {replyingTo && (
                  <ReplyPreview
                    message={replyingTo}
                    onCancel={() => setReplyingTo(null)}
                  />
                )}
                <div className="flex items-end gap-2">
                  <div
                    className="flex-1 flex items-end gap-1.5 rounded-3xl px-2 py-1.5 shadow-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
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
                      placeholder={hasPending ? "Add a caption… (optional)" : "Type a message"}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={(!inputMsg.trim() && !hasPending) || uploading}
                    className="w-11 h-11 flex items-center justify-center text-white rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md active:scale-95 hover:opacity-90"
                    style={{ background: ORANGE_GRADIENT }}
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