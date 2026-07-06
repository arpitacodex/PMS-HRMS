"use client";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp, DollarSign, Briefcase, Users, CheckSquare, Calendar,
  ChevronRight, RefreshCw, AlertCircle, Loader2, Receipt, UserCheck,
  UserX, Shield, Laptop, Package, Tag, Star, Award, BarChart2,
  Target, Activity, Zap, Bell
} from "lucide-react";

const BASE = "http://localhost:8080/api";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

async function apiFetch(path) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
// ══ NOTIFICATIONS ══
// Add this state at the top with your other states:
// const [notifications, setNotifications] = useState(initState);
// const [unreadCount, setUnreadCount]     = useState(0);
// And add to loadAll():
// load("/notifications/", setNotifications);

// ── Helper (add near your other helpers) ──
function timeAgo(val) {
  if (!val) return "—";
  const diff = Date.now() - new Date(val);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function notifIcon(type = "") {
  const t = type.toLowerCase();
  if (t.includes("leave"))   return { icon: Calendar,   bg: "bg-amber-50",   color: "text-amber-500"  };
  if (t.includes("claim"))   return { icon: Receipt,    bg: "bg-purple-50",  color: "text-purple-500" };
  if (t.includes("task"))    return { icon: CheckSquare, bg: "bg-blue-50",   color: "text-blue-500"   };
  if (t.includes("asset"))   return { icon: Laptop,     bg: "bg-teal-50",    color: "text-teal-500"   };
  if (t.includes("project")) return { icon: Briefcase,  bg: "bg-indigo-50",  color: "text-indigo-500" };
  if (t.includes("deal"))    return { icon: DollarSign, bg: "bg-emerald-50", color: "text-emerald-500"};
  return                            { icon: Bell,        bg: "bg-gray-100",   color: "text-gray-500"   };
}

function safeStr(val) {
  if (val == null) return "—";
  if (typeof val === "object") return String(val.name ?? val.display_name ?? val.label ?? val.title ?? "");
  return String(val);
}

function extractArray(data, keys = []) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of keys) { if (Array.isArray(data[k])) return data[k]; }
  for (const v of Object.values(data)) { if (Array.isArray(v)) return v; }
  return [];
}

function formatINR(val) {
  const num = Number(val);
  if (isNaN(num)) return "—";
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function fmtDate(val, opts = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-IN", opts);
}

function employeeName(u) {
  if (!u) return "—";
  const full = `${safeStr(u.first_name)} ${safeStr(u.last_name)}`.trim();
  return full || safeStr(u.name) || safeStr(u.email) || "—";
}

// ── Hooks ──
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function useAnim(active, duration = 900) {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null, raf;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setProg(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, duration]);
  return prog;
}

function useCountUp(target, duration = 1100) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target == null || isNaN(Number(target))) return;
    const num = Number(target);
    let start = null, raf;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * num));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return count;
}

// ── Primitives ──
function Spinner({ size = 16 }) { return <Loader2 size={size} className="animate-spin text-gray-400" />; }
function ErrorBadge({ msg }) {
  return <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{msg || "Failed"}</span>;
}

function AnimCount({ value }) {
  const n = useCountUp(typeof value === "number" ? value : null);
  if (typeof value !== "number") return <span>{value}</span>;
  return <span>{n.toLocaleString("en-IN")}</span>;
}

const STATUS_STYLES = {
  active:"bg-emerald-50 text-emerald-600 border border-emerald-200",available:"bg-emerald-50 text-emerald-600 border border-emerald-200",
  delivered:"bg-emerald-50 text-emerald-600 border border-emerald-200",pending:"bg-amber-50 text-amber-600 border border-amber-200",
  approved:"bg-emerald-50 text-emerald-600 border border-emerald-200",inprogress:"bg-blue-50 text-blue-600 border border-blue-200",
  progress:"bg-blue-50 text-blue-600 border border-blue-200",completed:"bg-teal-50 text-teal-600 border border-teal-200",
  cancelled:"bg-red-50 text-red-500 border border-red-200",inactive:"bg-red-50 text-red-500 border border-red-200",
  rejected:"bg-red-50 text-red-500 border border-red-200",paid:"bg-purple-50 text-purple-600 border border-purple-200",
  bug:"bg-rose-50 text-rose-600 border border-rose-200",review:"bg-indigo-50 text-indigo-600 border border-indigo-200",
  admin:"bg-blue-50 text-blue-700 border border-blue-200",employee:"bg-gray-50 text-gray-600 border border-gray-200",
  won:"bg-emerald-50 text-emerald-600 border border-emerald-200",lost:"bg-red-50 text-red-500 border border-red-200",
  qualified:"bg-blue-50 text-blue-600 border border-blue-200",new:"bg-sky-50 text-sky-600 border border-sky-200",
  submitted:"bg-violet-50 text-violet-600 border border-violet-200",open:"bg-orange-50 text-orange-500 border border-orange-200",
  assigned:"bg-blue-50 text-blue-600 border border-blue-200",underrepair:"bg-amber-50 text-amber-600 border border-amber-200",
  under_repair:"bg-amber-50 text-amber-600 border border-amber-200",disposed:"bg-gray-100 text-gray-500 border border-gray-200",
};
function StatusPill({ status }) {
  const s = safeStr(status);
  const key = s.toLowerCase().replace(/[\s_-]+/g, "");
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize whitespace-nowrap ${STATUS_STYLES[key] || "bg-gray-100 text-gray-600"}`}>{s || "—"}</span>;
}

function Avatar({ name = "?", photo, size = 8 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  if (photo) return <img src={photo} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />;
  const colors = ["#405189","#0ab39c","#f7b84b","#f06548","#7c3aed","#0891b2"];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}
      style={{ background: color, minWidth: size * 4, minHeight: size * 4 }}>{initials}</div>
  );
}

// ── Animated Charts ──
function AnimSparkline({ data = [], color = "#0ab39c", width = 80, height = 32 }) {
  const [ref, inView] = useInView();
  const prog = useAnim(inView, 800);
  if (data.length < 2) return <div ref={ref} />;
  const visible = Math.max(2, Math.round(prog * data.length));
  const slice = data.slice(0, visible);
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = slice.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const last = slice[slice.length - 1];
  const lx = ((slice.length - 1) / (data.length - 1)) * width;
  const ly = height - ((last - min) / range) * (height - 4) - 2;
  return (
    <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  );
}

function AnimDonut({ segments = [], size = 120, thickness = 22, center }) {
  const [ref, inView] = useInView();
  const prog = useAnim(inView);
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0) || 1;
  let offset = 0;
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ * prog;
        const el = <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={seg.color}
          strokeWidth={thickness} strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-offset * prog} transform={`rotate(-90 ${size/2} ${size/2})`} />;
        offset += (seg.value / total) * circ;
        return el;
      })}
      <text x={size/2} y={size/2 - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill="#1f2937">{center ?? total}</text>
      <text x={size/2} y={size/2 + 13} textAnchor="middle" fontSize="9" fill="#9ca3af">Total</text>
    </svg>
  );
}

function AnimBar({ data = [], colors = [], height = 120 }) {
  const [ref, inView] = useInView();
  const prog = useAnim(inView, 800);
  if (!data.length) return <div ref={ref} />;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const W = 300, padB = 28, barW = Math.min(36, (W / data.length) * 0.52), gap = W / data.length;
  return (
    <svg ref={ref} width="100%" viewBox={`0 0 ${W} ${height + padB}`} style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const barH = Math.max((d.value / maxVal) * height * prog, 0);
        const x = i * gap + gap / 2 - barW / 2;
        return (
          <g key={i}>
            <rect x={x} y={height - barH} width={barW} height={barH} rx="4" fill={colors[i % colors.length]} opacity="0.88" />
            <text x={x + barW/2} y={height + 18} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.label}</text>
            {d.value > 0 && prog > 0.6 && (
              <text x={x + barW/2} y={height - barH - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#374151"
                style={{ opacity: (prog - 0.6) * 2.5 }}>{d.value}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function AnimHBar({ label, value, max, color, suffix = "%" }) {
  const [ref, inView] = useInView();
  const prog = useAnim(inView);
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div ref={ref} className="mb-3">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600 truncate max-w-[60%]">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{value}{suffix}</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct * prog}%`, background: color }} />
      </div>
    </div>
  );
}

function AnimScoreRing({ score = 0, size = 52, color = "#0ab39c" }) {
  const [ref, inView] = useInView();
  const prog = useAnim(inView, 1000);
  const r = (size - 8) / 2, circ = 2 * Math.PI * r;
  const dash = (Math.min(score, 100) / 100) * circ * prog;
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1f2937">{score}</text>
    </svg>
  );
}

const REVENUE_DATA = {
  ALL: { bars:[86,67,100,81,63,88,43,78,90,55,72,88], line:[40,55,45,60,48,65,38,58,70,45,60,72], labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] },
  "1M":{ bars:[55,70,60,80,75,90,65], line:[40,50,45,55,48,60,43], labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
  "6M":{ bars:[60,75,80,90,70,85], line:[42,55,58,68,52,65], labels:["Jul","Aug","Sep","Oct","Nov","Dec"] },
  "1Y":{ bars:[86,67,100,81,63,88,43,78,90,55,72,88], line:[40,55,45,60,48,65,38,58,70,45,60,72], labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] },
};

function AnimRevenueChart({ period }) {
  const [prog, setProg] = useState(0);
  const [lp, setLp] = useState(0);
  useEffect(() => {
    setProg(0); setLp(0);
    let start = null, raf;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setProg(1 - Math.pow(1 - p, 3));
      if (p < 1) { raf = requestAnimationFrame(step); } else {
        let ls = null;
        const ls2 = (ts2) => { if (!ls) ls = ts2; const lpp = Math.min((ts2 - ls) / 600, 1); setLp(lpp); if (lpp < 1) requestAnimationFrame(ls2); };
        requestAnimationFrame(ls2);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [period]);

  const { bars, line, labels } = REVENUE_DATA[period];
  const max = 120, W = 640, H = 200, padL = 44, padR = 8, padT = 8, padB = 28;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const n = bars.length, gap = chartW / n, barW = Math.min(26, gap * 0.45);
  const toX = i => padL + i * gap + gap / 2;
  const toY = v => padT + chartH - (v / max) * chartH;
  const visLine = Math.max(1, Math.round(lp * line.length));
  const pts = line.slice(0, visLine).map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
      {[0,40,80,120].map(t => (
        <g key={t}>
          <line x1={padL} y1={toY(t)} x2={W-padR} y2={toY(t)} stroke="#f3f4f6" strokeWidth="1" />
          <text x={padL-5} y={toY(t)+4} textAnchor="end" fontSize="9" fill="#9ca3af">{t}</text>
        </g>
      ))}
      {bars.map((v, i) => {
        const barH = (v / max) * chartH * prog;
        return <rect key={i} x={toX(i)-barW/2} y={toY(v*prog)} width={barW} height={barH} rx="3" fill="#0ab39c" opacity="0.85" />;
      })}
      {visLine > 1 && <polyline fill="none" stroke="#405189" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />}
      {line.slice(0, visLine).map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill="#fff" stroke="#405189" strokeWidth="2" />)}
      {labels.map((l, i) => <text key={i} x={toX(i)} y={H-4} textAnchor="middle" fontSize="9" fill="#9ca3af">{l}</text>)}
    </svg>
  );
}

function LegendRow({ items }) {
  return (
    <div className="flex flex-wrap gap-3 mb-2">
      {items.map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />{label}
        </span>
      ))}
    </div>
  );
}

function Card({ className = "", children, delay = 0 }) {
  const [ref, inView] = useInView(0.05);
  return (
    <div ref={ref} className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
      style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

function CardHeader({ title, icon: Icon, iconColor, action }) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-50">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} className={iconColor || "text-gray-400"} />}
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      {action && <div className="flex-shrink-0 ml-2">{action}</div>}
    </div>
  );
}

const PERF_DATA = [
  { name:"Engineering", score:88, tasks:42, completed:37, color:"#405189" },
  { name:"Sales",       score:74, tasks:28, completed:21, color:"#0ab39c" },
  { name:"Design",      score:82, tasks:19, completed:16, color:"#7c3aed" },
  { name:"HR",          score:79, tasks:23, completed:18, color:"#f7b84b" },
  { name:"Operations",  score:91, tasks:35, completed:32, color:"#0891b2" },
];
const TOP_PERFORMERS = [
  { name:"Rahul Dev Patra", role:"Admin",       score:94, tasks:18, color:"#405189" },
  { name:"Rintu Dutta",     role:"Project Mgr", score:88, tasks:14, color:"#0ab39c" },
  { name:"Ayan Mandal",     role:"Employee",    score:81, tasks:12, color:"#7c3aed" },
  { name:"Rahul Sharma",    role:"Employee",    score:76, tasks:10, color:"#f7b84b" },
];

const initState = () => ({ data: null, loading: true, error: null });

export default function Dashboard() {
  const [period, setPeriod] = useState("ALL");
  const [projects,    setProjects]    = useState(initState);
  const [employees,   setEmployees]   = useState(initState);
  const [tasks,       setTasks]       = useState(initState);
  const [bids,        setBids]        = useState(initState);
  const [leads,       setLeads]       = useState(initState);
  const [deals,       setDeals]       = useState(initState);
  const [leaves,      setLeaves]      = useState(initState);
  const [claims,      setClaims]      = useState(initState);
  const [holidays,    setHolidays]    = useState(initState);
  const [notices,     setNotices]     = useState(initState);
  const [assets,      setAssets]      = useState(initState);
  const [assetCats,   setAssetCats]   = useState(initState);
  const [assignments, setAssignments] = useState(initState);
  const [leaveTypeMap, setLeaveTypeMap] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState(initState);
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try { setCurrentUser(jwtDecode(token)); } catch {}
  }, []);

  useEffect(() => {
    apiFetch("/leave-types/").then(res => {
      const arr = extractArray(res, ["data","leaveTypes","items"]);
      const map = {}; arr.forEach(lt => { map[lt.id] = lt.name; }); setLeaveTypeMap(map);
    }).catch(() => {});
  }, []);

  const load = useCallback(async (path, setter) => {
    setter(p => ({ ...p, loading: true, error: null }));
    try { setter({ data: await apiFetch(path), loading: false, error: null }); }
    catch (e) { setter({ data: null, loading: false, error: e.message }); }
  }, []);

  const loadAll = useCallback(() => {
    load("/project/all", setProjects);
    load("/auth/all", setEmployees);
    load("/project-tasks/all-tasks", setTasks);
    load("/bid/all", setBids);
    load("/lead/all", setLeads);
    load("/deal/all", setDeals);
    load("/leaves/", setLeaves);
    load("/claims/", setClaims);
    load("/holidays/all", setHolidays);
    load("/notices/", setNotices);
    load("/notices/", setNotices);
    load("/notifications/", setNotifications);  // ← add this   
    load("/assets/", setAssets);
    load("/asset-categories/", setAssetCats);
    load("/assets-assignments/", setAssignments);
  }, [load]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const employeeArr   = extractArray(employees.data,   ["users","data","employees"]);
  const loggedInUser  = employeeArr.find(u => u.id === currentUser?.id || u.email === currentUser?.email);
  const projectArr    = extractArray(projects.data,    ["data","projects","items"]);
  const taskArr       = extractArray(tasks.data,       ["data","tasks","items"]);
  const bidArr        = extractArray(bids.data,        ["bids"]);
  const leadArr       = extractArray(leads.data,       ["data"]);
  const dealArr       = extractArray(deals.data,       ["deals"]);
  const leaveArr      = extractArray(leaves.data,      ["data","leaves","items"]);
  const claimArr      = extractArray(claims.data,      ["data","claims","items"]);
  const holidayArr    = extractArray(holidays.data,    ["data","holidays","items"]);
  const noticeArr     = extractArray(notices.data,     ["data","notices","items"]);
  const assetArr      = extractArray(assets.data,      ["data","assets","items"]);
  const assetCatArr   = extractArray(assetCats.data,   ["data","categories","items"]);
  const assignmentArr = extractArray(assignments.data, ["data","assignments","items"]);

  const byStatus = (arr, s) => arr.filter(i => safeStr(i.status).toLowerCase() === s.toLowerCase());
  const activeEmp    = byStatus(employeeArr, "active");
  const inactiveEmp  = byStatus(employeeArr, "inactive");
  const adminUsers   = employeeArr.filter(u => u.roles?.some(r => safeStr(r.name) === "admin"));
  const regularEmps  = employeeArr.filter(u => u.roles?.some(r => safeStr(r.name) === "employee"));

  const pc = { all: projectArr.length, completed: byStatus(projectArr,"completed").length, cancelled: byStatus(projectArr,"cancelled").length, get active() { return this.all-this.completed-this.cancelled; } };
  const tc = { all: taskArr.length, completed: byStatus(taskArr,"completed").length, cancelled: byStatus(taskArr,"cancelled").length, bug: byStatus(taskArr,"bug").length, review: byStatus(taskArr,"review").length, progress: byStatus(taskArr,"in_progress").length, get open() { return taskArr.filter(t=>!["completed","cancelled"].includes(safeStr(t.status).toLowerCase())).length; } };
  const lc = { all: leaveArr.length, pending: byStatus(leaveArr,"pending").length, approved: byStatus(leaveArr,"approved").length, rejected: byStatus(leaveArr,"rejected").length, cancelled: byStatus(leaveArr,"cancelled").length };
  const cc = { all: claimArr.length, pending: byStatus(claimArr,"pending").length, approved: byStatus(claimArr,"approved").length, rejected: byStatus(claimArr,"rejected").length, paid: byStatus(claimArr,"paid").length };
  const ac = {
    all: assetArr.length, assigned: byStatus(assetArr,"assigned").length, available: byStatus(assetArr,"available").length,
    underRepair: assetArr.filter(a=>["under_repair","underrepair","under repair"].includes(safeStr(a.status).toLowerCase())).length,
    disposed: byStatus(assetArr,"disposed").length,
    totalValue: assetArr.reduce((s,a)=>s+(Number(a.current_value)||0),0),
    purchaseCost: assetArr.reduce((s,a)=>s+(Number(a.purchase_cost)||0),0),
  };
  const assetsByCat  = assetCatArr.map((cat,idx) => ({ name:cat.name, count:assetArr.filter(a=>a.category_id===cat.id).length, rate:cat.depreciation_rate, color:["#405189","#0ab39c","#f7b84b","#f06548","#7c3aed","#0891b2"][idx%6] }));
  const funnelTotal  = bidArr.length + leadArr.length + dealArr.length || 1;
  const upcomingHols = holidayArr.filter(h=>new Date(h.start_date)>=new Date()).slice(0,4);

  const kpiCards = [
    { label:"Revenue",   value:"₹12,40,000", numVal:null,              badge:"+8.2% vs last month", bc:"bg-emerald-50 text-emerald-600", icon:DollarSign,  grad:"from-teal-400 to-emerald-500",  spark:[30,45,38,52,44,58,50,65,55,72,60,80], sc:"#0ab39c", loading:false, error:null },
    { label:"Projects",  value:pc.all,        numVal:pc.all,            badge:`${pc.active} active`,  bc:"bg-blue-50 text-blue-600",       icon:Briefcase,   grad:"from-blue-400 to-indigo-500",   spark:[5,8,6,10,7,12,9,14,11,16,13,pc.all||14], sc:"#405189", loading:projects.loading, error:projects.error },
    { label:"Employees", value:employeeArr.length, numVal:employeeArr.length, badge:`${activeEmp.length} active`, bc:"bg-orange-50 text-orange-600", icon:Users, grad:"from-orange-400 to-amber-500", spark:[20,22,25,23,28,26,30,28,32,30,35,employeeArr.length||35], sc:"#f7b84b", loading:employees.loading, error:employees.error },
    { label:"Open Tasks",value:tc.open,        numVal:tc.open,           badge:`${tc.bug} bugs`,       bc:"bg-red-50 text-red-500",         icon:CheckSquare, grad:"from-red-400 to-rose-500",      spark:[15,20,18,25,22,30,28,35,32,38,35,tc.open||38], sc:"#f06548", loading:tasks.loading, error:tasks.error },
  ];

  const greeting = new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-5 lg:px-8 py-5 space-y-5" style={{ fontFamily:"'Nunito','Segoe UI',sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 font-semibold">{greeting} 👋</p>
          <h1 className="text-lg sm:text-xl font-black text-gray-800">
            Welcome back, <span style={{ color:"#405189" }}>{loggedInUser?.first_name || "there"}</span>!
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Here's your workspace overview for {fmtDate(new Date(), { day:"2-digit", month:"long", year:"numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-500 shadow-sm">
            <Calendar size={12} /><span>{fmtDate(new Date())}</span>
          </div>
          <button onClick={loadAll} className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-500 hover:bg-gray-50 transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
          {loggedInUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Avatar name={employeeName(loggedInUser)} photo={loggedInUser?.profile_photo} size={7} />
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-700 leading-none">{loggedInUser.first_name}</p>
                <p className="text-[10px] text-gray-400">{loggedInUser.roles?.[0]?.display_name || "Staff"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((c, i) => (
          <Card key={i} delay={i * 70} className="p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase">{c.label}</p>
                {!c.loading && !c.error && (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold ${c.bc}`}>{c.badge}</span>
                )}
              </div>
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <c.icon size={16} className="text-white" />
              </div>
            </div>
            {c.loading ? <div className="flex items-center gap-1 my-1"><Spinner size={16}/><span className="text-xs text-gray-400">Loading…</span></div>
              : c.error ? <ErrorBadge msg={c.error} />
              : <p className="text-xl sm:text-2xl font-black text-gray-800">{c.numVal != null ? <AnimCount value={c.numVal} /> : c.value}</p>}
            <div className="flex justify-end mt-2">
              {!c.loading && !c.error && <AnimSparkline data={c.spark} color={c.sc} width={72} height={26} />}
            </div>
          </Card>
        ))}
      </div>

      {/* ── Employee sub-stats ── */}
      {!employees.loading && !employees.error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Active",    value:activeEmp.length,  color:"#0ab39c", icon:UserCheck, bg:"bg-emerald-50" },
            { label:"Inactive",  value:inactiveEmp.length, color:"#f06548", icon:UserX,     bg:"bg-red-50"     },
            { label:"Admins",    value:adminUsers.length,  color:"#405189", icon:Shield,    bg:"bg-blue-50"    },
            { label:"Employees", value:regularEmps.length, color:"#7c3aed", icon:Users,     bg:"bg-purple-50"  },
          ].map((s, i) => (
            <Card key={i} delay={i * 50} className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-base sm:text-lg font-black" style={{ color: s.color }}><AnimCount value={s.value} /></p>
                <p className="text-[10px] text-gray-400 font-semibold">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ══ REVENUE + FUNNEL ══ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue vs Target" icon={TrendingUp} iconColor="text-teal-500"
            action={
              <div className="flex gap-1">
                {["ALL","1M","6M","1Y"].map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${period===p ? "text-white" : "text-gray-400 hover:bg-gray-100"}`}
                    style={period===p ? { background:"#405189" } : {}}>
                    {p}
                  </button>
                ))}
              </div>
            }
          />
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-gray-50 mb-4">
              {[["Orders","7,585"],["Earnings","₹22.89k"],["Refunds","367"]].map(([l,v],i) => (
                <div key={l} className="text-center">
                  <p className={`text-base sm:text-lg font-black ${i===2?"text-red-400":"text-gray-800"}`}>{v}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{l}</p>
                </div>
              ))}
            </div>
            <LegendRow items={[{color:"#0ab39c",label:"Revenue"},{color:"#405189",label:"Orders"}]} />
            <div className="w-full overflow-x-auto"><AnimRevenueChart period={period} /></div>
            <p className="text-[10px] text-gray-300 mt-2 text-right">* Static data</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Sales Funnel" icon={TrendingUp} iconColor="text-purple-400" />
          <div className="p-4 sm:p-5">
            {[
              { label:"Bids",  state:bids,  arr:bidArr,  color:"#405189" },
              { label:"Leads", state:leads, arr:leadArr, color:"#0ab39c" },
              { label:"Deals", state:deals, arr:dealArr, color:"#f7b84b" },
            ].map(({ label, state, arr:a, color }) => (
              <div key={label} className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  {state.loading ? <Spinner /> : state.error ? <ErrorBadge /> : <span className="text-sm font-black" style={{color}}>{a.length}</span>}
                </div>
                {!state.loading && !state.error && <AnimHBar label="" value={a.length} max={funnelTotal} color={color} suffix="" />}
              </div>
            ))}
            {!bids.loading && !leads.loading && !deals.loading && (
              <div className="flex flex-col items-center gap-2 pt-2 border-t border-gray-50">
                <AnimDonut size={96} thickness={16} segments={[
                  {value:bidArr.length, color:"#405189"},
                  {value:leadArr.length,color:"#0ab39c"},
                  {value:dealArr.length,color:"#f7b84b"},
                ]}/>
                <LegendRow items={[
                  {color:"#405189",label:`Bids ${bidArr.length}`},
                  {color:"#0ab39c",label:`Leads ${leadArr.length}`},
                  {color:"#f7b84b",label:`Deals ${dealArr.length}`},
                ]}/>
              </div>
            )}

            {/* Recent bids/leads/deals mini-list */}
            {!bids.loading && !bids.error && bidArr.length > 0 && (
              <div className="mt-3 border-t border-gray-50 pt-3 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Bids</p>
                {bidArr.slice(0,2).map((b,i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Briefcase size={11} className="text-blue-500"/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{safeStr(b.title)}</p>
                      <p className="text-[10px] text-gray-400">{fmtDate(b.submission_deadline,{day:"2-digit",month:"short"})}</p>
                    </div>
                    <StatusPill status={b.status||"submitted"}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ══ PROJECTS + TASKS ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Project Status" icon={Briefcase} iconColor="text-blue-500" />
          <div className="p-4 sm:p-5">
            {projects.loading ? <div className="flex justify-center py-6"><Spinner size={24}/></div>
              : projects.error ? <ErrorBadge msg={projects.error}/> : (
              <>
                <div className="flex justify-center mb-4">
                  <AnimDonut size={110} thickness={20} segments={[
                    {value:pc.active,    color:"#405189"},
                    {value:pc.completed, color:"#0ab39c"},
                    {value:pc.cancelled, color:"#f06548"},
                  ]}/>
                </div>
                <LegendRow items={[{color:"#405189",label:`Active ${pc.active}`},{color:"#0ab39c",label:`Done ${pc.completed}`},{color:"#f06548",label:`Cancelled ${pc.cancelled}`}]}/>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                  {[["All",pc.all,"text-gray-700"],["Done",pc.completed,"text-teal-600"],["Cancelled",pc.cancelled,"text-red-500"]].map(([l,v,c])=>(
                    <div key={l} className="text-center">
                      <p className={`text-base font-black ${c}`}><AnimCount value={v}/></p>
                      <p className="text-[10px] text-gray-400">{l}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Task Breakdown" icon={CheckSquare} iconColor="text-red-400" />
          <div className="p-4 sm:p-5">
            {tasks.loading ? <div className="flex justify-center py-6"><Spinner size={24}/></div>
              : tasks.error ? <ErrorBadge msg={tasks.error}/> : (
              <>
                <AnimBar height={100} colors={["#f06548","#405189","#0ab39c","#f7b84b","#7c3aed"]}
                  data={[{label:"Bug",value:tc.bug},{label:"Review",value:tc.review},{label:"Prog.",value:tc.progress},{label:"Done",value:tc.completed},{label:"Cancel",value:tc.cancelled}]}/>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                  {[["Total",tc.all,"text-gray-700"],["Open",tc.open,"text-blue-600"],["Bugs",tc.bug,"text-red-500"]].map(([l,v,c])=>(
                    <div key={l} className="text-center">
                      <p className={`text-base font-black ${c}`}><AnimCount value={v}/></p>
                      <p className="text-[10px] text-gray-400">{l}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader title="Recent Tasks" icon={CheckSquare} iconColor="text-indigo-400"
            action={<a href="#" className="text-xs text-blue-500 font-semibold flex items-center gap-0.5">All<ChevronRight size={11}/></a>}
          />
          <div className="divide-y divide-gray-50">
            {tasks.loading ? <div className="flex justify-center py-6"><Spinner/></div>
              : tasks.error ? <div className="p-4"><ErrorBadge msg={tasks.error}/></div>
              : taskArr.length===0 ? <p className="text-xs text-gray-400 p-5">No tasks.</p>
              : taskArr.slice(0,6).map((t,i)=>(
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{safeStr(t.title||t.taskName)||`Task #${i+1}`}</p>
                    <p className="text-[10px] text-gray-400">{safeStr(t.projectName||t.project)||"—"}</p>
                  </div>
                  <StatusPill status={t.status||"pending"}/>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* ══ EMPLOYEE DIRECTORY ══ */}
      <Card>
        <CardHeader title="Employee Directory" icon={Users} iconColor="text-orange-400"
          action={
            <div className="flex items-center gap-3">
              {!employees.loading && !employees.error && (
                <div className="hidden md:flex gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><UserCheck size={11} className="text-emerald-500"/> {activeEmp.length} Active</span>
                  <span className="flex items-center gap-1"><UserX size={11} className="text-red-400"/> {inactiveEmp.length} Inactive</span>
                  <span className="flex items-center gap-1"><Shield size={11} className="text-blue-500"/> {adminUsers.length} Admin</span>
                </div>
              )}
              <a href="#" className="text-xs text-blue-500 font-semibold flex items-center gap-0.5">All<ChevronRight size={11}/></a>
            </div>
          }
        />
        {/* Mobile card list */}
        <div className="block md:hidden divide-y divide-gray-50">
          {employees.loading ? <div className="flex justify-center py-8"><Spinner size={24}/></div>
            : employees.error ? <div className="p-5"><ErrorBadge msg={employees.error}/></div>
            : employeeArr.length===0 ? <p className="text-xs text-gray-400 p-5">No employees.</p>
            : employeeArr.map((u,i) => {
              const name = employeeName(u);
              const roles = (u.roles||[]).map(r=>safeStr(r.display_name??r.name??r)).filter(Boolean);
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={name} photo={u.profile_photo} size={9}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{safeStr(u.email)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {roles.slice(0,1).map(r=><StatusPill key={r} status={r}/>)}
                      <StatusPill status={u.status||"inactive"}/>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          {employees.loading ? <div className="flex justify-center py-8"><Spinner size={24}/></div>
            : employees.error ? <div className="p-5"><ErrorBadge msg={employees.error}/></div>
            : employeeArr.length===0 ? <p className="text-xs text-gray-400 p-5">No employees.</p>
            : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {["Employee","Code","Email","Phone","City","Role","Status","Last Login"].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employeeArr.map((u,i)=>{
                    const name = employeeName(u);
                    const roles = (u.roles||[]).map(r=>safeStr(r.display_name??r.name??r)).filter(Boolean);
                    return (
                      <tr key={u.id||i} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={name} photo={u.profile_photo} size={8}/>
                            <div>
                              <p className="font-semibold text-gray-800 whitespace-nowrap">{name}</p>
                              <p className="text-[10px] text-gray-400">{safeStr(u.gender)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-blue-600">{safeStr(u.employee_code)||"—"}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{safeStr(u.email)}</td>
                        <td className="px-4 py-3 text-gray-500">{safeStr(u.phone)||"—"}</td>
                        <td className="px-4 py-3 text-gray-500">{safeStr(u.city)||"—"}</td>
                        <td className="px-4 py-3">{roles.length>0?roles.map(r=><StatusPill key={r} status={r}/>):<span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3"><StatusPill status={u.status||"inactive"}/></td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(u.last_login_at,{day:"2-digit",month:"short",year:"2-digit"})}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
        {!employees.loading && !employees.error && employeeArr.length>0 && (
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Total: <strong className="text-gray-700">{employeeArr.length}</strong></span>
              <span>Active: <strong className="text-emerald-600">{activeEmp.length}</strong></span>
              <span>Inactive: <strong className="text-red-500">{inactiveEmp.length}</strong></span>
              <span>Admins: <strong className="text-blue-600">{adminUsers.length}</strong></span>
            </div>
          </div>
        )}
      </Card>

      {/* ══ ASSETS ══ */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Laptop size={13}/> Asset Management</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            {label:"Total Assets", value:ac.all,        color:"#405189", bg:"bg-blue-50",    icon:Package   },
            {label:"Assigned",     value:ac.assigned,   color:"#0ab39c", bg:"bg-teal-50",    icon:UserCheck },
            {label:"Available",    value:ac.available,  color:"#10b981", bg:"bg-emerald-50", icon:CheckSquare},
            {label:"Under Repair", value:ac.underRepair,color:"#f7b84b", bg:"bg-amber-50",   icon:RefreshCw },
          ].map((k,i)=>(
            <Card key={i} delay={i*60} className="p-3 sm:p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
                <k.icon size={16} style={{color:k.color}}/>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-tight">{k.label}</p>
                {assets.loading ? <Spinner size={14}/> : assets.error ? <ErrorBadge/> :
                  <p className="text-lg sm:text-xl font-black" style={{color:k.color}}><AnimCount value={k.value}/></p>}
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader title="Asset Status" icon={Package} iconColor="text-blue-500"/>
            <div className="p-4 sm:p-5">
              {assets.loading ? <div className="flex justify-center py-6"><Spinner size={24}/></div>
                : assets.error ? <ErrorBadge msg={assets.error}/> : (
                <>
                  <div className="flex justify-center mb-4">
                    <AnimDonut size={110} thickness={20} segments={[
                      {value:ac.assigned,    color:"#405189"},
                      {value:ac.available,   color:"#0ab39c"},
                      {value:ac.underRepair, color:"#f7b84b"},
                      {value:ac.disposed,    color:"#9ca3af"},
                    ]}/>
                  </div>
                  <LegendRow items={[{color:"#405189",label:`Assigned ${ac.assigned}`},{color:"#0ab39c",label:`Available ${ac.available}`},{color:"#f7b84b",label:`Repair ${ac.underRepair}`},{color:"#9ca3af",label:`Disposed ${ac.disposed}`}]}/>
                  <div className="pt-3 border-t border-gray-50 space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Purchase Cost</span><span className="font-bold text-gray-700">{formatINR(ac.purchaseCost)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Current Value</span><span className="font-bold text-teal-600">{formatINR(ac.totalValue)}</span></div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="By Category" icon={Tag} iconColor="text-purple-400"/>
            <div className="p-4 sm:p-5">
              {assetCats.loading||assets.loading ? <div className="flex justify-center py-6"><Spinner size={24}/></div>
                : assetCats.error ? <ErrorBadge msg={assetCats.error}/>
                : assetsByCat.length===0 ? <p className="text-xs text-gray-400">No categories.</p>
                : (
                <>
                  {assetsByCat.map(cat=>(
                    <AnimHBar key={cat.name} label={cat.name} value={cat.count}
                      max={Math.max(...assetsByCat.map(c=>c.count),1)} color={cat.color} suffix=" assets"/>
                  ))}
                  <div className="pt-3 mt-2 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Depreciation Rates</p>
                    {assetCatArr.map(cat=>(
                      <div key={cat.id} className="flex justify-between text-xs py-1">
                        <span className="text-gray-600 truncate max-w-[70%]">{cat.name}</span>
                        <span className="font-bold text-amber-600">{cat.depreciation_rate}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader title="Recent Assignments" icon={UserCheck} iconColor="text-teal-400"
              action={<a href="#" className="text-xs text-blue-500 font-semibold flex items-center gap-0.5">All<ChevronRight size={11}/></a>}
            />
            <div className="divide-y divide-gray-50">
              {assignments.loading ? <div className="flex justify-center py-6"><Spinner/></div>
                : assignments.error ? <div className="p-4"><ErrorBadge msg={assignments.error}/></div>
                : assignmentArr.length===0 ? <p className="text-xs text-gray-400 p-4">No assignments.</p>
                : assignmentArr.slice(0,5).map((a,i)=>(
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Laptop size={12} className="text-blue-500"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{a.asset?.asset_name||"—"}</p>
                      <p className="text-[10px] text-gray-400">→ {a.user?`${a.user.first_name} ${a.user.last_name}`:"—"}</p>
                      <p className="text-[10px] text-gray-400">{fmtDate(a.assigned_date,{day:"2-digit",month:"short"})}</p>
                    </div>
                    <StatusPill status={a.asset?.status||"assigned"}/>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* All Assets Table */}
        <Card className="mt-4">
          <CardHeader title="All Assets" icon={Package} iconColor="text-blue-500"
            action={
              <div className="flex items-center gap-2">
                {!assets.loading && !assets.error && <span className="text-xs text-gray-400 hidden sm:inline">{assetArr.length} assets · {formatINR(ac.totalValue)}</span>}
                <a href="#" className="text-xs text-blue-500 font-semibold flex items-center gap-0.5">Manage<ChevronRight size={11}/></a>
              </div>
            }
          />
          {/* Mobile */}
          <div className="block md:hidden divide-y divide-gray-50">
            {assets.loading ? <div className="flex justify-center py-6"><Spinner/></div>
              : assetArr.slice(0,5).map((a,i)=>(
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-800">{a.asset_name||"—"}</p>
                  <StatusPill status={a.status||"available"}/>
                </div>
                <div className="grid grid-cols-2 gap-x-4 text-[10px] text-gray-500">
                  <span>Code: <strong className="text-blue-600">{a.asset_code||"—"}</strong></span>
                  <span>Cost: <strong>{formatINR(a.purchase_cost)}</strong></span>
                  <span>Value: <strong className="text-teal-600">{formatINR(a.current_value)}</strong></span>
                  <span>Cat: {a.category?.name||"—"}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            {assets.loading ? <div className="flex justify-center py-6"><Spinner size={22}/></div>
              : assetArr.length===0 ? <p className="text-xs text-gray-400 p-5">No assets.</p>
              : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {["Asset","Code","Category","Purchase Cost","Current Value","Assigned To","Warranty","Status"].map(h=>(
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assetArr.map((a,i)=>(
                    <tr key={a.id||i} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Laptop size={11} className="text-blue-500"/></div>
                          <div>
                            <p className="font-semibold text-gray-800 whitespace-nowrap">{a.asset_name||"—"}</p>
                            <p className="text-[10px] text-gray-400">{a.serial_number||""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-blue-600">{a.asset_code||"—"}</td>
                      <td className="px-4 py-3 text-gray-500">{a.category?.name||"—"}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{formatINR(a.purchase_cost)}</td>
                      <td className="px-4 py-3 font-semibold text-teal-600">{formatINR(a.current_value)}</td>
                      <td className="px-4 py-3 text-gray-600">{a.assignee?`${a.assignee.first_name} ${a.assignee.last_name}`:<span className="text-gray-300">Unassigned</span>}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(a.warranty_expiry_date,{day:"2-digit",month:"short",year:"numeric"})}</td>
                      <td className="px-4 py-3"><StatusPill status={a.status||"available"}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* ══ PERFORMANCE ══ */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><BarChart2 size={13}/> Team Performance <span className="font-normal text-gray-300">* Static</span></h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader title="Department Scores" icon={Target} iconColor="text-indigo-400"/>
            <div className="p-4 sm:p-5 space-y-4">
              {PERF_DATA.map(dept=>{
                const cr = dept.tasks>0?Math.round((dept.completed/dept.tasks)*100):0;
                return (
                  <div key={dept.name} className="flex items-center gap-3 sm:gap-4">
                    <div className="w-20 sm:w-28 flex-shrink-0">
                      <p className="text-xs font-semibold text-gray-700">{dept.name}</p>
                      <p className="text-[10px] text-gray-400">{dept.completed}/{dept.tasks} · {cr}%</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-400">Score</span>
                        <span className="font-bold" style={{color:dept.color}}>{dept.score}/100</span>
                      </div>
                      <AnimHBar label="" value={dept.score} max={100} color={dept.color} suffix=""/>
                    </div>
                    <div className="flex-shrink-0"><AnimScoreRing score={dept.score} size={48} color={dept.color}/></div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700">Overall Team Score</p>
                  <p className="text-[10px] text-gray-400">Average across departments</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black" style={{color:"#405189"}}>
                    <AnimCount value={Math.round(PERF_DATA.reduce((s,d)=>s+d.score,0)/PERF_DATA.length)}/>
                  </p>
                  <p className="text-[10px] text-gray-400">/ 100</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Top Performers" icon={Award} iconColor="text-amber-400"/>
            <div className="divide-y divide-gray-50">
              {TOP_PERFORMERS.map((p,i)=>(
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="relative flex-shrink-0">
                    <Avatar name={p.name} size={9}/>
                    {i===0&&<span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center"><Star size={9} className="text-white" fill="white"/></span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.role} · {p.tasks} tasks</p>
                    <div className="mt-1.5"><AnimHBar label="" value={p.score} max={100} color={p.color} suffix=""/></div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{color:p.color}}>{p.score}</p>
                    <p className="text-[10px] text-gray-400">/ 100</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/50 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Guide</p>
              {[{r:"90–100",l:"Excellent",c:"#0ab39c"},{r:"75–89",l:"Good",c:"#405189"},{r:"60–74",l:"Average",c:"#f7b84b"},{r:"< 60",l:"Needs Work",c:"#f06548"}].map(g=>(
                <div key={g.r} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:g.c}}/><span className="text-gray-500">{g.l}</span></span>
                  <span className="font-semibold text-gray-400">{g.r}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ══ HR SNAPSHOT ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="sm:col-span-2">
          <CardHeader title="Leave Overview" icon={Calendar} iconColor="text-amber-400"/>
          <div className="p-4 sm:p-5">
            {leaves.loading ? <div className="flex justify-center py-4"><Spinner size={22}/></div>
              : leaves.error ? <ErrorBadge msg={leaves.error}/> : (
              <>
                <AnimBar height={90} colors={["#405189","#0ab39c","#f7b84b","#f06548","#9ca3af"]}
                  data={[{label:"All",value:lc.all},{label:"Approved",value:lc.approved},{label:"Pending",value:lc.pending},{label:"Rejected",value:lc.rejected},{label:"Cancelled",value:lc.cancelled}]}/>
                <div className="grid grid-cols-5 gap-1 mt-3 pt-3 border-t border-gray-50">
                  {[["All",lc.all,"text-gray-700"],["Appr.",lc.approved,"text-teal-600"],["Pend.",lc.pending,"text-amber-500"],["Rej.",lc.rejected,"text-red-500"],["Cancel.",lc.cancelled,"text-gray-400"]].map(([l,v,c])=>(
                    <div key={l} className="text-center">
                      <p className={`text-sm font-black ${c}`}><AnimCount value={v}/></p>
                      <p className="text-[9px] text-gray-400 leading-tight">{l}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Claims" icon={Receipt} iconColor="text-purple-400"/>
          <div className="p-4 sm:p-5">
            {claims.loading ? <div className="flex justify-center py-4"><Spinner size={22}/></div>
              : claims.error ? <ErrorBadge msg={claims.error}/> : (
              <>
                <div className="flex justify-center mb-3">
                  <AnimDonut size={90} thickness={16} segments={[
                    {value:cc.paid,color:"#7c3aed"},{value:cc.approved,color:"#0ab39c"},
                    {value:cc.pending,color:"#f7b84b"},{value:cc.rejected,color:"#f06548"},
                  ]}/>
                </div>
                <div className="space-y-1.5">
                  {[["Paid",cc.paid,"#7c3aed"],["Approved",cc.approved,"#0ab39c"],["Pending",cc.pending,"#f7b84b"],["Rejected",cc.rejected,"#f06548"]].map(([l,v,c])=>(
                    <div key={l} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2 h-2 rounded-full" style={{background:c}}/>{l}</span>
                      <span className="text-xs font-bold" style={{color:c}}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Holidays & Notices" icon={Calendar} iconColor="text-teal-400"/>
          <div className="divide-y divide-gray-50">
            {holidays.loading||notices.loading ? <div className="flex justify-center py-4"><Spinner/></div> : <>
              {upcomingHols.length===0&&noticeArr.length===0&&<p className="text-xs text-gray-400 p-4">No upcoming items.</p>}
              {upcomingHols.map((h,i)=>(
                <div key={i} className="flex items-start gap-2.5 px-4 py-2.5">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0"><Calendar size={11} className="text-teal-500"/></span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{safeStr(h.holiday_name)||"Holiday"}</p>
                    <p className="text-[10px] text-gray-400">{fmtDate(h.start_date,{day:"2-digit",month:"short"})}</p>
                  </div>
                </div>
              ))}
              {noticeArr.slice(0,2).map((n,i)=>(
                <div key={i} className="flex items-start gap-2.5 px-4 py-2.5">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0"><AlertCircle size={11} className="text-amber-500"/></span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 line-clamp-1">{safeStr(n.title||n.subject)||"Notice"}</p>
                    <p className="text-[10px] text-gray-400">Notice</p>
                  </div>
                </div>
              ))}
            </>}
          </div>
        </Card>
      </div>

      {/* ══ NOTIFICATIONS ══ */}
{/* ══ NOTIFICATIONS ══ */}
<div>
  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
    <Bell size={13} />
    Activity Feed & Notifications
    {!notifications.loading && !notifications.error && (() => {
      const arr = extractArray(notifications.data, ["data","notifications","items"])
        .filter(n => {
          if (!n.created_at) return false;
          const d = new Date(n.created_at);
          const today = new Date();
          return d.getDate() === today.getDate() &&
                 d.getMonth() === today.getMonth() &&
                 d.getFullYear() === today.getFullYear();
        });
      const unread = arr.filter(n => !n.is_read && !n.read_at).length;
      return unread > 0 ? (
        <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-200">
          {unread} new
        </span>
      ) : null;
    })()}
  </h2>

  <Card>
    <CardHeader
      title="Recent activity & alerts"
      icon={Zap}
      iconColor="text-blue-400"
      action={
        <div className="flex items-center gap-2">
          {!notifications.loading && !notifications.error && (() => {
            const arr = extractArray(notifications.data, ["data","notifications","items"])
              .filter(n => {
                if (!n.created_at) return false;
                const d = new Date(n.created_at);
                const today = new Date();
                return d.getDate() === today.getDate() &&
                       d.getMonth() === today.getMonth() &&
                       d.getFullYear() === today.getFullYear();
              });
            const unread = arr.filter(n => !n.is_read && !n.read_at).length;
            return unread > 0 ? (
              <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                {unread} unread
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                All read
              </span>
            );
          })()}
          <a href="#" className="text-xs text-blue-500 font-semibold flex items-center gap-0.5">
            All<ChevronRight size={11} />
          </a>
        </div>
      }
    />

    {notifications.loading ? (
      <div className="flex justify-center py-10"><Spinner size={24} /></div>
    ) : notifications.error ? (
      <div className="p-5"><ErrorBadge msg={notifications.error} /></div>
    ) : (() => {
      const notifArr = extractArray(notifications.data, ["data","notifications","items"])
        .filter(n => {
          if (!n.created_at) return false;
          const d = new Date(n.created_at);
          const today = new Date();
          return d.getDate() === today.getDate() &&
                 d.getMonth() === today.getMonth() &&
                 d.getFullYear() === today.getFullYear();
        });

      if (!notifArr.length) return (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Bell size={28} className="text-gray-200" />
          <p className="text-xs text-gray-400">No notifications today.</p>
        </div>
      );

      return (
        <>
          <div className="divide-y divide-gray-50">
            {notifArr.map((n, i) => {
              const { icon: NIcon, bg, color } = notifIcon(n.type || n.notification_type || "");
              const isUnread = !n.is_read && !n.read_at;

              // Build subtitle breadcrumb  e.g. "Tasks → Bug"
              const category = safeStr(n.type || n.notification_type || n.category || "");
              const subCategory = safeStr(n.sub_type || n.action || n.module || "");
              const breadcrumb = [category, subCategory].filter(Boolean).join(" → ");

              const recipient = n.user
                ? `${n.user.first_name ?? ""} ${n.user.last_name ?? ""}`.trim()
                : safeStr(n.recipient || n.receiver || "");

              return (
                <div
                  key={n.id || i}
                  className={`flex items-start gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/70 transition-colors cursor-pointer ${isUnread ? "bg-blue-50/20" : ""}`}
                >
                  {/* Icon bubble */}
                  <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <NIcon size={14} className={color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Unread dot + title */}
                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                          <p className={`text-sm leading-snug truncate ${isUnread ? "font-bold text-gray-800" : "font-semibold text-gray-700"}`}>
                            {safeStr(n.title || n.message || n.body || "Notification")}
                          </p>
                        </div>

                        {/* Breadcrumb sub-line */}
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-gray-400">{timeAgo(n.created_at)}</span>
                          {breadcrumb && (
                            <>
                              <span className="text-gray-200">·</span>
                              <span className="text-[11px] text-gray-400">{breadcrumb}</span>
                            </>
                          )}
                          {recipient && (
                            <>
                              <span className="text-gray-200">·</span>
                              <span className="text-[11px] text-gray-400">{recipient}</span>
                            </>
                          )}
                        </div>

                        {/* Optional body message if title & message are both present */}
                        {n.title && (n.message || n.body) && (
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                            {safeStr(n.message || n.body)}
                          </p>
                        )}
                      </div>

                      {/* Status pill */}
                      <div className="flex-shrink-0 mt-0.5">
                        <StatusPill status={isUnread ? "new" : "completed"} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Today: <strong className="text-gray-700">{notifArr.length}</strong></span>
              <span>Unread: <strong className="text-blue-600">{notifArr.filter(n => !n.is_read && !n.read_at).length}</strong></span>
              <span>Read: <strong className="text-teal-600">{notifArr.filter(n => n.is_read || n.read_at).length}</strong></span>
            </div>
          </div>
        </>
      );
    })()}
  </Card>
</div>

      {/* ══ RECENT LEAVE + CLAIMS TABLES ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Recent Leave Requests" icon={Calendar} iconColor="text-amber-400"
            action={<a href="#" className="text-xs text-blue-500 font-semibold flex items-center gap-0.5">All<ChevronRight size={11}/></a>}
          />
          <div className="block md:hidden divide-y divide-gray-50">
            {leaves.loading?<div className="flex justify-center py-4"><Spinner/></div>:leaveArr.slice(0,4).map((l,i)=>(
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{l.user?`${l.user.first_name} ${l.user.last_name}`:"—"}</p>
                  <p className="text-[10px] text-gray-400">{leaveTypeMap?.[l.leave_type_id]??"—"} · {fmtDate(l.from_date,{day:"2-digit",month:"short"})}</p>
                </div>
                <StatusPill status={l.status||"pending"}/>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            {leaves.loading?<div className="flex justify-center py-4"><Spinner/></div>:leaveArr.length===0?<p className="text-xs text-gray-400 p-5">No leave requests.</p>:(
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50">{["Employee","Type","From","To","Status"].map(h=><th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {leaveArr.slice(0,5).map((l,i)=>(
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-4 py-2.5 font-medium text-gray-700 whitespace-nowrap">{l.user?`${l.user.first_name} ${l.user.last_name}`:"—"}</td>
                      <td className="px-4 py-2.5 text-gray-500">{leaveTypeMap?.[l.leave_type_id]??`Type ${l.leave_type_id}`}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(l.from_date,{day:"2-digit",month:"short"})}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(l.to_date,{day:"2-digit",month:"short"})}</td>
                      <td className="px-4 py-2.5"><StatusPill status={l.status||"pending"}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Claims" icon={Receipt} iconColor="text-purple-400"
            action={<a href="#" className="text-xs text-blue-500 font-semibold flex items-center gap-0.5">All<ChevronRight size={11}/></a>}
          />
          <div className="block md:hidden divide-y divide-gray-50">
            {claims.loading?<div className="flex justify-center py-4"><Spinner/></div>:claimArr.slice(0,4).map((c,i)=>(
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{c.user?`${c.user.first_name} ${c.user.last_name}`:"—"}</p>
                  <p className="text-[10px] text-gray-400">{c.claim_type?.name??"—"} · {c.amount!=null?`₹${Number(c.amount).toLocaleString("en-IN")}`:"—"}</p>
                </div>
                <StatusPill status={c.status||"pending"}/>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            {claims.loading?<div className="flex justify-center py-4"><Spinner/></div>:claimArr.length===0?<p className="text-xs text-gray-400 p-5">No claims.</p>:(
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50">{["Employee","Type","Amount","Status"].map(h=><th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {claimArr.slice(0,5).map((c,i)=>(
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-4 py-2.5 font-medium text-gray-700 whitespace-nowrap">{c.user?`${c.user.first_name} ${c.user.last_name}`:"—"}</td>
                      <td className="px-4 py-2.5 text-gray-500">{c.claim_type?.name??"—"}</td>
                      <td className="px-4 py-2.5 font-bold text-gray-700">{c.amount!=null?`₹${Number(c.amount).toLocaleString("en-IN")}`:"—"}</td>
                      <td className="px-4 py-2.5"><StatusPill status={c.status||"pending"}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <div className="h-4"/>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration:0.001ms !important; transition-duration:0.001ms !important; }
        }
      `}</style>
    </div>
  );
}