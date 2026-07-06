// // src/hooks/useGroups.js
// // FIX: createGroup(name, group_type) — passes group_type to apiCreateGroup
// //      Backend requires both group_name AND group_type

// "use client";

// import { useState, useEffect, useCallback } from "react";
// import {
//   fetchMyGroups,
//   apiCreateGroup,
//   apiUpdateGroupName,
//   apiDeleteGroup,
//   apiAddMember,
//   apiRemoveMember,
//   apiMakeAdmin,
// } from "@/src/lib/api";

// export function useGroups() {
//   const [groups,       setGroups]  = useState([]);
//   const [groupsLoading, setLoading] = useState(true);
//   const [error,        setError]   = useState(null);

//   const loadGroups = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const list = await fetchMyGroups();
//       setGroups(Array.isArray(list) ? list : []);
//     } catch (err) {
//       setError(err.message);
//       setGroups([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { loadGroups(); }, [loadGroups]);


// // FIX: accept group_type, default "custom" (backend requires it)
//   const createGroup = useCallback(async (name, group_type = "custom", project_id = null) => {
//     const group = await apiCreateGroup(name, group_type, project_id);
//     if (group?.id) setGroups((prev) => [group, ...prev]);
//     return group;
//   }, []);

//   const updateGroupName = useCallback(async (id, name) => {
//     await apiUpdateGroupName(id, name);
//     setGroups((prev) =>
//       prev.map((g) => (Number(g.id) === Number(id) ? { ...g, group_name: name } : g))
//     );
//   }, []);

//   const deleteGroup = useCallback(async (id) => {
//     await apiDeleteGroup(id);
//     setGroups((prev) => prev.filter((g) => Number(g.id) !== Number(id)));
//   }, []);

//   // apiAddMember already sends { userId } (camelCase) — matches backend
//   const addMember = useCallback(async (groupId, userId) => {
//     await apiAddMember(groupId, userId);
//   }, []);

//   const removeMember = useCallback(async (groupId, userId) => {
//     await apiRemoveMember(groupId, userId);
//   }, []);

//   // apiMakeAdmin already sends { userId } (camelCase) — matches backend
//   const makeAdmin = useCallback(async (groupId, userId) => {
//     await apiMakeAdmin(groupId, userId);
//   }, []);

//   return {
//     groups, groupsLoading, error,
//     reloadGroups: loadGroups,
//     createGroup, updateGroupName, deleteGroup,
//     addMember, removeMember, makeAdmin,
//   };
// }

// src/hooks/useGroups.js

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchMyGroups,
  apiCreateGroup,
  apiUpdateGroupName,
  apiDeleteGroup,
  apiAddMember,
  apiRemoveMember,
  apiMakeAdmin,
} from "@/src/lib/api";
import { subscribeToGroupMessages } from "@/src/hooks/useSocket";

export function useGroups() {
  const [groups,        setGroups ]  = useState([]);
  const [groupsLoading, setLoading]  = useState(true);
  const [error,         setError ]   = useState(null);

  // Signals the page that a group was deleted by another member via socket.
  // The page watches this to close the chat window and redirect.
  const [deletedGroupId, setDeletedGroupId] = useState(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMyGroups();
      setGroups(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // ── group_deleted socket handler ──────────────────────────────────────────
  // Subscribes to the pub/sub fed by useSocket's singleton listener.
  // Handles both: admin who deleted (optimistic via deleteGroup below) and
  // non-admin members who receive the socket event.
  useEffect(() => {
    const unsub = subscribeToGroupMessages((msg) => {
      if (msg.__type !== "group_deleted") return;
      const id = Number(msg.chat_group_id);

      // 1. Remove group from chat list
      setGroups((prev) => prev.filter((g) => Number(g.id) !== id));

      // 2. Signal page to close chat window + redirect
      setDeletedGroupId(id);
    });
    return unsub;
  }, []);

  const createGroup = useCallback(async (name, group_type = "custom", project_id = null) => {
    const group = await apiCreateGroup(name, group_type, project_id);
    if (group?.id) setGroups((prev) => [group, ...prev]);
    return group;
  }, []);

  const updateGroupName = useCallback(async (id, name) => {
    await apiUpdateGroupName(id, name);
    setGroups((prev) =>
      prev.map((g) => (Number(g.id) === Number(id) ? { ...g, group_name: name } : g))
    );
  }, []);

  const deleteGroup = useCallback(async (id) => {
    await apiDeleteGroup(id);
    // Optimistic removal for the admin who triggered the delete.
    // Other members get removed via the group_deleted socket event above.
    setGroups((prev) => prev.filter((g) => Number(g.id) !== Number(id)));
    setDeletedGroupId(Number(id));
  }, []);

  const addMember = useCallback(async (groupId, userId) => {
    await apiAddMember(groupId, userId);
  }, []);

  const removeMember = useCallback(async (groupId, userId) => {
    await apiRemoveMember(groupId, userId);
  }, []);

  const makeAdmin = useCallback(async (groupId, userId) => {
    await apiMakeAdmin(groupId, userId);
  }, []);

  return {
    groups, groupsLoading, error,
    reloadGroups: loadGroups,
    createGroup, updateGroupName, deleteGroup,
    addMember, removeMember, makeAdmin,
    deletedGroupId,   // consumed by the page to close chat + redirect
  };
}