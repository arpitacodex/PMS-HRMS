// src/hooks/useSocket.js
"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getToken, getCurrentUserId } from "@/src/lib/auth";

const SOCKET_URL = "http://localhost:8080";

// Singleton socket instance (survives re-renders / StrictMode double-mount)
let _socket = null;

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected]         = useState(false);
  const [onlineUsers, setOnlineUsers]     = useState(new Set());
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const token = getToken();
    const userId = getCurrentUserId();
    if (!token) return;

    // Reuse existing singleton
    if (!_socket) {
      _socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }

    socketRef.current = _socket;

    // ── Event handlers ──────────────────────────────────────────────────────
    const onConnect = () => {
      setConnected(true);
      setConnectionError(null);
      // Register this user as online
      _socket.emit("user_online", { user_id: userId });
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
      // Expect array of user ids or { user_id } objects
      const ids = Array.isArray(users)
        ? users.map((u) => String(typeof u === "object" ? u.user_id ?? u.id : u))
        : [];
      setOnlineUsers(new Set(ids));
    };

    const onUserOnline = ({ user_id }) => {
      setOnlineUsers((prev) => new Set([...prev, String(user_id)]));
    };

    const onUserOffline = ({ user_id }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(String(user_id));
        return next;
      });
    };

    _socket.on("connect",        onConnect);
    _socket.on("disconnect",     onDisconnect);
    _socket.on("connect_error",  onConnectError);
    _socket.on("online_users",   onOnlineUsers);
    _socket.on("user_online",    onUserOnline);
    _socket.on("user_offline",   onUserOffline);

    // Trigger connect state if already connected
    if (_socket.connected) onConnect();

    return () => {
      _socket.off("connect",       onConnect);
      _socket.off("disconnect",    onDisconnect);
      _socket.off("connect_error", onConnectError);
      _socket.off("online_users",  onOnlineUsers);
      _socket.off("user_online",   onUserOnline);
      _socket.off("user_offline",  onUserOffline);
    };
  }, []);

  return { socketRef, connected, onlineUsers, connectionError };
}