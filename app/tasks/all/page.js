"use client";

import { useState, useEffect, useMemo } from "react";

const API_URL = "http://localhost:8080/api/project-tasks/all-tasks";

const PRIORITY_CONFIG = {
  Critical: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", border: "border-red-200" },
  High:     { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500", border: "border-orange-200" },
  Medium:   { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", border: "border-amber-200" },
  Low:      { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", border: "border-emerald-200" },
};

const STATUS_CONFIG = {
  Pending:     { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", label: "Pending" },
  In_Progress: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", label: "In Progress" },
  Bug:         { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "Bug" },
  Done:        { bg: "bg-green-50", text: "text-green-600", border: "border-green-200", label: "Done" },
  Completed:   { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", label: "Completed" },
  Cancelled:   { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", label: "Cancelled" },
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

function getAvatarColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function Avatar({ user, size = "sm" }) {
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  if (user.profile_photo) {
    return (
      <img src={user.profile_photo} alt={initials}
        className={`${sz} rounded-full object-cover ring-2 ring-white`} />
    );
  }
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-medium ring-2 ring-white ${getAvatarColor(user.id)}`}>
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

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", label: status };
  const label = cfg.label ?? status.replace("_", " ");
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-200 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
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

export default function AllTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to fetch");
      setTasks(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const priorities = useMemo(() => ["All", ...new Set(tasks.map((t) => t.priority).filter(Boolean))], [tasks]);
  const statuses   = useMemo(() => ["All", ...new Set(tasks.map((t) => t.status).filter(Boolean))], [tasks]);
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
      const matchStatus   = statusFilter   === "All" || t.status   === statusFilter;
      const matchProject  = projectFilter  === "All" || t.project?.name === projectFilter;
      return matchSearch && matchPriority && matchStatus && matchProject;
    });
  }, [tasks, search, priorityFilter, statusFilter, projectFilter]);

  function clearFilters() {
    setSearch("");
    setPriorityFilter("All");
    setStatusFilter("All");
    setProjectFilter("All");
  }

  const hasActiveFilters = search || priorityFilter !== "All" || statusFilter !== "All" || projectFilter !== "All";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              All <span className="text-orange-500">Tasks</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage all project tasks, priorities and assignments
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
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

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, task number, assignee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
              />
            </div>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 transition min-w-[130px]"
            >
              {priorities.map((p) => <option key={p} value={p}>{p === "All" ? "All Priorities" : p}</option>)}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 transition min-w-[130px]"
            >
              {statuses.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s.replace("_", " ")}</option>)}
            </select>

            {/* Project */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 transition min-w-[150px]"
            >
              {projects.map((p) => <option key={p} value={p}>{p === "All" ? "All Projects" : p}</option>)}
            </select>

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Result count ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full" />
            <span className="font-semibold text-gray-700">All Tasks</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {loading ? "..." : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-700">Failed to load tasks</p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
            <button onClick={fetchTasks} className="ml-auto text-xs font-medium text-red-600 underline">Retry</button>
          </div>
        )}

        {/* ── Desktop Table ── */}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">DUE DATE</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-sm">No tasks found</p>
                          {hasActiveFilters && <p className="text-xs">Try clearing the filters</p>}
                        </div>
                      </td>
                    </tr>
                  )
                  : filtered.map((task) => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      {/* Task # */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          {task.task_number}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {task.description}
                        </p>
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">
                          {task.project?.name || "—"}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar user={task.assignee} size="sm" />
                            <span className="text-sm text-gray-700 whitespace-nowrap">
                              {task.assignee.first_name} {task.assignee.last_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>

                      {/* Status */}
                      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>

                      {/* Due Date */}
                      <td className="px-4 py-3">
                        <span className={`text-sm ${isOverdue(task.due_date) ? "text-red-500 font-medium" : "text-gray-600"}`}>
                          {isOverdue(task.due_date) && <span className="mr-1">⚠</span>}
                          {formatDate(task.due_date)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile / Tablet Card Grid ── */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div className="col-span-2 py-16 flex flex-col items-center gap-2 text-gray-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No tasks found</p>
                {hasActiveFilters && <p className="text-xs">Try clearing the filters</p>}
              </div>
            )
            : filtered.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {task.task_number}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
                  {task.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                  {task.description}
                </p>

                {/* Project */}
                <div className="flex items-center gap-1.5 mb-3">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-xs text-gray-600 font-medium truncate">
                    {task.project?.name || "—"}
                  </span>
                </div>

                {/* Status & Due */}
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={task.status} />
                  <span className={`text-xs ${isOverdue(task.due_date) ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {isOverdue(task.due_date) && "⚠ "}{formatDate(task.due_date)}
                  </span>
                </div>

                {/* Assignee */}
                {task.assignee && (
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Avatar user={task.assignee} size="sm" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">
                        {task.assignee.first_name} {task.assignee.last_name}
                      </p>
                      <p className="text-[10px] text-gray-400">Assignee</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* ── Footer count ── */}
        {!loading && !error && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Showing {filtered.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}