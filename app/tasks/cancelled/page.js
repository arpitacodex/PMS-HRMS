"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

const API_URL = "http://localhost:8080/api/project-tasks/all-tasks";

// ─── Config ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  Critical: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500", badgeBg: "bg-red-100" },
  High:     { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", dot: "bg-orange-500", badgeBg: "bg-orange-100" },
  Medium:   { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", badgeBg: "bg-amber-100" },
  Low:      { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", badgeBg: "bg-emerald-100" },
};

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
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
  const sz = size === "lg" ? "w-12 h-12 text-lg" : size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  if (user?.profile_photo) {
    return <img src={user.profile_photo} alt={initials} className={`${sz} rounded-full object-cover ring-2 ring-white`} />;
  }
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ring-2 ring-white ${getAvatarColor(user?.id)}`}>
      {initials || "?"}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? { bg: "bg-gray-50 border-gray-200", text: "text-gray-600", dot: "bg-gray-400", badgeBg: "bg-gray-100" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {priority}
    </span>
  );
}

function CancelledBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-600">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Cancelled
    </span>
  );
}

function ViewButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      View
    </button>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {[40, 55, 45, 38, 30, 25, 20].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className={`h-4 bg-slate-200 rounded`} style={{ width: `${w}%` }} />
         </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse shadow-sm">
      <div className="flex justify-between">
        <div className="h-5 w-24 bg-slate-200 rounded-lg" />
        <div className="h-5 w-16 bg-slate-200 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-slate-200 rounded" />
      <div className="h-3 w-full bg-slate-100 rounded" />
      <div className="h-3 w-5/6 bg-slate-100 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-16 bg-slate-200 rounded-full" />
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel - cleaner white mode design */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] flex flex-col bg-white shadow-2xl border-l border-slate-200 animate-slide-in">

        {/* Drawer Header - clean minimal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-mono font-semibold text-slate-400">{task.task_number}</span>
              <p className="text-xs text-slate-500">Task details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Body - improved spacing */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Title & description */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-3 leading-tight">{task.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">{task.description || "No description provided."}</p>
          </div>

          {/* Status & Priority row */}
          <div className="flex flex-wrap gap-2">
            <CancelledBadge />
            <PriorityBadge priority={task.priority} />
          </div>

          {/* Info grid - cleaner cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: (
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                ),
                label: "Project",
                value: task.project?.name ?? "—",
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                label: "Start Date",
                value: formatDate(task.start_date),
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                label: "Due Date",
                value: formatDate(task.due_date),
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                label: "Duration",
                value: task.start_date && task.due_date ? dateDiff(task.start_date, task.due_date) : "—",
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                  {icon}
                  <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Assignee - cleaner card */}
          {task.assignee && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Assignee
              </p>
              <div className="flex items-center gap-3">
                <Avatar user={task.assignee} size="lg" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {task.assignee.first_name} {task.assignee.last_name}
                  </p>
                  <p className="text-xs text-slate-400">ID: #{task.assignee.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Creator */}
          {task.creator && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Created by
              </p>
              <div className="flex items-center gap-3">
                <Avatar user={task.creator} size="md" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {task.creator.first_name} {task.creator.last_name}
                  </p>
                  <p className="text-xs text-slate-400">ID: #{task.creator.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation banner - subtle warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700">Task Cancelled</p>
              <p className="text-xs text-amber-600/80 mt-0.5">This task has been cancelled and will not be completed.</p>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-5 border-t border-slate-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-colors"
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

export default function CancelledTasksPage() {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [projectFilter, setProjectFilter]   = useState("All");
  const [selectedTask, setSelectedTask]     = useState(null);

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

      const cancelled = (json.data ?? []).filter((t) => t.status === "cancelled");
      setTasks(cancelled);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const priorities = useMemo(() => ["All", ...new Set(tasks.map((t) => t.priority).filter(Boolean))], [tasks]);
  const projects   = useMemo(() => ["All", ...new Set(tasks.map((t) => t.project?.name).filter(Boolean))], [tasks]);

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
      const matchProject  = projectFilter  === "All" || t.project?.name === projectFilter;
      return matchSearch && matchPriority && matchProject;
    });
  }, [tasks, search, priorityFilter, projectFilter]);

  const hasFilters = search || priorityFilter !== "All" || projectFilter !== "All";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">
                Cancelled <span className="text-red-500">Tasks</span>
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                All cancelled project tasks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {tasks.length} cancelled
              </span>
            )}
            <button
              onClick={fetchTasks}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search task, assignee, project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition min-w-[140px]"
            >
              {priorities.map((p) => <option key={p} value={p}>{p === "All" ? "All Priorities" : p}</option>)}
            </select>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition min-w-[160px]"
            >
              {projects.map((p) => <option key={p} value={p}>{p === "All" ? "All Projects" : p}</option>)}
            </select>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setPriorityFilter("All"); setProjectFilter("All"); }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Result bar ── */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-red-500 rounded-full" />
          <span className="font-semibold text-slate-700 dark:text-white">Cancelled Tasks</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            {loading ? "..." : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700">Failed to load tasks</p>
              <p className="text-xs text-red-500 truncate">{error}</p>
            </div>
            <button onClick={fetchTasks} className="text-xs font-semibold text-red-600 underline whitespace-nowrap">Retry</button>
          </div>
        )}

        {/* ── Desktop Table ── */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Task #", "Title", "Project", "Assignee", "Priority", "Due Date", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <svg className="w-14 h-14 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-medium">No cancelled tasks found</p>
                          {hasFilters && <p className="text-xs">Try clearing the filters</p>}
                        </div>
                      </td>
                    </tr>
                  )
                  : filtered.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-50 hover:bg-red-50/30 transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                          {task.task_number}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <p className="text-sm font-semibold text-slate-700 truncate">{task.title}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                          {task.project?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar user={task.assignee} size="sm" />
                            <span className="text-xs text-slate-600 whitespace-nowrap">
                              {task.assignee.first_name} {task.assignee.last_name}
                            </span>
                          </div>
                        ) : <span className="text-xs text-slate-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(task.due_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <ViewButton onClick={() => setSelectedTask(task)} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile / Tablet Cards ── */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div className="col-span-2 py-16 flex flex-col items-center gap-3 text-slate-400">
                <svg className="w-14 h-14 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">No cancelled tasks found</p>
                {hasFilters && <p className="text-xs">Try clearing the filters</p>}
              </div>
            )
            : filtered.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-red-200 hover:shadow-md transition-all flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                    {task.task_number}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-700 line-clamp-2 mb-1">{task.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-xs text-slate-500 font-medium truncate">{task.project?.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <CancelledBadge />
                  <span className="text-xs text-slate-400">{formatDate(task.due_date)}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar user={task.assignee} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-600">
                          {task.assignee.first_name} {task.assignee.last_name}
                        </p>
                        <p className="text-[10px] text-slate-400">Assignee</p>
                      </div>
                    </div>
                  ) : <span className="text-xs text-slate-400">Unassigned</span>}

                  <ViewButton onClick={() => setSelectedTask(task)} />
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        {!loading && !error && filtered.length > 0 && (
          <p className="text-center text-xs text-slate-400 mt-6">
            Showing {filtered.length} of {tasks.length} cancelled task{tasks.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Drawer ── */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}