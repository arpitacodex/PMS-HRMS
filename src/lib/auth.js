// src/lib/auth.js

export const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

export const getRole = () =>
  typeof window !== "undefined" ? localStorage.getItem("role") : null;

/**
 * Decode JWT payload (no verification – client-side only).
 * Returns null if token is missing or malformed.
 */
export const decodeToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

/**
 * Returns the current user's numeric ID from the JWT.
 * Tries common claim keys: id, user_id, sub, userId.
 */
export const getCurrentUserId = () => {
  const payload = decodeToken();
  if (!payload) return null;
  return (
    payload.id ??
    payload.user_id ??
    payload.userId ??
    payload.sub ??
    null
  );
};

export const getCurrentUser = () => decodeToken();

export const isAdminHRorPM = () =>
  ["admin", "hr", "project_manager"].includes((getRole() || "").toLowerCase());