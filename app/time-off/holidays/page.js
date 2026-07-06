"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  Globe,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const API = "http://localhost:8080/api/holidays";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const TYPE_CONFIG = {
  public: {
    label: "Public",
    icon: Globe,
    badge: "bg-blue-50 text-blue-600 border border-blue-200",
    dot: "bg-blue-500",
  },
  restricted: {
    label: "Restricted",
    icon: Building2,
    badge: "bg-amber-50 text-amber-600 border border-amber-200",
    dot: "bg-amber-500",
  },
  optional: {
    label: "Optional",
    icon: Users,
    badge: "bg-violet-50 text-violet-600 border border-violet-200",
    dot: "bg-violet-500",
  },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDayName = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long" });
};

const toast = (icon, title) => {
  if (typeof window !== "undefined" && window.Swal) {
    window.Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: { popup: "swal-toast-popup" },
    });
  }
};

const confirmDelete = (name) =>
  typeof window !== "undefined" && window.Swal
    ? window.Swal.fire({
        title: "Delete Holiday?",
        html: `<p style="color:#64748b;font-size:14px">You're about to delete <strong style="color:#0f172a">${name}</strong>.<br/>This action cannot be undone.</p>`,
        icon: "warning",
        showConfirmButton: true,
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#94a3b8",
        customClass: { popup: "swal-confirm-popup" },
      })
    : Promise.resolve({ isConfirmed: true });

// ─── Drawer Component ──────────────────────────────────────────────────────────
function HolidayDrawer({ isOpen, onClose, editData, onSuccess }) {
  const isEdit = !!editData;
  const [form, setForm] = useState({
    holiday_name: "",
    start_date: "",
    end_date: "",
    holiday_type: "public",
    description: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setForm({
          holiday_name: editData.holiday_name || "",
          start_date: editData.start_date?.slice(0, 10) || "",
          end_date: editData.end_date?.slice(0, 10) || "",
          holiday_type: editData.holiday_type || "public",
          description: editData.description || "",
          is_active: editData.is_active ?? true,
        });
      } else {
        setForm({
          holiday_name: "",
          start_date: "",
          end_date: "",
          holiday_type: "public",
          description: "",
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, editData]);

  const validate = () => {
    const e = {};
    if (!form.holiday_name.trim()) e.holiday_name = "Holiday name is required";
    if (!form.start_date) e.start_date = "Start date is required";
    if (!form.end_date) e.end_date = "End date is required";
    if (
      form.start_date &&
      form.end_date &&
      new Date(form.start_date) > new Date(form.end_date)
    ) {
      e.end_date = "End date cannot be before start date";
    }
    return e;
  };

  const previewDays =
    form.start_date &&
    form.end_date &&
    new Date(form.start_date) <= new Date(form.end_date)
      ? Math.round(
          (new Date(form.end_date) - new Date(form.start_date)) /
            (1000 * 60 * 60 * 24) +
            1
        )
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const url = isEdit ? `${API}/update/${editData.id}` : `${API}/create`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", isEdit ? "Holiday updated!" : "Holiday created!");
        onSuccess();
        onClose();
      } else {
        toast("error", data.message || "Something went wrong");
      }
    } catch {
      toast("error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full px-4 py-2 rounded-lg border border-gray-200 text-sm transition-all outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white text-gray-800 placeholder:text-gray-400";

  const field = (key, label, placeholder = "") => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setErrors((er) => ({ ...er, [key]: undefined }));
        }}
        placeholder={placeholder}
        className={`${inputBase} ${
          errors[key] ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  const dateField = (key, label) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="date"
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setErrors((er) => ({ ...er, [key]: undefined }));
        }}
        className={`${inputBase} ${
          errors[key] ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] z-50 shadow-2xl
          flex flex-col transition-transform duration-300 ease-out bg-white
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <CalendarDays size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEdit ? "Edit Holiday" : "Add New Holiday"}
              </h2>
              <p className="text-xs text-orange-100 mt-0.5">
                {isEdit
                  ? `Editing: ${editData?.holiday_name}`
                  : "Fill in the details below"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          {field("holiday_name", "Holiday Name", "e.g. Republic Day")}

          <div className="grid grid-cols-2 gap-3">
            {dateField("start_date", "Start Date")}
            {dateField("end_date", "End Date")}
          </div>

          {previewDays !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 border border-orange-100">
              <CalendarRange size={14} className="text-orange-500 shrink-0" />
              <p className="text-xs font-medium text-orange-700">
                Duration:{" "}
                <span className="font-bold">
                  {previewDays} {previewDays === 1 ? "day" : "days"}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Holiday Type
            </label>
            <div className="relative">
              <select
                value={form.holiday_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, holiday_type: e.target.value }))
                }
                className="w-full appearance-none px-4 py-2 rounded-lg border border-gray-200
                  text-sm text-gray-700 bg-white outline-none transition-all
                  focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 cursor-pointer"
              >
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
                <option value="optional">Optional</option>
              </select>
              <ChevronDown
                size={15}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            {(() => {
              const cfg = TYPE_CONFIG[form.holiday_type];
              return (
                <div
                  className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label} Holiday
                </div>
              );
            })()}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Description{" "}
              <span className="text-gray-300 normal-case font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Add a short note about this holiday..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-200
                text-sm text-gray-700 bg-white
                placeholder:text-gray-400
                resize-none outline-none transition-all
                focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Active Status
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {form.is_active
                  ? "This holiday is currently active"
                  : "This holiday is inactive"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() =>
                setForm((f) => ({ ...f, is_active: !f.is_active }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none
                ${form.is_active ? "bg-orange-500" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
                  ${form.is_active ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200
                text-sm font-medium text-gray-600
                hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white
                bg-orange-500 hover:bg-orange-600 transition-all disabled:opacity-60
                flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                <>
                  <Edit2 size={14} />
                  Update Holiday
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Create Holiday
                </>
              )}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

const fetchAllHolidays = useCallback(async () => {
  setLoading(true);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const res = await fetch(`${API}/all`, {
      headers: authHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.success) setHolidays(data.data);
  } catch (err) {
    console.error("Fetch error:", err); // Check browser console
    toast("error", "Failed to load holidays");
  } finally {
    setLoading(false); // This WILL now always run
  }
}, []);


  const fetchHolidaysByYear = useCallback(async (year) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/year/${year}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setHolidays(data.data);
    } catch {
      toast("error", "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHolidays = useCallback(() => {
    if (yearFilter === "all") {
      fetchAllHolidays();
    } else {
      fetchHolidaysByYear(yearFilter);
    }
  }, [yearFilter, fetchAllHolidays, fetchHolidaysByYear]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.Swal) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, yearFilter, typeFilter, statusFilter]);

  const handleDelete = async (holiday) => {
    const result = await confirmDelete(holiday.holiday_name);
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/delete/${holiday.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Holiday deleted successfully");
        fetchHolidays();
      } else {
        toast("error", data.message || "Delete failed");
      }
    } catch {
      toast("error", "Network error");
    }
  };

  const openEdit = (h) => {
    setEditData(h);
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setEditData(null);
    setDrawerOpen(true);
  };

  const years = [
    ...new Set(holidays.map((h) => new Date(h.start_date).getFullYear())),
  ].sort((a, b) => b - a);

  const filtered = holidays.filter((h) => {
    const matchSearch =
      h.holiday_name.toLowerCase().includes(search.toLowerCase()) ||
      (h.description || "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || h.holiday_type === typeFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? h.is_active : !h.is_active);
    return matchSearch && matchType && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    const left = Math.max(2, currentPage - 2);
    const right = Math.min(totalPages - 1, currentPage + 2);
    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const stats = {
    total: holidays.length,
    active: holidays.filter((h) => h.is_active).length,
    public: holidays.filter((h) => h.holiday_type === "public").length,
    thisYear: holidays.filter(
      (h) =>
        new Date(h.start_date).getFullYear() === new Date().getFullYear()
    ).length,
  };

  const SkeletonRow = () => (
    <tr className="border-b border-gray-100">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );

  const selectClass =
    "appearance-none pl-4 pr-8 py-2 rounded-lg border text-sm outline-none transition-all cursor-pointer " +
    "border-gray-200 text-gray-700 bg-white " +
    "focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
                <Sparkles size={18} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Holidays <span className="text-orange-500">Dashboard</span>
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-13">
              Manage public, restricted, and optional holidays across the organization
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-500
              hover:bg-orange-600 text-white text-sm font-semibold shadow-sm
              transition-all active:scale-95"
          >
            <Plus size={16} />
            Add Holiday
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            {
              label: "Total Holidays",
              value: stats.total,
              icon: CalendarDays,
              bg: "bg-blue-50",
              color: "text-blue-600",
            },
            {
              label: "Active",
              value: stats.active,
              icon: CheckCircle,
              bg: "bg-emerald-50",
              color: "text-emerald-600",
            },
            {
              label: "Public Holidays",
              value: stats.public,
              icon: Globe,
              bg: "bg-violet-50",
              color: "text-violet-600",
            },
            {
              label: "This Year",
              value: stats.thisYear,
              icon: CalendarRange,
              bg: "bg-amber-50",
              color: "text-amber-600",
            },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div
              key={label}
              className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {label}
                </p>
                <div
                  className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}
                >
                  <Icon size={16} className={color} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${color}`}>
                {loading ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search holidays by name or description..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200
                  text-sm text-gray-700 bg-white placeholder:text-gray-400
                  outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Types</option>
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
                <option value="optional">Optional</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            <button
              onClick={fetchHolidays}
              className="px-4 py-2 rounded-lg border border-gray-200
                bg-white hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-700">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-700">
                {holidays.length}
              </span>{" "}
              holidays
            </p>
            {(search ||
              yearFilter !== "all" ||
              typeFilter !== "all" ||
              statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setYearFilter("all");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="text-xs text-orange-500 font-semibold hover:underline flex items-center gap-1"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "#",
                    "Holiday Name",
                    "Start Date",
                    "End Date",
                    "Days",
                    "Type",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-16 text-gray-400"
                    >
                      <CalendarDays
                        size={40}
                        className="mx-auto mb-3 opacity-30"
                      />
                      <p className="font-semibold">No holidays found</p>
                      <p className="text-xs mt-1">
                        Try adjusting your filters or add a new holiday
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((h, idx) => {
                    const cfg =
                      TYPE_CONFIG[h.holiday_type] || TYPE_CONFIG.public;
                    const isSingleDay =
                      h.start_date?.slice(0, 10) ===
                      h.end_date?.slice(0, 10);
                    const rowNum =
                      (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                    return (
                      <tr
                        key={h.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                          {rowNum}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">
                            {h.holiday_name}
                          </p>
                          {h.description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                              {h.description}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700">
                            {formatDate(h.start_date)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getDayName(h.start_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isSingleDay ? (
                            <span className="text-xs text-gray-400 italic">
                              Same day
                            </span>
                          ) : (
                            <>
                              <div className="text-gray-700">
                                {formatDate(h.end_date)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {getDayName(h.end_date)}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold border border-orange-100">
                            {h.total_days}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {h.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle size={11} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                              <XCircle size={11} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(h)}
                              className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100
                                flex items-center justify-center transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={13} className="text-orange-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(h)}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100
                                flex items-center justify-center transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={13} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              ))
            ) : paginated.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">No holidays found</p>
              </div>
            ) : (
              paginated.map((h) => {
                const cfg =
                  TYPE_CONFIG[h.holiday_type] || TYPE_CONFIG.public;
                const isSingleDay =
                  h.start_date?.slice(0, 10) === h.end_date?.slice(0, 10);
                return (
                  <div key={h.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">
                          {h.holiday_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isSingleDay
                            ? `${formatDate(h.start_date)} · ${getDayName(h.start_date)}`
                            : `${formatDate(h.start_date)} → ${formatDate(h.end_date)}`}
                        </p>
                        <p className="text-xs text-orange-600 font-semibold mt-0.5">
                          {h.total_days}{" "}
                          {h.total_days === 1 ? "day" : "days"}
                        </p>
                        {h.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {h.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badge}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {cfg.label}
                          </span>
                          {h.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle size={10} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                              <XCircle size={10} /> Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEdit(h)}
                          className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"
                        >
                          <Edit2 size={13} className="text-orange-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(h)}
                          className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"
                        >
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/30">
              <p className="text-xs text-gray-500 order-2 sm:order-1">
                Showing{" "}
                <span className="font-bold text-gray-700">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                –
                <span className="font-bold text-gray-700">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-700">
                  {filtered.length}
                </span>{" "}
                holidays
              </p>

              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border
                    border-gray-200 text-xs font-medium text-gray-600
                    bg-white hover:bg-gray-50
                    disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={13} />
                  Prev
                </button>

                {getPageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="w-8 h-8 flex items-center justify-center text-xs text-gray-400 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150
                        ${
                          currentPage === p
                            ? "bg-orange-500 text-white shadow-sm"
                            : "border border-gray-200 text-gray-600 bg-white hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border
                    border-gray-200 text-xs font-medium text-gray-600
                    bg-white hover:bg-gray-50
                    disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <HolidayDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editData={editData}
        onSuccess={fetchHolidays}
      />
    </div>
  );
}