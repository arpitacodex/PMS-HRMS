"use client";
import { useState, useEffect, useCallback } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
const getRole = () =>
  typeof window !== "undefined"
    ? (localStorage.getItem("role") || "").toLowerCase()
    : "";

const ROLE_META = {
  admin:           { label: "Admin",           dot: "#f97316" },
  hr:              { label: "HR",              dot: "#22c55e" },
  project_manager: { label: "Project Manager", dot: "#3b82f6" },
  employee:        { label: "Employee",        dot: "#a855f7" },
};

const PALETTES = [
  { accent: "#ea580c", icon: "🏠" },
  { accent: "#16a34a", icon: "🌴" },
  { accent: "#2563eb", icon: "🏥" },
  { accent: "#9333ea", icon: "👶" },
  { accent: "#ca8a04", icon: "💼" },
  { accent: "#0d9488", icon: "⏸️" },
];

const ITEMS_PER_PAGE = 6;

function pct(used, total) {
  const t = parseFloat(total) || 0;
  const u = parseFloat(used) || 0;
  if (t === 0) return 0;
  return Math.min(100, Math.round((u / t) * 100));
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ item, palette, leaveTypeName, onClose }) {
  const used      = parseFloat(item.used);
  const total     = parseFloat(item.total_allocated);
  const remaining = parseFloat(item.remaining);
  const cf        = parseFloat(item.carry_forward);
  const enc       = parseFloat(item.encashed);
  const progress  = pct(used, total);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const stats = [
    { label: "Total Allocated", value: total,         suffix: "days", key: "alloc" },
    { label: "Used",            value: used,          suffix: "days", key: "used"  },
    { label: "Remaining",       value: remaining,     suffix: "days", key: "rem"   },
    { label: "Carry Forward",   value: cf,            suffix: "days", key: "cf"    },
    { label: "Encashed",        value: enc,           suffix: "days", key: "enc"   },
    { label: "Leave Type",      value: leaveTypeName, suffix: "",     key: "type", raw: true },
  ];

  return (
    <>
      <div onClick={onClose} className="lb-modal-backdrop" />
      <div className="lb-modal-sheet lb-modal-responsive">
        <div className="lb-drag-handle">
          <div className="lb-drag-pill" />
        </div>

        {/* Header */}
        <div className="lb-modal-header" style={{ borderBottom: `1px solid ${palette.accent}33` }}>
          <button onClick={onClose} className="lb-modal-close">✕</button>
          <div className="lb-modal-header-inner">
            <div
              className="lb-modal-icon"
              style={{
                border: `2px solid ${palette.accent}44`,
                boxShadow: `0 4px 16px ${palette.accent}33`,
              }}
            >
              <span style={{ fontSize: 22 }}>{palette.icon}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="lb-modal-title">{leaveTypeName}</div>
              <div className="lb-modal-subtitle">Year {item.year} · Balance ID #{item.id}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="lb-modal-body">
          <div className="lb-modal-prog-wrap">
            <div className="lb-modal-prog-row">
              <span className="lb-modal-prog-label">Usage</span>
              <span className="lb-modal-prog-pct" style={{ color: palette.accent }}>{progress}%</span>
            </div>
            <div className="lb-modal-prog-track">
              <div
                className="lb-modal-prog-fill"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${palette.accent}88, ${palette.accent})`,
                }}
              />
            </div>
          </div>

          <div className="lb-stats-grid">
            {stats.map(({ label, value, suffix, key, raw }) => (
              <div key={label} className={`lb-stat-card lb-stat-${key}`}>
                <div className="lb-stat-label">{label}</div>
                <div className="lb-stat-value" style={{ fontSize: raw ? 13 : 20 }}>
                  {raw ? value : Number(value).toFixed(1)}
                  {suffix && <span className="lb-stat-suffix">{suffix}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Balance Card ─────────────────────────────────────────────────────────────
function BalanceCard({ item, index, leaveTypeName, onClick }) {
  const pal      = PALETTES[index % PALETTES.length];
  const used     = parseFloat(item.used);
  const total    = parseFloat(item.total_allocated);
  const remaining= parseFloat(item.remaining);
  const progress = pct(used, total);

  return (
    <div
      onClick={() => onClick(item, pal, leaveTypeName)}
      className="lb-card"
      style={{ animationDelay: `${(index % ITEMS_PER_PAGE) * 60}ms` }}
    >
      <div className="lb-card-blob" style={{ background: pal.accent }} />

      <div className="lb-card-top">
        <div
          className="lb-card-icon"
          style={{
            border: `1.5px solid ${pal.accent}44`,
            boxShadow: `0 2px 10px ${pal.accent}22`,
          }}
        >
          <span style={{ fontSize: 18 }}>{pal.icon}</span>
        </div>
        <div className="lb-card-title-wrap">
          <div className="lb-card-title">{leaveTypeName}</div>
          <div className="lb-card-year">Year {item.year}</div>
        </div>
        <div className="lb-card-badge" style={{ color: pal.accent, background: `${pal.accent}18` }}>
          {progress}% used
        </div>
      </div>

      <div className="lb-card-prog-track">
        <div
          className="lb-card-prog-fill"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${pal.accent}77, ${pal.accent})`,
          }}
        />
      </div>

      <div className="lb-card-stats">
        {[
          { label: "Allocated", value: total      },
          { label: "Used",      value: used       },
          { label: "Remaining", value: remaining  },
        ].map(({ label, value }, i) => (
          <div key={label} className={`lb-card-stat ${i < 2 ? "lb-card-stat-border" : ""}`}>
            <div className="lb-card-stat-num">{Number(value).toFixed(0)}</div>
            <div className="lb-card-stat-lbl">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const getPages = () => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, "…", total];
    if (current >= total - 2) return [1, "…", total - 2, total - 1, total];
    return [1, "…", current - 1, current, current + 1, "…", total];
  };
  return (
    <div className="lb-pagination">
      <button className="lb-page-btn lb-page-nav" onClick={() => onChange(current - 1)} disabled={current === 1}>
        ‹ Prev
      </button>
      {getPages().map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="lb-page-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`lb-page-btn ${current === p ? "lb-page-active" : ""}`}
            onClick={() => onChange(p)}
          >{p}</button>
        )
      )}
      <button className="lb-page-btn lb-page-nav" onClick={() => onChange(current + 1)} disabled={current === total}>
        Next ›
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeaveBalance() {
  const [balances, setBalances] = useState([]);
  const [typeMap,  setTypeMap]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [page,     setPage]     = useState(1);

  const role     = getRole();
  const roleMeta = ROLE_META[role] || { label: "User", dot: "#64748b" };

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    };
    Promise.all([
      fetch("http://localhost:8080/api/leave-balances/my-balance", { headers })
        .then(r => { if (!r.ok) throw new Error(`Balances: HTTP ${r.status}`); return r.json(); }),
      fetch("http://localhost:8080/api/leave-types/", { headers })
        .then(r => { if (!r.ok) throw new Error(`Leave Types: HTTP ${r.status}`); return r.json(); }),
    ])
      .then(([balJson, typeJson]) => {
        setBalances(balJson.data || []);
        const map = {};
        (typeJson.data || []).forEach(t => { map[t.id] = t.name; });
        setTypeMap(map);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const resolveName = (item) =>
    typeMap[item.leave_type_id] || item.leave_type?.name || `Leave #${item.leave_type_id}`;

  const totalPages  = Math.ceil(balances.length / ITEMS_PER_PAGE);
  const paginated   = balances.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalAlloc  = balances.reduce((s, d) => s + parseFloat(d.total_allocated), 0);
  const totalUsed   = balances.reduce((s, d) => s + parseFloat(d.used),            0);
  const totalRemain = balances.reduce((s, d) => s + parseFloat(d.remaining),       0);

  const openModal  = useCallback((item, pal, name) => setSelected({ item, palette: pal, name }), []);
  const closeModal = useCallback(() => setSelected(null), []);
  const handlePage = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <>
      <div className="lb-root">
        <div className="lb-inner">

          {/* ── Header ── */}
          <div className="lb-header">
            <div className="lb-header-left">
              <div className="lb-header-icon">⚖️</div>
              <div>
                <h1 className="lb-title">My Leave Balance</h1>
                <p className="lb-subtitle">Track and manage your leave allocations</p>
              </div>
            </div>
            <div className="lb-role-badge" style={{ borderColor: `${roleMeta.dot}55` }}>
              <div className="lb-role-dot" style={{ background: roleMeta.dot, boxShadow: `0 0 0 3px ${roleMeta.dot}33` }} />
              <span className="lb-role-label" style={{ color: roleMeta.dot }}>{roleMeta.label}</span>
            </div>
          </div>

          {/* ── Summary Cards ── */}
          {!loading && !error && balances.length > 0 && (
            <div className="lb-summary-grid">
              {[
                { label: "Total Allocated", value: totalAlloc,  icon: "📅", cls: "lb-sum-alloc" },
                { label: "Used",            value: totalUsed,   icon: "📉", cls: "lb-sum-used"  },
                { label: "Remaining",       value: totalRemain, icon: "✅", cls: "lb-sum-rem"   },
              ].map(({ label, value, icon, cls }) => (
                <div key={label} className={`lb-sum-card ${cls}`}>
                  <div>
                    <div className="lb-sum-label">{label}</div>
                    <div className="lb-sum-value">{Number(value).toFixed(1)}</div>
                    <div className="lb-sum-sub">days · {balances.length} types</div>
                  </div>
                  <div className="lb-sum-icon">{icon}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="lb-state-center">
              <div className="lb-spinner">⏳</div>
              <div className="lb-state-text">Loading your leave balance…</div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="lb-error-box">
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
              <div className="lb-error-title">Failed to load</div>
              <div className="lb-error-msg">{error}</div>
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && !error && balances.length === 0 && (
            <div className="lb-state-center">
              <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
              <div className="lb-state-text" style={{ fontWeight: 600, fontSize: 15 }}>No leave balances found</div>
              <div className="lb-state-sub">Contact HR to set up your leave allocations</div>
            </div>
          )}

          {/* ── Card Grid ── */}
          {!loading && !error && balances.length > 0 && (
            <>
              <div className="lb-grid-header">
                <h2 className="lb-grid-title">Leave Types</h2>
                <span className="lb-grid-meta">
                  Page {page}/{totalPages} · {balances.length} allocations · tap for details
                </span>
              </div>

              <div className="lb-card-grid">
                {paginated.map((item, i) => (
                  <BalanceCard
                    key={item.id}
                    item={item}
                    index={i}
                    leaveTypeName={resolveName(item)}
                    onClick={openModal}
                  />
                ))}
              </div>

              <Pagination current={page} total={totalPages} onChange={handlePage} />
            </>
          )}
        </div>
      </div>

      {selected && (
        <DetailModal
          item={selected.item}
          palette={selected.palette}
          leaveTypeName={selected.name}
          onClose={closeModal}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Nunito:wght@400;500;600&display=swap');

        /* ══════════════════════════════════════════════════
           ROOT — inherits globals.css variables
           Light:  --bg-primary:#f3f4f6  --bg-secondary:#ffffff
                   --text-primary:#111827  --text-secondary:#6b7280
                   --border-color:#e5e7eb  --input-bg:#ffffff
           Dark:   --bg-primary:#0f1117   --bg-secondary:#1a1f2e
                   --text-primary:#f9fafb  --text-secondary:#9ca3af
                   --border-color:#374151  --input-bg:#1f2937
        ══════════════════════════════════════════════════ */

        /* ── Layout ── */
        .lb-root {
          min-height: 100vh;
          width: 100%;
          background: transparent;          /* use global --bg-primary via parent */
          font-family: 'Nunito', sans-serif;
          padding: 20px 16px 60px;
          color: var(--text-primary);
        }
        .lb-inner {
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── Header ── */
        .lb-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .lb-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .lb-header-icon {
          width: 46px; height: 46px;
          border-radius: 14px;
          flex-shrink: 0;
          background: linear-gradient(135deg, #f97316, #ea580c);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 6px 20px rgba(249,115,22,0.35);
        }
        .lb-title {
          margin: 0;
          font-size: 18px; font-weight: 800;
          color: var(--text-primary);
          font-family: 'Sora', sans-serif;
          white-space: nowrap;
        }
        .lb-subtitle {
          margin: 3px 0 0;
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* Role badge */
        .lb-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-secondary);
          border: 1.5px solid;
          border-radius: 10px;
          padding: 7px 12px;
          flex-shrink: 0;
        }
        .lb-role-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .lb-role-label {
          font-size: 12px; font-weight: 700;
        }

        /* ── Summary Grid ── */
        .lb-summary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (min-width: 480px) {
          .lb-summary-grid { grid-template-columns: repeat(3,1fr); }
        }
        .lb-sum-card {
          border-radius: 16px;
          padding: 16px 18px;
          border: 1.5px solid var(--border-color);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          background: var(--bg-secondary);
        }
        /* Light tints — gentle in light, richer in dark */
        .lb-sum-alloc { background: var(--bg-secondary); border-color: var(--border-color); }
        .lb-sum-used  { background: var(--bg-secondary); border-color: var(--border-color); }
        .lb-sum-rem   { background: var(--bg-secondary); border-color: var(--border-color); }

        html.dark .lb-sum-alloc { background: #1a1f2e; border-color: #374151; }
        html.dark .lb-sum-used  { background: #1a1f2e; border-color: #374151; }
        html.dark .lb-sum-rem   { background: #1a1f2e; border-color: #374151; }

        .lb-sum-label {
          font-size: 9px; font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: .08em;
          margin-bottom: 6px;
        }
        .lb-sum-value {
          font-size: 26px; font-weight: 800;
          font-family: 'Sora', sans-serif;
          line-height: 1;
        }
        .lb-sum-alloc .lb-sum-value { color: #f97316; }
        .lb-sum-used  .lb-sum-value { color: #ef4444; }
        .lb-sum-rem   .lb-sum-value { color: #22c55e; }

        .lb-sum-sub {
          font-size: 10px;
          color: var(--text-secondary);
          margin-top: 3px;
        }
        .lb-sum-icon {
          width: 36px; height: 36px;
          border-radius: 11px;
          font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          background: var(--input-bg);
        }

        /* ── Grid header ── */
        .lb-grid-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 6px;
        }
        .lb-grid-title {
          margin: 0;
          font-size: 14px; font-weight: 700;
          color: var(--text-primary);
          font-family: 'Sora', sans-serif;
        }
        .lb-grid-meta {
          font-size: 11px;
          color: var(--text-secondary);
        }

        /* ── Card Grid ── */
        .lb-card-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 480px) { .lb-card-grid { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 768px) { .lb-card-grid { grid-template-columns: repeat(3,1fr); } }

        /* ── Balance Card ── */
        .lb-card {
          background: var(--bg-secondary);
          border-radius: 20px;
          padding: 18px 16px 14px;
          border: 1.5px solid var(--border-color);
          cursor: pointer;
          transition: transform .17s, box-shadow .17s, border-color .17s, background .25s;
          position: relative;
          overflow: hidden;
          animation: lbCardIn .4s ease both;
          -webkit-tap-highlight-color: transparent;
        }
        .lb-card:hover {
          transform: translateY(-4px);
          border-color: #f97316;
          box-shadow: 0 8px 28px rgba(249,115,22,0.15);
        }
        html.dark .lb-card:hover {
          border-color: #f97316;
          box-shadow: 0 8px 28px rgba(249,115,22,0.25);
        }
        .lb-card:active { transform: scale(0.98); }

        .lb-card-blob {
          position: absolute;
          top: -16px; right: -16px;
          width: 64px; height: 64px;
          border-radius: 50%;
          opacity: 0.07;
          pointer-events: none;
        }
        .lb-card-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          position: relative;
        }
        .lb-card-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          flex-shrink: 0;
          background: var(--input-bg);
          display: flex; align-items: center; justify-content: center;
        }
        .lb-card-title-wrap { flex: 1; min-width: 0; }
        .lb-card-title {
          font-size: 13px; font-weight: 700;
          color: var(--text-primary);
          font-family: 'Sora', sans-serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .lb-card-year {
          font-size: 10px;
          color: var(--text-secondary);
          margin-top: 1px;
        }
        .lb-card-badge {
          font-size: 10px; font-weight: 700;
          border-radius: 7px;
          padding: 3px 8px;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .lb-card-prog-track {
          height: 5px; border-radius: 99px;
          background: var(--input-bg);
          overflow: hidden;
          margin-bottom: 12px;
          border: 1px solid var(--border-color);
        }
        .lb-card-prog-fill {
          height: 100%; border-radius: 99px;
          transition: width .5s ease;
        }
        .lb-card-stats {
          display: flex;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
        }
        .lb-card-stat { flex: 1; text-align: center; }
        .lb-card-stat-border { border-right: 1px solid var(--border-color); }
        .lb-card-stat-num {
          font-size: 16px; font-weight: 800;
          color: var(--text-primary);
          font-family: 'Sora', sans-serif;
        }
        .lb-card-stat-lbl {
          font-size: 9px; color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-top: 1px;
        }

        /* ── States ── */
        .lb-state-center {
          text-align: center;
          padding: 60px 20px;
        }
        .lb-state-text { font-weight: 600; font-size: 14px; color: var(--text-primary); }
        .lb-state-sub  { font-size: 13px; margin-top: 6px; color: var(--text-secondary); }
        .lb-spinner {
          font-size: 36px; margin-bottom: 12px;
          display: inline-block;
          animation: lbSpin 1.2s linear infinite;
        }
        .lb-error-box {
          background: var(--bg-secondary);
          border: 1.5px solid #f87171;
          border-radius: 16px;
          padding: 24px; text-align: center;
          color: #ef4444;
        }
        .lb-error-title { font-weight: 700; margin-bottom: 4px; font-size: 15px; }
        .lb-error-msg   { font-size: 13px; opacity: .8; }

        /* ── Pagination ── */
        .lb-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-top: 28px;
          flex-wrap: wrap;
        }
        .lb-page-btn {
          height: 34px; min-width: 34px;
          border-radius: 9px;
          border: 1.5px solid var(--border-color);
          background: var(--bg-secondary);
          cursor: pointer;
          font-size: 13px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 8px;
          font-family: 'Sora', sans-serif;
          color: var(--text-primary);
          font-weight: 500;
          transition: all .15s;
          -webkit-tap-highlight-color: transparent;
        }
        .lb-page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .lb-page-btn:not(:disabled):hover {
          border-color: #f97316;
          color: #f97316;
        }
        .lb-page-active {
          background: linear-gradient(135deg, #f97316, #ea580c) !important;
          color: #fff !important;
          border: none !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 14px rgba(249,115,22,0.4) !important;
        }
        .lb-page-ellipsis {
          padding: 0 2px;
          color: var(--text-secondary);
          font-size: 13px;
        }

        /* ══════════════════════════════════════════════
           MODAL
        ══════════════════════════════════════════════ */
        .lb-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(2,6,23,.55);
          backdrop-filter: blur(6px);
          z-index: 100;
        }
        .lb-modal-sheet {
          position: fixed;
          z-index: 101;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          box-shadow: 0 -8px 40px rgba(0,0,0,.2);
          /* mobile bottom sheet */
          bottom: 0; left: 0; right: 0;
          border-radius: 24px 24px 0 0;
          max-height: 92dvh;
          overflow-y: auto;
          animation: lbSheetIn .3s cubic-bezier(.22,.61,.36,1);
        }
        .lb-drag-handle {
          display: flex; justify-content: center;
          padding: 12px 0 4px;
        }
        .lb-drag-pill {
          width: 40px; height: 4px;
          border-radius: 99px;
          background: var(--border-color);
        }
        .lb-modal-header {
          padding: 16px 20px;
          position: relative;
        }
        .lb-modal-close {
          position: absolute; top: 12px; right: 14px;
          width: 32px; height: 32px;
          border-radius: 10px;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          cursor: pointer;
          font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary);
          transition: all .15s;
        }
        .lb-modal-close:hover {
          background: var(--border-color);
          color: var(--text-primary);
        }
        .lb-modal-header-inner {
          display: flex; align-items: center; gap: 12px;
        }
        .lb-modal-icon {
          width: 50px; height: 50px;
          border-radius: 15px;
          flex-shrink: 0;
          background: var(--input-bg);
          display: flex; align-items: center; justify-content: center;
        }
        .lb-modal-title {
          font-size: 17px; font-weight: 800;
          color: var(--text-primary);
          font-family: 'Sora', sans-serif;
          line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .lb-modal-subtitle {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 3px;
        }
        .lb-modal-body { padding: 18px 20px 32px; }

        .lb-modal-prog-wrap { margin-bottom: 18px; }
        .lb-modal-prog-row {
          display: flex; justify-content: space-between;
          margin-bottom: 7px;
        }
        .lb-modal-prog-label {
          font-size: 11px; font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: .07em;
        }
        .lb-modal-prog-pct { font-size: 13px; font-weight: 700; }
        .lb-modal-prog-track {
          height: 8px; border-radius: 99px;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        .lb-modal-prog-fill {
          height: 100%; border-radius: 99px;
          transition: width .6s cubic-bezier(.22,.61,.36,1);
        }

        /* ── Stats grid ── */
        .lb-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .lb-stat-card {
          border-radius: 14px;
          padding: 12px 14px;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
        }
        .lb-stat-label {
          font-size: 9px; font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: .08em;
          margin-bottom: 5px;
        }
        .lb-stat-value {
          font-weight: 800;
          font-family: 'Sora', sans-serif;
          line-height: 1.2;
          word-break: break-word;
          color: var(--text-primary);
        }
        /* accent colors per stat type */
        .lb-stat-alloc .lb-stat-value { color: #f97316; }
        .lb-stat-used  .lb-stat-value { color: #ef4444; }
        .lb-stat-rem   .lb-stat-value { color: #22c55e; }
        .lb-stat-cf    .lb-stat-value { color: #f59e0b; }
        .lb-stat-enc   .lb-stat-value { color: #8b5cf6; }
        .lb-stat-type  .lb-stat-value { color: var(--text-secondary); font-size: 13px !important; }

        .lb-stat-suffix {
          font-size: 10px; font-weight: 500;
          color: var(--text-secondary);
          margin-left: 3px;
        }

        /* ── Desktop modal centered ── */
        @media (min-width: 640px) {
          .lb-modal-responsive {
            bottom: auto !important;
            left: 50% !important;
            right: auto !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: min(500px, calc(100vw - 32px)) !important;
            border-radius: 24px !important;
            max-height: 90vh !important;
            box-shadow: 0 32px 80px rgba(0,0,0,.25), 0 0 0 1px var(--border-color) !important;
            animation: lbModalIn .28s cubic-bezier(.22,.61,.36,1) !important;
          }
          .lb-drag-handle { display: none !important; }
        }

        /* ── Keyframes ── */
        @keyframes lbSheetIn {
          from { transform: translateY(100%) }
          to   { transform: translateY(0) }
        }
        @keyframes lbModalIn {
          from { opacity:0; transform:translate(-50%,-46%) scale(.95) }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
        }
        @keyframes lbSpin   { to { transform: rotate(360deg) } }
        @keyframes lbCardIn {
          from { opacity: 0; transform: translateY(10px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </>
  );
}