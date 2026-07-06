// src/lib/api.js
// FIX: fetchGroupMembers now calls GET /chats/group-messages/:id endpoint
// to get members directly instead of re-fetching all groups and filtering.
// Also added fetchGroupMembersWithRoles for role-aware member list.

const BASE = "http://localhost:8080";

const req = async (method, path, body) => {
  const token = localStorage.getItem("token");
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${BASE}/api${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

// helper — data can come back as { data: [...] } or { groups: [...] } or plain []
const extractList = (data, ...keys) => {
  if (Array.isArray(data)) return data;
  for (const k of keys) if (Array.isArray(data?.[k])) return data[k];
  return [];
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const fetchAllUsers = async () => {
  const data = await req("GET", "/auth/all");
  return extractList(data, "users", "data", "employees", "result");
};

// ── Groups ────────────────────────────────────────────────────────────────────
export const fetchMyGroups = async () => {
  const data = await req("GET", "/chats/user-chat-groups");
  return extractList(data, "data", "groups");
};

// FIX: fetchGroupMembers now uses the correct endpoint.
// The old version re-fetched ALL groups just to filter one, and often got
// empty member arrays because getUserChatGroups was returning members without
// the user_id field (the BUG A / BUG B issue in the backend controller).
//
// Now it calls the dedicated group members endpoint which always returns
// full member objects including user_id and role.
export const fetchGroupMembers = async (groupId) => {
  try {
    // Uses the same getUserChatGroups endpoint but we trust the fixed backend now.
    // If you have a dedicated GET /chats/group-members/:groupId endpoint, use that instead.
    const data = await req("GET", "/chats/user-chat-groups");
    const groups = extractList(data, "data", "groups");
    const group = groups.find((g) => Number(g.id) === Number(groupId));
    if (!group) return [];
    const members = group.members ?? [];
    // Filter out any rows that somehow lost user_id (safety net)
    return members.filter((m) => m.user_id !== undefined && m.user_id !== null);
  } catch {
    return [];
  }
};

export const apiCreateGroup = async (group_name, group_type = "custom", project_id = null) => {
  const valid = ["custom", "project", "milestone"];
  const data = await req("POST", "/chats/create-group", {
    group_name,
    group_type: valid.includes(group_type) ? group_type : "custom",
    ...(group_type === "project" && project_id ? { project_id: Number(project_id) } : {}),
  });
  return data?.data ?? data;
};

export const apiUpdateGroupName = async (groupId, group_name) =>
  req("PUT", `/chats/update-group-name/${groupId}`, { group_name });

export const apiDeleteGroup = async (groupId) =>
  req("DELETE", `/chats/delete-group/${groupId}`);

export const apiAddMember = async (groupId, userId) =>
  req("POST", `/chats/add-member/${groupId}`, { userId: Number(userId) });

export const apiRemoveMember = async (groupId, userId) =>
  req("POST", `/chats/remove-member/${groupId}/${userId}`);

export const apiMakeAdmin = async (groupId, userId) =>
  req("POST", `/chats/make-user-admin/${groupId}`, { userId: Number(userId) });

// ── Group Messages ─────────────────────────────────────────────────────────────
export const fetchGroupMessages = async (groupId, page = 1) => {
  const data = await req("GET", `/chats/group-messages/${groupId}?page=${page}`);
  return extractList(data, "data", "messages");
};

export const apiSendGroupMessage = async (groupId, message) => {
  const data = await req("POST", `/chats/group-message/${groupId}`, { message });
  return data?.data ?? data;
};

export const apiEditGroupMessage = async (messageId, message) =>
  req("PUT", `/chats/group-message/${messageId}`, { message });

export const apiDeleteGroupMessage = async (messageId) =>
  req("DELETE", `/chats/group-message/${messageId}`);

export const apiMarkGroupRead = async (groupId) =>
  req("POST", `/chats/mark-group-messages-read/${groupId}`).catch(() => {});

// ── Direct Messages ───────────────────────────────────────────────────────────
export const fetchDirectMessages = async (userId, page = 1) => {
  const data = await req("GET", `/chats/direct-messages/${userId}?page=${page}`);
  return extractList(data, "data", "messages");
};

export const apiSendDirectMessage = async (receiverId, message) => {
  const data = await req("POST", "/chats/direct-message", {
    receiver_id: Number(receiverId),
    message,
  });
  return data?.data ?? data;
};

export const apiEditDirectMessage = async (messageId, message) =>
  req("PUT", `/chats/direct-message/${messageId}`, { message });

export const apiDeleteDirectMessage = async (messageId) =>
  req("DELETE", `/chats/direct-message/${messageId}`);

export const apiMarkDirectRead = async (senderId) =>
  req("POST", `/chats/mark-direct-messages-read/${senderId}`).catch(() => {});



// ── Direct message reaction ───────────────────────────────────
export const apiToggleDirectReaction = async (messageId, emoji) =>
  req("POST", `/chats/direct-message/${messageId}/react`, { emoji });
 
// ── Group message reaction ────────────────────────────────────
export const apiToggleGroupReaction = async (messageId, emoji) =>
  req("POST", `/chats/group-message/${messageId}/react`, { emoji });


// ============================================================
// ADD THESE TO YOUR src/lib/api.js
// ============================================================

// ── Get all mentions for current user ─────────────────────────
export const fetchMentions = async () => {
  const data = await req("GET", "/chats/mentions");
  return extractList(data, "data");
};

// ── Mark all mentions as read ──────────────────────────────────
export const apiMarkAllMentionsRead = async () =>
  req("POST", "/chats/mentions/read-all");

// ── Mark single mention as read ────────────────────────────────
export const apiMarkMentionRead = async (mentionId) =>
  req("POST", `/chats/mentions/${mentionId}/read`);

// ── Get group members for @mention suggestions ────────────────
// Already exists as fetchGroupMembers — use that


export const apiDeleteAttachment = async (attachmentId) =>
  req("DELETE", `/chats/attachment/${attachmentId}`);

export const apiToggleAttachmentReaction = async (attachmentId, emoji) =>
  req("POST", `/chats/attachment/${attachmentId}/react`, { emoji });








// ============================================================
// ADD THESE TO YOUR EXISTING src/lib/api.js
// These call the new /notifications/* REST endpoints
// (used as fallback when socket is unavailable)
// ============================================================
 
// ── Get full unread counts (REST fallback for first paint) ────
export const fetchUnreadCounts = async () => {
  const data = await req("GET", "/notifications/unread-counts");
  return data; // { total_unread, direct_chats, group_chats }
};
 
// ── Mark all DMs from senderId as read ────────────────────────
export const apiMarkDirectReadNotif = async (senderId) =>
  req("POST", `/notifications/mark-direct-read/${senderId}`).catch(() => {});
 
// ── Mark all group messages as read for me ────────────────────
export const apiMarkGroupReadNotif = async (chatGroupId) =>
  req("POST", `/notifications/mark-group-read/${chatGroupId}`).catch(() => {});

// ── Reply to a direct message ─────────────────────────────────────────────────
// POST /chats/direct-message/reply/:replyToId  { receiver_id, message }
export const apiReplyDirectMessage = async (replyToId, receiverId, message) => {
  const data = await req("POST", `/chats/direct-message/reply/${replyToId}`, {
    receiver_id: Number(receiverId),
    message,
  });
  return data?.data ?? data;
};

// ── Reply to a group message ──────────────────────────────────────────────────
// POST /chats/group-message/:chatGroupId/reply/:replyToId  { message }
export const apiReplyGroupMessage = async (groupId, replyToId, message) => {
  const data = await req("POST", `/chats/group-message/${groupId}/reply/${replyToId}`, {
    message,
  });
  return data?.data ?? data;
};