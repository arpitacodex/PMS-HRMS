"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

const API_URL = "http://localhost:8080/api/project-tasks/all-tasks";

// ─── Config ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  Critical: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", border: "border-red-200" },
  High:     { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500", border: "border-orange-200" },
  Medium:   { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", border: "border-amber-200" },
  Low:      { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", border: "border-emerald-200" },
};

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-indigo-100 text-indigo-600",
  "bg-rose-100 text-rose-600",
  "bg-cyan-100 text-cyan-600",
];

// ─── Helpers ───────────────────────────────────────────────────────────────

const getAvatarColor = (id) => AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];

const formatDate = (str) => {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const dateDiff = (a, b) => {
  const diff = Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  return `${diff}d duration`;
};

// ─── Sub-components ────────────────────────────────────────────────────────

function Avatar({ user, size = "sm" }) {
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();
  const sz = size === "lg" ? "w-11 h-11 text-base" : size === "md" ? "w-8 h-8 text-sm" : "w-6 h-6 text-xs";
  if (user?.profile_photo) {
    return <img src={user.profile_photo} alt={initials} className={`${sz} rounded-full object-cover ring-2 ring-white`} />;
  }
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-medium flex-shrink-0 ring-2 ring-white ${getAvatarColor(user?.id)}`}>
      {initials || "?"}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400", border: "border-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
}

function InProgressBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 border border-blue-200 text-blue-600">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      In Progress
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      {[40, 55, 45, 38, 30, 25, 20].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-200 rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 animate-pulse shadow-sm">
      <div className="flex justify-between">
        <div className="h-5 w-24 bg-gray-200 rounded-lg" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded" />
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-5/6 bg-gray-100 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

// ─── Drawer ────────────────────────────────────────────────────────────────

function TaskDrawer({ task, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!task) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-slide-in">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                {task.task_number}
              </span>
              <p className="text-xs text-gray-400 mt-1">Task Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{task.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <InProgressBadge />
            <PriorityBadge priority={task.priority} />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide">Project</span>
              </div>
              <p className="text-sm font-semibold text-gray-700 truncate">{task.project?.name ?? "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide">Start Date</span>
              </div>
              <p className="text-sm font-semibold text-gray-700 truncate">{formatDate(task.start_date)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide">Due Date</span>
              </div>
              <p className="text-sm font-semibold text-gray-700 truncate">{formatDate(task.due_date)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide">Duration</span>
              </div>
              <p className="text-sm font-semibold text-gray-700 truncate">
                {task.start_date && task.due_date ? dateDiff(task.start_date, task.due_date) : "—"}
              </p>
            </div>
          </div>

          {/* Assignee */}
          {task.assignee && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Assignee
              </p>
              <div className="flex items-center gap-3">
                <Avatar user={task.assignee} size="lg" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {task.assignee.first_name} {task.assignee.last_name}
                  </p>
                  <p className="text-xs text-gray-400">ID: #{task.assignee.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Creator */}
          {task.creator && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Created by
              </p>
              <div className="flex items-center gap-3">
                <Avatar user={task.creator} size="md" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {task.creator.first_name} {task.creator.last_name}
                  </p>
                  <p className="text-xs text-gray-400">ID: #{task.creator.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* In Progress banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">In Progress</p>
              <p className="text-xs text-blue-600/80 mt-0.5">This task is currently being worked on.</p>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.25s cubic-bezier(0.4,0,0.2,1) both; }
      `}</style>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function InProgressTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401) throw new Error("Unauthorized — please log in again.");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Failed to fetch tasks");

      // Filter only In Progress tasks
      const inProgressTasks = (json.data ?? []).filter((t) => t.status === "in_progress");
      setTasks(inProgressTasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const priorities = useMemo(() => ["All", ...new Set(tasks.map((t) => t.priority).filter(Boolean))], [tasks]);
  const projects = useMemo(() => ["All", ...new Set(tasks.map((t) => t.project?.name).filter(Boolean))], [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.title?.toLowerCase().includes(q) ||
        t.task_number?.toLowerCase().includes(q) ||
        t.assignee?.first_name?.toLowerCase().includes(q) ||
        t.assignee?.last_name?.toLowerCase().includes(q) ||
        t.project?.name?.toLowerCase().includes(q);
      const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
      const matchProject = projectFilter === "All" || t.project?.name === projectFilter;
      return matchSearch && matchPriority && matchProject;
    });
  }, [tasks, search, priorityFilter, projectFilter]);

  const hasFilters = search || priorityFilter !== "All" || projectFilter !== "All";

  const ViewButton = ({ task }) => (
    <button
      onClick={() => setSelectedTask(task)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      View
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                In <span className="text-blue-500">Progress</span> Tasks
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                All tasks currently in progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!loading && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {tasks.length} in progress
              </span>
            )}
            <button
              onClick={fetchTasks}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search task, assignee, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {priorities.map((p) => <option key={p} value={p}>{p === "All" ? "All Priorities" : p}</option>)}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {projects.map((p) => <option key={p} value={p}>{p === "All" ? "All Projects" : p}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setPriorityFilter("All"); setProjectFilter("All"); }}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Section Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700">In Progress Tasks</h2>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Failed to load tasks</p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
            <button onClick={fetchTasks} className="text-sm font-medium text-red-600 underline">Retry</button>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">TASK #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">TITLE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PROJECT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ASSIGNEE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PRIORITY</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">DUE DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="text-sm">No in-progress tasks found</p>
                        {hasFilters && <p className="text-xs">Try clearing the filters</p>}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((task) => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {task.task_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">{task.project?.name || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar user={task.assignee} size="sm" />
                            <span className="text-sm text-gray-700">
                              {task.assignee.first_name} {task.assignee.last_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDate(task.due_date)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ViewButton task={task} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <div className="col-span-2 py-12 flex flex-col items-center gap-2 text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-sm">No in-progress tasks found</p>
            </div>
          ) : (
            filtered.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {task.task_number}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">{task.title}</h3>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-xs text-gray-500">{task.project?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Avatar user={task.assignee} size="sm" />
                    <span className="text-xs text-gray-600">
                      {task.assignee?.first_name} {task.assignee?.last_name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatDate(task.due_date)}</span>
                    <ViewButton task={task} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!loading && !error && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Showing {filtered.length} of {tasks.length} in-progress task{tasks.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Drawer */}
      {selectedTask && <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}