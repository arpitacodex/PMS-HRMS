// src/components/chat/GroupModals.jsx
// ─────────────────────────────────────────────────────────────────────────────
// FIX: Group type options changed from "public"/"private" to
//      "custom"/"project"/"milestone" to match backend validation.
//      For general employee chat, "custom" is the correct type.
//      "project" and "milestone" require a project_id (advanced use).
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Users, Loader2, Trash2, Edit2, UserPlus,
  Crown, UserMinus, Search,
} from "lucide-react";
import { Avatar } from "./ui";

// ── Shared Modal Shell ────────────────────────────────────────────────────────
function Modal({ title, icon: Icon, onClose, children, danger = false }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl
        shadow-2xl overflow-hidden border border-gray-100 z-10 max-h-[90dvh] flex flex-col">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100
          ${danger ? "bg-red-50" : "bg-gradient-to-r from-orange-500 to-amber-400"}`}>
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                ${danger ? "bg-red-100" : "bg-white/20"}`}>
                <Icon size={16} className={danger ? "text-red-500" : "text-white"} />
              </div>
            )}
            <h2 className={`text-base font-bold ${danger ? "text-red-700" : "text-white"}`}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors
              ${danger
                ? "text-red-400 hover:bg-red-100"
                : "text-white/60 hover:text-white hover:bg-white/20"}`}
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Create Group ──────────────────────────────────────────────────────────────
export function CreateGroupModal({ onClose, onCreate, loading }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("general"); // "general" | "project" 
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");

useEffect(() => {
  if (type === "project" && projects.length === 0) {
    setProjectsLoading(true);
    const token = localStorage.getItem("token"); // adjust key if different

    fetch("http://localhost:8080/api/project/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setProjects(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }
}, [type]);

  const handleCreate = () => {
    if (!name.trim()) return;
    if (type === "project" && !selectedProjectId) return;
    onCreate(name.trim(), type, type === "project" ? Number(selectedProjectId) : null);
  };

  const canCreate = name.trim() && (type !== "project" || selectedProjectId) && !loading;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-br from-orange-500 to-amber-400 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold">
            <Users size={18} /> Create New Group
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Group Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Design Team, Project Alpha..."
              className="w-full mt-1 px-3 py-2.5 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Group Type</label>
            <div className="flex gap-2 mt-1">
              {[
                { key: "general", label: "Custom (General)" },
                { key: "project", label: "Project" },
                // { key: "milestone", label: "Milestone" },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setType(opt.key); setSelectedProjectId(""); }}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg border ${
                    type === opt.key
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project dropdown — only when "Project" is selected */}
          {type === "project" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Select Project</label>
              {projectsLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                  <Loader2 size={14} className="animate-spin" /> Loading projects...
                </div>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                >
                  <option value="">-- Choose a project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.project_code} — {p.name}
                    </option>
                  ))}
                </select>
              )}
              {!projectsLoading && projects.length === 0 && (
                <p className="text-xs text-red-400 mt-1">No projects found</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rename Group ──────────────────────────────────────────────────────────────
export function RenameGroupModal({ group, onClose, onRename, loading }) {
  const [name, setName]   = useState(group?.group_name ?? "");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) { setError("Name cannot be empty"); return; }
    onRename(name.trim());
  };

  return (
    <Modal title="Rename Group" icon={Edit2} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            New Group Name
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter new name…"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
              ${error ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white
              text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete Group ──────────────────────────────────────────────────────────────
export function DeleteGroupModal({ group, onClose, onDelete, loading }) {
  return (
    <Modal title="Delete Group" icon={Trash2} onClose={onClose} danger>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <Trash2 size={28} className="text-red-500" />
        </div>
        <div>
          <p className="text-gray-800 font-semibold text-base">Delete "{group?.group_name}"?</p>
          <p className="text-gray-500 text-sm mt-1">
            All messages will be permanently deleted. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onDelete} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white
              text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Member ────────────────────────────────────────────────────────────────
export function AddMemberModal({ group, nonMembers, onClose, onAdd, loading }) {
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = nonMembers.filter((u) =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal title="Add Member" icon={UserPlus} onClose={onClose}>
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm
              bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>

        <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No users available</p>
          )}
          {filtered.map((u) => {
            const name = `${u.first_name} ${u.last_name}`.trim();
            const isSelected = selected?.id === u.id;
            return (
              <div
                key={u.id}
                onClick={() => setSelected(isSelected ? null : u)}
               className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              >
                <Avatar name={name} photo={u.profile_photo} size={9} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                  <p className="text-xs text-gray-400">{u.employee_code || u.email || ""}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${isSelected ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => selected && onAdd(selected.id)}
            disabled={loading || !selected}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white
              text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Adding…" : `Add${selected ? ` ${selected.first_name}` : ""}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Members List ──────────────────────────────────────────────────────────────
export function MembersModal({ group, members, onClose, onRemove, onMakeAdmin, loading }) {
  return (
    <Modal title={`Members (${members.length})`} icon={Users} onClose={onClose}>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {members.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No members found</p>
        )}
        {members.map((u) => {
          const name = `${u.first_name} ${u.last_name}`.trim();
          const memberData = (group.members || []).find(
            (m) => Number(m.user_id) === Number(u.id)
          );
          const role    = memberData?.role ?? "member";
          const isAdmin = role === "admin";

          return (
            <div key={u.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
              <Avatar name={name} photo={u.profile_photo} size={9} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                  {isAdmin && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      <Crown size={9} /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{u.employee_code || u.email || ""}</p>
              </div>
            <div className="flex items-center gap-1">
  {!isAdmin && onMakeAdmin && (
    <button
      onClick={() => onMakeAdmin(u.id)}
      disabled={loading}
      title="Make admin"
      className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-500
        hover:bg-amber-50 transition-colors disabled:opacity-40"
    >
      <Crown size={14} />
    </button>
  )}
  {onRemove && (
    <button
      onClick={() => onRemove(u.id)}
      disabled={loading}
      title="Remove member"
      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400
        hover:bg-red-50 transition-colors disabled:opacity-40"
    >
      <UserMinus size={14} />
    </button>
  )}
</div>
            </div>
          );
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
      >
        Close
      </button>
    </Modal>
  );
}