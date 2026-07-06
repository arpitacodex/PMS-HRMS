"use client";

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8080/api/notifications";

const POLL_INTERVAL_MS = 15000;

/**
 * Tracks unread NOTICE count (separate from the general notification bell).
 * Usage: const { unreadCount, setUnreadCount } = useUnreadNoticeCount(token);
 */
export function useUnreadNoticeCount(token) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUnreadCount(data.unread_count);
    } catch (err) {
      console.error("Unread notice count fetch error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    const handleFocus = () => fetchCount();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchCount]);

  return { unreadCount, setUnreadCount, refetch: fetchCount };
}