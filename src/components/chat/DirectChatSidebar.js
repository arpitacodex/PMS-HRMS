"use client";

import { Search } from "lucide-react";
import { UnreadBadge } from "@/src/components/chat/UnreadBadge";
import { Avatar } from "@/src/components/chat/ui";

// ─────────────────────────────────────────────────────────────────────────────
// DirectChatSidebar
//
// Shows list of users (direct chats) with unread badges per person.
// Drop-in replacement for your existing Direct tab user list.
//
// Props:
//   users            array   — all users from fetchAllUsers
//   selectedUser     object  — currently active DM partner
//   onSelectUser     fn      — called with user when row is clicked
//   getDirectCount   fn      — (userId) => unread count  ← from useUnreadCount
//   onlineUsers      Set     — from useSocket
//   searchQuery      string
//   setSearchQuery   fn
// ─────────────────────────────────────────────────────────────────────────────

export function DirectChatSidebar({
  users = [],
  selectedUser,
  onSelectUser,
  getDirectCount,
  onlineUsers = new Set(),
  searchQuery = "",
  setSearchQuery,
}) {
  const currentUserId = Number(
    typeof window !== "undefined" ? localStorage.getItem("userId") : null
  );

  const filtered = users.filter((u) => {
    if (Number(u.id) === currentUserId) return false;
    const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Sort: users with unread messages first, then online, then alphabetical
  const sorted = [...filtered].sort((a, b) => {
    const ua = getDirectCount ? getDirectCount(a.id) : 0;
    const ub = getDirectCount ? getDirectCount(b.id) : 0;
    if (ub !== ua) return ub - ua; // unread desc

    const aOnline = onlineUsers.has(String(a.id));
    const bOnline = onlineUsers.has(String(b.id));
    if (aOnline !== bOnline) return aOnline ? -1 : 1; // online first

    const aName = `${a.first_name} ${a.last_name}`;
    const bName = `${b.first_name} ${b.last_name}`;
    return aName.localeCompare(bName);
  });

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Direct Messages
        </span>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people..."
            className="bg-transparent text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none flex-1 min-w-0"
          />
        </div>
      </div>

      {/* ── User List ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-0.5 px-2 pb-4">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
            <p className="text-xs">No contacts found</p>
          </div>
        )}

        {sorted.map((user) => {
          const isActive = Number(selectedUser?.id) === Number(user.id);
          const unread   = getDirectCount ? getDirectCount(user.id) : 0;
          const isOnline = onlineUsers.has(String(user.id));
          const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

          return (
            <DirectRow
              key={user.id}
              user={user}
              fullName={fullName}
              isActive={isActive}
              unread={unread}
              isOnline={isOnline}
              onClick={() => onSelectUser(user)}
            />
          );
        })}
      </div>
    </div>
  );
}


// ── Single user row ───────────────────────────────────────────────────────────
function DirectRow({ user, fullName, isActive, unread, isOnline, onClick }) {
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
      {/* Avatar with online dot */}
      <div className="relative flex-shrink-0">
        <Avatar
          name={fullName}
          photo={user.profile_photo}
          size={9}
          online={isOnline}
        />
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
            {fullName || "Unknown"}
          </span>
          <span
            className={`text-[10px] flex-shrink-0 font-medium ${
              isActive
                ? "text-white/70"
                : isOnline
                ? "text-emerald-500"
                : "text-gray-400"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
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
            {user.role ?? user.designation ?? "Team member"}
          </span>
          {unread > 0 && (
            <UnreadBadge count={unread} size="sm" />
          )}
        </div>
      </div>
    </button>
  );
}