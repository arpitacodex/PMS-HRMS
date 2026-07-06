"use client";
// ─── ReplyPreview ─────────────────────────────────────────────────────────────
// Two uses:
//  1. Input-area banner  — shown above the message box while composing a reply.
//     Props: message (the message being replied to), onCancel, compact=false
//
//  2. Quoted-message bar — rendered inside MessageBubble above the bubble body.
//     Props: message (the parent message object), compact=true
//
// Both read message.reply_to / message.replyTo (the parent snapshot attached by
// the backend) or fall back gracefully when the parent is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

import { X, Reply, FileText, Image as ImageIcon, Film, Music } from "lucide-react";

// Tiny helper — resolve a file-path or full URL
const STATIC_BASE = "http://localhost:8080";
const resolveUrl = (p) => {
  if (!p) return "";
  const s = String(p).replace(/\\/g, "/").replace(/^\.?\/?public\//, "").replace(/^\/+/, "");
  if (/^https?:\/\//i.test(s) || s.startsWith("blob:")) return s;
  return `${STATIC_BASE}/${s}`;
};

// Pick an icon for a non-image attachment
function AttachIcon({ mime = "" }) {
  if (mime.startsWith("video/")) return <Film size={13} className="shrink-0" />;
  if (mime.startsWith("audio/")) return <Music size={13} className="shrink-0" />;
  return <FileText size={13} className="shrink-0" />;
}

// Derive a human-readable summary of the replied-to content
function replySnippet(parent) {
  if (!parent) return "Original message";
  const atts = Array.isArray(parent.attachments) ? parent.attachments : [];
  let text = parent.message || parent.text || "";

  // ── Strip @[Name](id) mention syntax ──────────────────
  text = text.replace(/@\[([^\]]+)\]\(\d+\)/g, "@$1");

  if (text) return text.length > 80 ? text.slice(0, 77) + "…" : text;

  if (atts.length === 1) {
    const a = atts[0];
    const mime = a.file_type || a.mime_type || a.type || "";
    if (mime.startsWith("image/")) return "📷 Photo";
    if (mime.startsWith("video/")) return "🎥 Video";
    if (mime.startsWith("audio/")) return "🎵 Audio";
    return `📎 ${a.file_name || a.original_name || "File"}`;
  }
  if (atts.length > 1) return `📎 ${atts.length} files`;
  return "Original message";
}

// Thumbnail of the first image attachment (if any)
function ReplyThumbnail({ attachments = [] }) {
  const first = attachments.find((a) => {
    const mime = a.file_type || a.mime_type || a.type || "";
    return mime.startsWith("image/");
  });
  if (!first) return null;
  return (
    <img
      src={resolveUrl(first.file_path || first.url)}
      alt=""
      className="w-8 h-8 rounded object-cover shrink-0 border border-white/30"
    />
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function ReplyPreview({ message, onCancel, compact = false }) {
  // Support both the raw parent object AND the nested snapshot the backend often
  // attaches under message.reply_to or message.replyTo
  const parent = message?.reply_to ?? message?.replyTo ?? message ?? null;

  const senderName = parent
    ? (parent.sender?.first_name
        ? `${parent.sender.first_name} ${parent.sender.last_name ?? ""}`.trim()
        : parent.sender_name ?? parent.senderName ?? "Someone")
    : null;

  const snippet   = replySnippet(parent);
  const atts      = Array.isArray(parent?.attachments) ? parent.attachments : [];
  const firstMime = atts[0]
    ? (atts[0].file_type || atts[0].mime_type || atts[0].type || "")
    : "";

  // ── Input-area banner (compact = false) ──────────────────────────────────
  if (!compact) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 mx-2 mb-1 rounded-xl
          bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50
          animate-slide-up"
      >
        {/* Accent bar */}
        <div className="w-0.5 h-full self-stretch bg-gradient-to-b from-orange-400 to-amber-500 rounded-full shrink-0" />

        <Reply size={14} className="text-orange-500 shrink-0" />

        {/* Thumbnail if first attachment is an image */}
        <ReplyThumbnail attachments={atts} />

        <div className="flex-1 min-w-0">
          {senderName && (
            <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 truncate">
              {senderName}
            </p>
          )}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-tight">
            {snippet}
          </p>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full
              text-gray-400 hover:text-gray-600 hover:bg-gray-200
              dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Cancel reply"
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  // ── Compact quoted bar inside a bubble (compact = true) ───────────────────
  return (
    <div
      className="flex items-center gap-1.5 mb-1.5 pl-2 pr-1 py-1 rounded-lg
        bg-black/10 dark:bg-white/10 border-l-2 border-white/60 dark:border-white/30
        max-w-full overflow-hidden"
    >
      {/* Tiny attachment icon or image thumbnail */}
      {atts.length > 0 ? (
        firstMime.startsWith("image/") ? (
          <img
            src={resolveUrl(atts[0].file_path || atts[0].url)}
            alt=""
            className="w-6 h-6 rounded object-cover shrink-0"
          />
        ) : (
          <AttachIcon mime={firstMime} />
        )
      ) : (
        <Reply size={11} className="shrink-0 opacity-70" />
      )}

      <div className="flex-1 min-w-0">
        {senderName && (
          <p className="text-[10px] font-semibold opacity-90 truncate leading-tight">
            {senderName}
          </p>
        )}
        <p className="text-[10px] opacity-70 truncate leading-tight">{snippet}</p>
      </div>
    </div>
  );
}

export default ReplyPreview;