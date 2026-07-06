"use client";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays, Sun, Moon, RefreshCw } from "lucide-react";

const BASE = "http://localhost:8080";
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const fetchHolidays = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}/api/holidays/all`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
};

const toISO = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Accent colors are intentional brand/semantic colors, not theme tokens —
// they stay the same literal Tailwind colors in both light and dark mode.
const typeColor = (type) => {
  switch (type) {
    case "optional":   return { solid: "bg-sky-600",  badge: "bg-sky-600/10 text-sky-600",  dot: "bg-sky-600" };
    case "restricted": return { solid: "bg-rose-600", badge: "bg-rose-600/10 text-rose-600", dot: "bg-rose-600" };
    default:            return { solid: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500" };
  }
};

function buildHolidayMap(holidays) {
  const map = new Map();
  for (const h of holidays) {
    const start = new Date(h.start_date + "T00:00:00");
    const end = new Date(h.end_date + "T00:00:00");
    let cur = new Date(start);
    while (cur <= end) {
      const key = toISO(cur);
      map.set(key, { holiday: h, isStart: toISO(cur) === h.start_date, isEnd: toISO(cur) === h.end_date });
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

function MonthCard({ year, monthIdx, holidayMap, todayISO, monthHolidays }) {
  const firstDay = new Date(year, monthIdx, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const fmtShort = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{MONTH_NAMES[monthIdx]}</h3>
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">{year}</span>
      </div>

      <div className="p-3">
        {/* Weekday header */}
        <div className="grid grid-cols-7 mb-1.5">
          {DOW.map((d, i) => (
            <div
              key={i}
              className={`text-center text-[10px] font-bold uppercase tracking-wide ${i === 0 ? "text-rose-500" : "text-[var(--text-secondary)]"}`}
            >
              {d[0]}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="aspect-square" />;

            const dateObj = new Date(year, monthIdx, day);
            const iso = toISO(dateObj);
            const entry = holidayMap.get(iso);
            const isToday = iso === todayISO;
            const isSunday = dateObj.getDay() === 0;
            const colors = entry ? typeColor(entry.holiday.holiday_type) : null;

            let rounding = "rounded-md";
            if (entry) {
              if (entry.isStart && entry.isEnd) rounding = "rounded-full";
              else if (entry.isStart) rounding = "rounded-l-full rounded-r-sm";
              else if (entry.isEnd) rounding = "rounded-r-full rounded-l-sm";
              else rounding = "rounded-sm";
            }

            return (
              <div
                key={idx}
                title={entry ? `${entry.holiday.holiday_name} (${entry.holiday.holiday_type})` : isSunday ? "Weekly off" : undefined}
                className={`relative aspect-square flex items-center justify-center text-[11px] font-medium tabular-nums ${rounding} transition-colors
                  ${entry
                    ? `${colors.solid} text-white font-bold`
                    : isSunday
                      ? "text-rose-500 font-semibold"
                      : "text-[var(--text-primary)]"}
                  ${isToday ? "ring-2 ring-orange-500" : ""}
                `}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Holiday names for this month */}
      {monthHolidays.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--border-color)] space-y-1.5">
          {monthHolidays.map((h) => {
            const colors = typeColor(h.holiday_type);
            const rangeLabel = h.start_date === h.end_date
              ? fmtShort(h.start_date)
              : `${fmtShort(h.start_date)} – ${fmtShort(h.end_date)}`;
            return (
              <div key={h.id} className="flex items-start gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                <p className="text-xs text-[var(--text-secondary)] leading-tight">
                  <span className="font-semibold text-[var(--text-primary)]">{rangeLabel}</span>
                  {" — "}{h.holiday_name}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EventCalendar() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dark, setDark] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchHolidays()
      .then(setHolidays)
      .catch((e) => setError(e.message || "Failed to load holidays"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  };

  const holidayMap = useMemo(() => buildHolidayMap(holidays), [holidays]);
  const todayISO = toISO(new Date());

  const holidaysByMonth = useMemo(() => {
    const grouped = Array.from({ length: 12 }, () => []);
    for (const h of holidays) {
      const startYear = Number(h.start_date.slice(0, 4));
      const startMonth = Number(h.start_date.slice(5, 7)) - 1;
      if (startYear === year) grouped[startMonth].push(h);
    }
    grouped.forEach((arr) => arr.sort((a, b) => a.start_date.localeCompare(b.start_date)));
    return grouped;
  }, [holidays, year]);

  const totalThisYear = holidaysByMonth.reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-navbar)] border-b border-[var(--border-color)] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[var(--text-primary)] tracking-tight leading-tight">Holiday Calendar</h1>
              <p className="text-xs text-[var(--text-secondary)]">{totalThisYear} holiday{totalThisYear !== 1 ? "s" : ""} · Sundays marked as weekly off</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-1 py-1">
              <button onClick={() => setYear((y) => y - 1)} className="p-1.5 rounded-md hover:bg-[var(--table-hover)] text-[var(--text-secondary)]">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-[var(--text-primary)] w-12 text-center tabular-nums">{year}</span>
              <button onClick={() => setYear((y) => y + 1)} className="p-1.5 rounded-md hover:bg-[var(--table-hover)] text-[var(--text-secondary)]">
                <ChevronRight size={16} />
              </button>
            </div>

            <button onClick={load} className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--table-hover)] text-[var(--text-secondary)]" title="Refresh">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>

            <button onClick={toggleDark} className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--table-hover)] text-[var(--text-secondary)]" title="Toggle theme">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-5 px-4 py-2.5 rounded-lg bg-rose-600/10 text-rose-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-5 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Public holiday</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-600" /> Optional holiday</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-600" /> Restricted holiday</div>
          <div className="flex items-center gap-1.5"><span className="font-bold text-rose-500">S</span> Sunday (weekly off)</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm ring-2 ring-orange-500" /> Today</div>
        </div>

        {loading && holidays.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-orange-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {MONTH_NAMES.map((_, idx) => (
              <MonthCard
                key={idx}
                year={year}
                monthIdx={idx}
                holidayMap={holidayMap}
                todayISO={todayISO}
                monthHolidays={holidaysByMonth[idx]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}