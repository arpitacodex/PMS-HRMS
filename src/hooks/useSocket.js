// "use client";

// import { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";
// import { getToken, getCurrentUserId } from "@/src/lib/auth";

// const SOCKET_URL = "http://localhost:8080";

// // ─── Singleton socket ─────────────────────────────────────────────────────────
// let _socket = null;

// // ─── Global pub/sub for direct messages ──────────────────────────────────────
// const _directListeners = new Set();
// const _pendingDirect   = [];

// export function notifyMessageListeners(msg) {
//   if (_directListeners.size === 0) {
//     _pendingDirect.push(msg);
//   } else {
//     _directListeners.forEach(fn => fn(msg));
//   }
// }

// export function subscribeToMessages(fn) {
//   _directListeners.add(fn);
//   if (_pendingDirect.length > 0) {
//     _pendingDirect.forEach(msg => fn(msg));
//     _pendingDirect.length = 0;
//   }
//   return () => _directListeners.delete(fn);
// }

// // ─── Global pub/sub for group messages ───────────────────────────────────────
// // Mirrors the direct message pattern exactly.
// // useUnreadCount and useGroupChat both subscribe to this — so badge bumps
// // fire instantly for attachment messages without requiring the user to be
// // on the chat page or have joined the group socket room.
// const _groupListeners = new Set();
// const _pendingGroup   = [];

// export function notifyGroupListeners(msg) {
//   if (_groupListeners.size === 0) {
//     _pendingGroup.push(msg);
//   } else {
//     _groupListeners.forEach(fn => fn(msg));
//   }
// }

// export function subscribeToGroupMessages(fn) {
//   _groupListeners.add(fn);
//   if (_pendingGroup.length > 0) {
//     _pendingGroup.forEach(msg => fn(msg));
//     _pendingGroup.length = 0;
//   }
//   return () => _groupListeners.delete(fn);
// }

// // ─── Global pub/sub for unread count events ───────────────────────────────────
// // Pumps unread_counts and unread_count_update through a singleton listener
// // so useUnreadCount always receives them even before it mounts.
// const _unreadListeners = new Set();
// const _pendingUnread   = [];

// export function notifyUnreadListeners(event) {
//   if (_unreadListeners.size === 0) {
//     _pendingUnread.push(event);
//   } else {
//     _unreadListeners.forEach(fn => fn(event));
//   }
// }

// export function subscribeToUnread(fn) {
//   _unreadListeners.add(fn);
//   if (_pendingUnread.length > 0) {
//     _pendingUnread.forEach(event => fn(event));
//     _pendingUnread.length = 0;
//   }
//   return () => _unreadListeners.delete(fn);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // useSocket
// // ─────────────────────────────────────────────────────────────────────────────
// export function useSocket() {
//   const socketRef = useRef(null);

//   const [connected,       setConnected      ] = useState(false);
//   const [onlineUsers,     setOnlineUsers    ] = useState(new Set());
//   const [connectionError, setConnectionError] = useState(null);

//   useEffect(() => {
//     const token = getToken();
//     if (!token) return;

//     // ── Create singleton once ─────────────────────────────────────────────────
//     if (!_socket) {
//       _socket = io(SOCKET_URL, {
//         auth:                 { token },
//         transports:           ["websocket", "polling"],
//         reconnection:         true,
//         reconnectionAttempts: 5,
//         reconnectionDelay:    2000,
//       });

//       // ── Singleton-level listeners (registered once, never removed) ──────────
//       // These fan out to all hook subscribers via the pub/sub stores above.
//       // Registered here so they fire regardless of which component is mounted.

//       _socket.on("new_direct_message", (msg) => {
//         notifyMessageListeners(msg);
//       });

//       _socket.on("new_group_message", (msg) => {
//         notifyGroupListeners(msg);
//       });

//       _socket.on("unread_counts", (payload) => {
//         notifyUnreadListeners({ type: "unread_counts", payload });
//       });

//       _socket.on("unread_count_update", (payload) => {
//         notifyUnreadListeners({ type: "unread_count_update", payload });
//       });

//       _socket.on("chat_unread_update", (payload) => {
//         notifyUnreadListeners({ type: "chat_unread_update", payload });
//       });


//       // Inside if (!_socket) { ... } in useSocket.js, add these two:

//     _socket.on("group_message_deleted", (payload) => {
//         notifyGroupListeners({ __type: "deleted", ...payload });
//     });

//     _socket.on("group_attachment_deleted", (payload) => {
//         notifyGroupListeners({ __type: "attachment_deleted", ...payload });
//     });
//     }

//     socketRef.current = _socket;

//     // ── Per-render listeners (connection state + online presence) ─────────────
//     const onConnect = () => {
//       setConnected(true);
//       setConnectionError(null);
//     };

//     const onDisconnect = (reason) => {
//       setConnected(false);
//       setConnectionError(`Disconnected: ${reason}`);
//     };

//     const onConnectError = (err) => {
//       setConnected(false);
//       setConnectionError(err.message);
//     };

//     const onOnlineUsers = (users) => {
//       const ids = Array.isArray(users)
//         ? users.map(u => String(typeof u === "object" ? u.user_id ?? u.id : u))
//         : [];
//       setOnlineUsers(new Set(ids));
//     };

//     const onUserStatus = ({ userId, user_id, status }) => {
//       const id = String(userId ?? user_id);
//       setOnlineUsers(prev => {
//         const next = new Set(prev);
//         status === "online" ? next.add(id) : next.delete(id);
//         return next;
//       });
//     };

//     _socket.on("connect",       onConnect);
//     _socket.on("disconnect",    onDisconnect);
//     _socket.on("connect_error", onConnectError);
//     _socket.on("online_users",  onOnlineUsers);
//     _socket.on("user_status",   onUserStatus);

//     if (_socket.connected) onConnect();

//     return () => {
//       _socket.off("connect",       onConnect);
//       _socket.off("disconnect",    onDisconnect);
//       _socket.off("connect_error", onConnectError);
//       _socket.off("online_users",  onOnlineUsers);
//       _socket.off("user_status",   onUserStatus);
//       // ⚠️ Never remove the singleton-level listeners above —
//       //    they must stay alive for the lifetime of the app session
//     };
//   }, []);

//   return { socketRef, connected, onlineUsers, connectionError };
// }

"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getToken, getCurrentUserId } from "@/src/lib/auth";

const SOCKET_URL = "http://localhost:8080";

// ─── Singleton socket ─────────────────────────────────────────────────────────
let _socket = null;

// ─── Global pub/sub for direct messages ──────────────────────────────────────
const _directListeners = new Set();
const _pendingDirect   = [];

export function notifyMessageListeners(msg) {
  if (_directListeners.size === 0) {
    _pendingDirect.push(msg);
  } else {
    _directListeners.forEach(fn => fn(msg));
  }
}

export function subscribeToMessages(fn) {
  _directListeners.add(fn);
  if (_pendingDirect.length > 0) {
    _pendingDirect.forEach(msg => fn(msg));
    _pendingDirect.length = 0;
  }
  return () => _directListeners.delete(fn);
}

// ─── Global pub/sub for group messages ───────────────────────────────────────
const _groupListeners = new Set();
const _pendingGroup   = [];

export function notifyGroupListeners(msg) {
  if (_groupListeners.size === 0) {
    _pendingGroup.push(msg);
  } else {
    _groupListeners.forEach(fn => fn(msg));
  }
}

export function subscribeToGroupMessages(fn) {
  _groupListeners.add(fn);
  if (_pendingGroup.length > 0) {
    _pendingGroup.forEach(msg => fn(msg));
    _pendingGroup.length = 0;
  }
  return () => _groupListeners.delete(fn);
}

// ─── Global pub/sub for unread count events ───────────────────────────────────
const _unreadListeners = new Set();
const _pendingUnread   = [];

export function notifyUnreadListeners(event) {
  if (_unreadListeners.size === 0) {
    _pendingUnread.push(event);
  } else {
    _unreadListeners.forEach(fn => fn(event));
  }
}

export function subscribeToUnread(fn) {
  _unreadListeners.add(fn);
  if (_pendingUnread.length > 0) {
    _pendingUnread.forEach(event => fn(event));
    _pendingUnread.length = 0;
  }
  return () => _unreadListeners.delete(fn);
}

// ─────────────────────────────────────────────────────────────────────────────
// useSocket
// ─────────────────────────────────────────────────────────────────────────────
export function useSocket() {
  const socketRef = useRef(null);

  const [connected,       setConnected      ] = useState(false);
  const [onlineUsers,     setOnlineUsers    ] = useState(new Set());
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // ── Create singleton once ─────────────────────────────────────────────────
    if (!_socket) {
      _socket = io(SOCKET_URL, {
        auth:                 { token },
        transports:           ["websocket", "polling"],
        reconnection:         true,
        reconnectionAttempts: 5,
        reconnectionDelay:    2000,
      });

      // ── Singleton-level listeners (registered once, never removed) ──────────
      _socket.on("new_direct_message", (msg) => {
        notifyMessageListeners(msg);
      });

      _socket.on("new_group_message", (msg) => {
        notifyGroupListeners(msg);
      });

      _socket.on("unread_counts", (payload) => {
        notifyUnreadListeners({ type: "unread_counts", payload });
      });

      _socket.on("unread_count_update", (payload) => {
        notifyUnreadListeners({ type: "unread_count_update", payload });
      });

      _socket.on("chat_unread_update", (payload) => {
        notifyUnreadListeners({ type: "chat_unread_update", payload });
      });

      _socket.on("group_message_deleted", (payload) => {
        notifyGroupListeners({ __type: "deleted", ...payload });
      });

      _socket.on("group_attachment_deleted", (payload) => {
        notifyGroupListeners({ __type: "attachment_deleted", ...payload });
      });

      // FIX: Fan out group_deleted through the pub/sub so useGroups and any
      // other subscriber receives it without registering their own socket listener
      _socket.on("group_deleted", (payload) => {
        notifyGroupListeners({ __type: "group_deleted", ...payload });
      });
    }

    socketRef.current = _socket;

    // ── Per-render listeners (connection state + online presence) ─────────────
    const onConnect = () => {
      setConnected(true);
      setConnectionError(null);
    };

    const onDisconnect = (reason) => {
      setConnected(false);
      setConnectionError(`Disconnected: ${reason}`);
    };

    const onConnectError = (err) => {
      setConnected(false);
      setConnectionError(err.message);
    };

    const onOnlineUsers = (users) => {
      const ids = Array.isArray(users)
        ? users.map(u => String(typeof u === "object" ? u.user_id ?? u.id : u))
        : [];
      setOnlineUsers(new Set(ids));
    };

    const onUserStatus = ({ userId, user_id, status }) => {
      const id = String(userId ?? user_id);
      setOnlineUsers(prev => {
        const next = new Set(prev);
        status === "online" ? next.add(id) : next.delete(id);
        return next;
      });
    };

    _socket.on("connect",       onConnect);
    _socket.on("disconnect",    onDisconnect);
    _socket.on("connect_error", onConnectError);
    _socket.on("online_users",  onOnlineUsers);
    _socket.on("user_status",   onUserStatus);

    if (_socket.connected) onConnect();

    return () => {
      _socket.off("connect",       onConnect);
      _socket.off("disconnect",    onDisconnect);
      _socket.off("connect_error", onConnectError);
      _socket.off("online_users",  onOnlineUsers);
      _socket.off("user_status",   onUserStatus);
      // ⚠️ Never remove the singleton-level listeners above —
      //    they must stay alive for the lifetime of the app session
    };
  }, []);

  return { socketRef, connected, onlineUsers, connectionError };
}