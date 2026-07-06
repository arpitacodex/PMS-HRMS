"use client";

// ─────────────────────────────────────────────────────────────────────────────
// UnreadBadge  — orange pill shown on group/user rows in the sidebar
//
// Props:
//   count   number         — unread message count
//   max     number         — cap at this value, show "max+" (default 99)
//   size    "sm"|"md"|"lg" — default "md"
// ─────────────────────────────────────────────────────────────────────────────

export function UnreadBadge({ count = 0, max = 99, size = "md" }) {
  if (!count || count <= 0) return null;

  const label = count > max ? `${max}+` : String(count);

  const sizeClass = {
    sm: "min-w-[16px] h-4  text-[9px]  px-1",
    md: "min-w-[20px] h-5  text-[10px] px-1.5",
    lg: "min-w-[24px] h-6  text-xs     px-2",
  }[size] ?? "min-w-[20px] h-5 text-[10px] px-1.5";

  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full font-bold
        text-white select-none leading-none
        shadow-sm
        ${sizeClass}
      `}
      style={{ background: "linear-gradient(135deg,#ff6b1a,#ff9a56)" }}
    >
      {label}
    </span>
  );
}