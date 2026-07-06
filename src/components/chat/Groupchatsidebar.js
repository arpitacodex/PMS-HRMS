"use client";

import { Search, Plus, Users, Bell, BellOff } from "lucide-react";
import { UnreadBadge } from "@/src/components/chat/UnreadBadge";
import { Avatar } from "@/src/components/chat/ui";

// ─────────────────────────────────────────────────────────────────────────────
// GroupChatSidebar
//
// Shows list of groups with unread counts per group.
// Drop-in replacement for your existing groups sidebar list section.
//
// Props:
//   groups           array   — from useGroups
//   selectedGroup    object  — currently active group
//   onSelectGroup    fn      — called with group when row is clicked
//   getGroupCount    fn      — (groupId) => unread count  ← from useUnreadCount
//   onNewGroup       fn      — open create group modal
//   searchQuery      string
//   setSearchQuery   fn
// ─────────────────────────────────────────────────────────────────────────────

export function GroupChatSidebar({
  groups = [],
  selectedGroup,
  onSelectGroup,
  getGroupCount,
  onNewGroup,
  searchQuery = "",
  setSearchQuery,
}) {
  const filtered = groups.filter((g) =>
    (g.group_name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Groups
        </span>
        <button
          onClick={onNewGroup}
          className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-500 transition-colors"
          title="New Group"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="bg-transparent text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none flex-1 min-w-0"
          />
        </div>
      </div>

      {/* ── Group List ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-0.5 px-2 pb-4">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
            <Users size={28} className="opacity-40" />
            <p className="text-xs">No groups found</p>
          </div>
        )}

        {filtered.map((group) => {
          const isActive  = Number(selectedGroup?.id) === Number(group.id);
          const unread    = getGroupCount ? getGroupCount(group.id) : 0;
          const groupName = group.group_name ?? "Unnamed Group";
          const memberCount = group.members?.length ?? group.member_count ?? 0;

          return (
            <GroupRow
              key={group.id}
              group={group}
              groupName={groupName}
              memberCount={memberCount}
              isActive={isActive}
              unread={unread}
              onClick={() => onSelectGroup(group)}
            />
          );
        })}
      </div>
    </div>
  );
}


// ── Single group row ──────────────────────────────────────────────────────────
function GroupRow({ group, groupName, memberCount, isActive, unread, onClick }) {

  const lastMsg     = group.last_message;
  const lastMsgTime = group.last_message_at;

  const preview = lastMsg
    ? lastMsg.length > 30 ? lastMsg.slice(0, 30) + "…" : lastMsg
    : `${memberCount} member${memberCount !== 1 ? "s" : ""}`;

  const timeLabel = lastMsgTime
    ? new Date(lastMsgTime).toLocaleTimeString("en-IN", {
        hour:   "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left
        ${isActive
          ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-200/50 dark:shadow-orange-900/30"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
        }
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
            ${isActive
              ? "bg-white/20 text-white"
              : "bg-gradient-to-br from-orange-400 to-amber-500 text-white"
            }
            shadow-sm
          `}
        >
          {groupName.slice(0, 2).toUpperCase()}
        </div>
        {unread > 0 && !isActive && (
          <span className="absolute -top-1 -right-1">
            <UnreadBadge count={unread} size="sm" />
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-sm font-semibold truncate ${
              isActive ? "text-white" : "text-gray-800 dark:text-gray-100"
            }`}
          >
            {groupName}
          </span>
          {timeLabel && (
            <span
              className={`text-[10px] flex-shrink-0 ${
                isActive ? "text-white/70" : "text-gray-400"
              }`}
            >
              {timeLabel}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span
            className={`text-xs truncate ${
              isActive
                ? "text-white/75"
                : unread > 0
                ? "text-gray-700 dark:text-gray-200 font-medium"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {preview}
          </span>
          {unread > 0 && isActive && (
            <UnreadBadge count={unread} size="sm" />
          )}
        </div>
      </div>
    </button>
  );
}