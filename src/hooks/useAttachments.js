// src/hooks/useAttachments.js
import { useState, useCallback, useRef } from "react";

const BASE = "http://localhost:8080/api";

const authHeaders = () => ({
  Authorization: `Bearer ${
    typeof window !== "undefined" ? localStorage.getItem("token") : ""
  }`,
});

export const getMimeCategory = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MAX_SIZE = 50 * 1024 * 1024;

export const ACCEPTED_TYPES = {
  image: "image/jpeg,image/png,image/gif,image/webp,image/svg+xml",
  video: "video/mp4,video/webm,video/ogg,video/mov",
  audio: "audio/mpeg,audio/wav,audio/ogg,audio/m4a",
  file:  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv",
};
export const ALL_ACCEPTED = Object.values(ACCEPTED_TYPES).join(",");

export function useAttachments() {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState(null);
  const fileInputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList);
    const valid = [];
    const errors = [];
    for (const file of incoming) {
      if (file.size > MAX_SIZE) { errors.push(`${file.name} is too large (max 50 MB)`); continue; }
      valid.push(file);
    }
    if (errors.length) setUploadError(errors.join(", "));
    const withPreviews = valid.map((file) => {
      const type    = getMimeCategory(file);
      const preview = type === "image" ? URL.createObjectURL(file) : null;
      return { id: `${Date.now()}_${Math.random()}`, file, type, preview, name: file.name, size: file.size };
    });
    setPendingFiles((prev) => [...prev, ...withPreviews]);
  }, []);

  const removeFile = useCallback((id) => {
    setPendingFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setPendingFiles((prev) => { prev.forEach((f) => f.preview && URL.revokeObjectURL(f.preview)); return []; });
    setUploadError(null);
  }, []);

  // ── Send direct message with files ──────────────────────────────────────────
  // Returns the full saved message object from the backend so ChatPage
  // can immediately push it into the messages list via addMessage().
  const sendDirect = useCallback(async (receiverId, message = "") => {
    if (!receiverId) throw new Error("receiver_id required");
    if (!message.trim() && pendingFiles.length === 0) throw new Error("Message or file required");

    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("receiver_id", String(receiverId));
      if (message.trim()) form.append("message", message.trim());
      for (const f of pendingFiles) form.append("files", f.file);

      const res  = await fetch(`${BASE}/chats/direct-message`, { method: "POST", headers: authHeaders(), body: form });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Send failed");

      clearFiles();
      // Return the saved message — ChatPage calls addDirectMessage(saved)
      return data?.data ?? data;
    } catch (err) {
      setUploadError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [pendingFiles, clearFiles]);

  // ── Send group message with files ───────────────────────────────────────────
  // Returns the full saved message object so ChatPage can call addGroupMessage(saved).
  const sendGroup = useCallback(async (groupId, message = "") => {
    if (!groupId) throw new Error("groupId required");
    if (!message.trim() && pendingFiles.length === 0) throw new Error("Message or file required");

    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      if (message.trim()) form.append("message", message.trim());
      for (const f of pendingFiles) form.append("files", f.file);

      const res  = await fetch(`${BASE}/chats/group-message/${groupId}`, { method: "POST", headers: authHeaders(), body: form });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Send failed");

      clearFiles();
      // Return the saved message — ChatPage calls addGroupMessage(saved)
      return data?.data ?? data;
    } catch (err) {
      setUploadError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [pendingFiles, clearFiles]);

  // ── Reply to a direct message with optional files ────────────────────────────
  const replyDirect = useCallback(async (replyToId, receiverId, message = "") => {
    if (!replyToId || !receiverId) throw new Error("replyToId and receiverId required");
    if (!message.trim() && pendingFiles.length === 0) throw new Error("Message or file required");

    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("receiver_id", String(receiverId));
      if (message.trim()) form.append("message", message.trim());
      for (const f of pendingFiles) form.append("files", f.file);

      const res  = await fetch(`${BASE}/chats/direct-message/reply/${replyToId}`, { method: "POST", headers: authHeaders(), body: form });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Reply failed");

      clearFiles();
      return data?.data ?? data;
    } catch (err) {
      setUploadError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [pendingFiles, clearFiles]);

  // ── Reply to a group message with optional files ──────────────────────────────
  const replyGroup = useCallback(async (groupId, replyToId, message = "") => {
    if (!groupId || !replyToId) throw new Error("groupId and replyToId required");
    if (!message.trim() && pendingFiles.length === 0) throw new Error("Message or file required");

    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      if (message.trim()) form.append("message", message.trim());
      for (const f of pendingFiles) form.append("files", f.file);

      const res  = await fetch(`${BASE}/chats/group-message/${groupId}/reply/${replyToId}`, { method: "POST", headers: authHeaders(), body: form });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Reply failed");

      clearFiles();
      return data?.data ?? data;
    } catch (err) {
      setUploadError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [pendingFiles, clearFiles]);

  return {
    pendingFiles,
    uploading,
    uploadError,
    fileInputRef,
    addFiles,
    removeFile,
    clearFiles,
    sendDirect,
    sendGroup,
    replyDirect,
    replyGroup,
    hasPending: pendingFiles.length > 0,
  };
}