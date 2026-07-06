"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  WifiOff, CheckCheck, Check,
  FileText, Download, Eye, Pencil, Trash2, X,
  ChevronDown, Play, Volume2, Loader2,
  MoreHorizontal, Reply, Copy, Forward, Star, Clock, AlertCircle,
  Maximize2,
} from "lucide-react";
import Swal from "sweetalert2";
import { getCurrentUserId } from "@/src/lib/auth";
import { ReactionBar, ReactionDisplay } from "./EmojiPicker";
import MentionText from "./MentionText";
import { ReplyPreview } from "./ReplyPreview";

// ─── Static file URL ──────────────────────────────────────────────────────────
const STATIC_BASE = "http://localhost:8080";

const resolveUrl = (filePath) => {
  if (!filePath) return "";
  const p = String(filePath)
    .replace(/\\/g, "/")             // backslash → forward slash (Windows DB paths)
    .replace(/^\.?\/?public\//, "")  // remove public/ or ./public/
    .replace(/^\/+/, "");            // remove leading slashes
  if (/^https?:\/\//i.test(p) || p.startsWith("blob:")) return p;
  return `${STATIC_BASE}/${p}`;
  // public\uploads\chat_documents\video.mp4
  // → http://localhost:8080/uploads/chat_documents/video.mp4 ✅
};

// ─── Time / date helpers ──────────────────────────────────────────────────────
const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "";
  const d         = new Date(dateStr);
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const same = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
  if (same(d, today))     return "Today";
  if (same(d, yesterday)) return "Yesterday";
  const diff = Math.floor((today - d) / 86400000);
  if (diff < 7) return d.toLocaleDateString("en-IN", { weekday: "long" });
  return d.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
};

const toDateKey = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 10);
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const COLORS = [
  "bg-gradient-to-br from-orange-400 to-orange-600",
  "bg-gradient-to-br from-amber-400 to-amber-600",
  "bg-gradient-to-br from-emerald-400 to-emerald-600",
  "bg-gradient-to-br from-blue-400 to-blue-600",
  "bg-gradient-to-br from-violet-400 to-violet-600",
  "bg-gradient-to-br from-pink-400 to-pink-600",
  "bg-gradient-to-br from-teal-400 to-teal-600",
  "bg-gradient-to-br from-rose-400 to-rose-600",
];
const colorFor = (n = "") => {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};
const initials = (n = "") =>
  n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

export function Avatar({ name = "", photo, size = 10, online = false }) {
  const px = size * 4;
  return (
    <div
      className="relative flex-shrink-0 transition-transform hover:scale-105"
      style={{ width: px, height: px, minWidth: px }}
    >
      {photo ? (
        <img
          src={resolveUrl(photo)}
          alt={name}
          style={{ width: px, height: px }}
          className="rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-md"
        />
      ) : (
        <div
          className={`${colorFor(name)} rounded-full flex items-center justify-center text-white font-bold shadow-md`}
          style={{ width: px, height: px, fontSize: Math.max(10, px * 0.35) }}
        >
          {initials(name) || "?"}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse" />
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ msg, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-20 right-5 z-[300] flex items-center gap-3 px-4 py-3
        rounded-xl shadow-2xl text-sm font-medium text-white backdrop-blur-sm
        animate-slide-in-right ${
          type === "error"
            ? "bg-gradient-to-r from-red-500 to-rose-500"
            : "bg-gradient-to-r from-emerald-500 to-teal-500"
        }`}
    >
      {type === "error" ? <AlertCircle size={18} /> : <Check size={18} />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 ml-2">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── ConnectionBanner ─────────────────────────────────────────────────────────
export function ConnectionBanner({ connected, error }) {
  if (connected) return null;
  return (
    <div
      className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-50 to-rose-50
        border-b border-red-200 px-4 py-2.5 text-xs font-medium text-red-600
        dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-800 dark:text-red-400
        animate-slide-down"
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <WifiOff size={13} />
        <span>{error || "Connecting to chat server…"}</span>
      </div>
    </div>
  );
}

// ─── TypingIndicator ──────────────────────────────────────────────────────────
export function TypingIndicator({ names = [] }) {
  if (!names.length) return null;
  const label =
    names.length === 1 ? `${names[0]} is typing`
    : names.length === 2 ? `${names[0]} and ${names[1]} are typing`
    : "Several people are typing";
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm
        border-t border-gray-100 dark:bg-gray-900/80 dark:border-gray-700 animate-slide-up"
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}…</span>
    </div>
  );
}

// ─── Date Separator ───────────────────────────────────────────────────────────
function DateSeparator({ label }) {
  return (
    <div className="flex items-center justify-center my-4">
      <div
        className="bg-gray-100/80 backdrop-blur-sm dark:bg-gray-800/80
          text-gray-600 dark:text-gray-300 text-[11px] font-semibold px-3 py-1.5
          rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
      >
        {label}
      </div>
    </div>
  );
}

// ─── Scroll-to-bottom button ──────────────────────────────────────────────────
export function ScrollToBottomButton({ scrollRef, messagesEndRef, unreadCount = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    const check = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setVisible(dist > 200);
    };
    el.addEventListener("scroll", check, { passive: true });
    check();
    return () => el.removeEventListener("scroll", check);
  }, [scrollRef]);
  if (!visible) return null;
  const scrollToBottom = () =>
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  return (
    <button
      onClick={scrollToBottom}
      className="absolute bottom-20 right-4 z-20 flex flex-col items-center gap-1
        group transition-all duration-200 hover:scale-110 active:scale-95 animate-bounce-in"
      title="Jump to latest message"
    >
      {unreadCount > 0 && (
        <span
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold
            px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-lg"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      <div
        className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-xl
          border border-gray-200 dark:border-gray-600 flex items-center justify-center
          group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-amber-500 transition-all duration-300"
      >
        <ChevronDown size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-white" />
      </div>
    </button>
  );
}

// ─── Message Context Menu ─────────────────────────────────────────────────────
function MessageContextMenu({ x, y, onClose, onReply, onCopy, onForward, onStar }) {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);
  return (
    <div
      className="fixed z-[200] bg-white dark:bg-gray-800 rounded-xl shadow-2xl
          border border-gray-200 dark:border-gray-700 py-1 min-w-[180px] animate-scale-in"
      style={{ top: y, left: x }}
    >
      {[
        { icon: <Reply size={14} />,   label: "Reply",   fn: onReply },
        { icon: <Copy size={14} />,    label: "Copy",    fn: onCopy },
        { icon: <Forward size={14} />, label: "Forward", fn: onForward },
        { icon: <Star size={14} />,    label: "Star",    fn: onStar },
      ].map(({ icon, label, fn }) => (
        <button
          key={label}
          onClick={fn}
          className="w-full px-4 py-2 text-left text-sm
            hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

// ─── Message Actions Dropdown ─────────────────────────────────────────────────
// onReply    — always shown (sender & receiver can both reply)
// canEdit    — only shown for message owner within 1 hr
// canDelete  — only shown for message owner
function MessageActionsMenu({ onEdit, onDelete, onReply, canEdit, canDelete, editing }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  if (editing) return null;
  return (
    <div ref={ref} className="relative flex-shrink-0 self-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-6 h-6 rounded-full flex items-center justify-center
          text-gray-400 hover:text-gray-600 hover:bg-gray-100
          dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-all duration-150"
        title="Message actions"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div
          className="absolute bottom-full mb-1 right-0 z-[150]
            bg-white dark:bg-gray-800 rounded-xl shadow-2xl
            border border-gray-200 dark:border-gray-700 py-1 min-w-[130px] animate-scale-in"
        >
          {/* ── Reply — visible to everyone ── */}
          <button
            onClick={() => { setOpen(false); onReply?.(); }}
            className="w-full px-3 py-2 text-left text-xs font-medium
              hover:bg-orange-50 dark:hover:bg-orange-900/30
              flex items-center gap-2 transition-colors text-gray-700 dark:text-gray-200"
          >
            <Reply size={12} className="text-orange-500" /> Reply
          </button>

          {/* ── Edit — only message owner, within 1 hr ── */}
          {canEdit && (
            <button
              onClick={() => { setOpen(false); onEdit?.(); }}
              className="w-full px-3 py-2 text-left text-xs font-medium
                hover:bg-orange-50 dark:hover:bg-orange-900/30
                flex items-center gap-2 transition-colors text-gray-700 dark:text-gray-200"
            >
              <Pencil size={12} className="text-orange-500" /> Edit
            </button>
          )}

          {/* ── Delete — only message owner ── */}
          {canDelete && (
            <button
              onClick={() => { setOpen(false); onDelete?.(); }}
              className="w-full px-3 py-2 text-left text-xs font-medium
                hover:bg-red-50 dark:hover:bg-red-900/30
                flex items-center gap-2 transition-colors text-gray-700 dark:text-gray-200"
            >
              <Trash2 size={12} className="text-red-500" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Attachment type helper ───────────────────────────────────────────────────
const getFileType = (att) => {
  const ft = (att.file_type || att.type || "").toLowerCase();
  if (ft === "image") return "image";
  if (ft === "video") return "video";
  if (ft === "audio") return "audio";
  if (ft === "file")  return "file";
  const n = (att.original_name || att.originalname || "").toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(n)) return "image";
  if (/\.(mp4|webm|mov|avi|mkv|flv)$/i.test(n))      return "video";
  if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(n))           return "audio";
  return "file";
};

// ─── Video Lightbox (fullscreen overlay) ─────────────────────────────────────
// Opens when user clicks the play button or the expand icon on a video bubble.
// autoPlay starts the video immediately. Esc or clicking the backdrop closes it.
function VideoLightbox({ url, name, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    // Keyboard: Esc to close
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    // Prevent background scroll while open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Pause video when overlay closes so audio doesn't keep playing
      videoRef.current?.pause();
    };
  }, [onClose]);

  // Close only when clicking the dark backdrop (not the video element itself)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center
        justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Top bar: filename + close button */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-3 px-1">
        <p className="text-white/70 text-sm font-medium truncate max-w-[80%]">{name}</p>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25
            flex items-center justify-center text-white transition-all hover:scale-110"
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Video — autoPlay so it starts immediately when lightbox opens */}
      <video
        ref={videoRef}
        src={url}
        controls
        autoPlay
        playsInline
        className="w-full max-w-5xl max-h-[80vh] rounded-2xl shadow-2xl bg-black animate-scale-in"
        style={{ outline: "none" }}
      />

      <p className="text-white/30 text-xs mt-3 select-none">
        Click outside or press Esc to close
      </p>
    </div>
  );
}

// ─── ImgAtt ───────────────────────────────────────────────────────────────────
function ImgAtt({ att, isMine, onOpen, onDeleteAtt }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr]       = useState(false);
  const [hover, setHover]   = useState(false);
  const url = resolveUrl(att.file_path || att.path || "");

  if (err) return <FileAtt att={att} isMine={isMine} />;

  const handleDelete = async (e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title:              "Delete this image?",
      text:               "This will be deleted for everyone and cannot be undone.",
      icon:               "warning",
      showCancelButton:   true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor:  "#6b7280",
      confirmButtonText:  "Yes, delete it",
      cancelButtonText:   "Cancel",
      customClass: {
        popup:         "rounded-2xl shadow-2xl",
        confirmButton: "rounded-xl px-5 py-2 font-semibold",
        cancelButton:  "rounded-xl px-5 py-2 font-semibold",
      },
    });
    if (result.isConfirmed) onDeleteAtt?.(att.id);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {!loaded && (
        <div className="w-[240px] h-36 bg-gradient-to-r from-gray-200 to-gray-300
          dark:from-gray-700 dark:to-gray-600 animate-pulse flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={url}
        alt={att.original_name || "image"}
        className={`max-w-[240px] max-h-64 w-full object-cover cursor-pointer
          transition-all duration-500
          ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95 absolute"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErr(true)}
        onClick={() => onOpen?.(url)}
      />
      {loaded && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300 flex items-center justify-center"
          style={{ background: hover ? "rgba(0,0,0,0.25)" : "transparent" }}
        >
          <div className={`transition-opacity duration-200 ${hover ? "opacity-100" : "opacity-0"}`}>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <Eye size={18} className="text-white" />
            </div>
          </div>
          {isMine && onDeleteAtt && (
            <button
              className="pointer-events-auto absolute top-2 right-2
                w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 shadow-lg
                flex items-center justify-center transition-all hover:scale-110"
              style={{ opacity: hover ? 1 : 0, transition: "opacity 0.2s" }}
              title="Delete this image"
              onClick={handleDelete}
            >
              <Trash2 size={12} className="text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── VideoAtt ─────────────────────────────────────────────────────────────────
// Shows a thumbnail card in the chat bubble.
// Clicking anywhere on the card (play button or expand icon) opens the
// VideoLightbox fullscreen overlay — video never plays inline in the bubble.
function VideoAtt({ att, isMine }) {
  const [lightbox, setLightbox] = useState(false);
  const [hover, setHover]       = useState(false);
  const [error, setError]       = useState(false);

  const url  = resolveUrl(att.file_path || att.path || "");
  const name = att.original_name || att.originalname || "video";

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 max-w-[280px]
        bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-red-700 dark:text-red-400">Video unavailable</p>
          <p className="text-[10px] text-red-500 truncate max-w-[180px]">{name}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen lightbox — rendered in place (z-[1000] floats above everything) */}
      {lightbox && (
        <VideoLightbox url={url} name={name} onClose={() => setLightbox(false)} />
      )}

      {/* Thumbnail card */}
      <div
        className="relative max-w-[280px] rounded-2xl overflow-hidden bg-black
          shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setLightbox(true)}
      >
        {/* Hidden video just to generate a poster/thumbnail frame */}
        <video
          src={url}
          preload="metadata"
          playsInline
          muted
          className="w-full max-h-48 block pointer-events-none"
          onError={() => setError(true)}
        />

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center
          group-hover:bg-black/55 transition-all duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4
            group-hover:scale-110 transition-transform duration-300">
            <Play size={30} className="text-white" fill="white" />
          </div>
        </div>

        {/* Expand icon — top-right, visible on hover */}
        <div
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50
            hover:bg-black/75 flex items-center justify-center text-white
            transition-all hover:scale-110"
          style={{ opacity: hover ? 1 : 0, transition: "opacity 0.2s" }}
          title="Watch fullscreen"
          onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
        >
          <Maximize2 size={14} />
        </div>

        {/* Filename badge at bottom */}
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm">
          <p className="text-[10px] text-white/80 truncate">{name}</p>
        </div>
      </div>
    </>
  );
}

// ─── AudioAtt ─────────────────────────────────────────────────────────────────
function AudioAtt({ att, isMine }) {
  const url  = resolveUrl(att.file_path || att.path || "");
  const name = att.original_name || att.originalname || "audio";
  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl px-4 py-3 max-w-[280px]
        shadow-md transition-all duration-300 hover:shadow-lg
        ${isMine
          ? "bg-gradient-to-r from-orange-500 to-amber-500"
          : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700"
        }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${isMine ? "bg-white/30" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
        >
          <Volume2 size={14} className="text-white" />
        </div>
        <span
          className={`text-xs font-semibold truncate max-w-[180px]
            ${isMine ? "text-white" : "text-gray-700 dark:text-gray-200"}`}
        >
          {name}
        </span>
      </div>
      <audio src={url} controls className="w-full h-8 rounded-lg" />
    </div>
  );
}

// ─── FileAtt ──────────────────────────────────────────────────────────────────
function FileAtt({ att, isMine }) {
  const url  = resolveUrl(att.file_path || att.path || "");
  const name = att.original_name || att.originalname || "file";
  const ext  = name.split(".").pop()?.toUpperCase() ?? "FILE";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={name}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 max-w-[280px]
        transition-all duration-300 group hover:shadow-lg transform hover:-translate-y-0.5
        ${isMine
          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          : "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-800 dark:to-gray-700"
        }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${isMine ? "bg-white/20" : "bg-gradient-to-r from-orange-400 to-amber-400"}`}
      >
        <FileText size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isMine ? "text-white" : "text-gray-800 dark:text-gray-100"}`}>
          {name}
        </p>
        <p className={`text-[10px] mt-0.5 ${isMine ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
          {ext} • tap to download
        </p>
      </div>
      <Download
        size={16}
        className={`flex-shrink-0 transition-transform group-hover:translate-y-0.5
          ${isMine ? "text-white/80 group-hover:text-white" : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200"}`}
      />
    </a>
  );
}

// ─── AttItem ──────────────────────────────────────────────────────────────────
function AttItem({ att, isMine, onImageOpen, onDeleteAtt }) {
  const t = getFileType(att);
  if (t === "image") return <ImgAtt att={att} isMine={isMine} onOpen={onImageOpen} onDeleteAtt={onDeleteAtt} />;
  if (t === "video") return <VideoAtt att={att} isMine={isMine} />;
  if (t === "audio") return <AudioAtt att={att} isMine={isMine} />;
  return <FileAtt att={att} isMine={isMine} />;
}

// ─── MessageBubble ────────────────────────────────────────────────────────────
export function MessageBubble({
  message: m,
  showSender = false,
  onEdit,
  onDelete,
  onDeleteAttachment,
  reactions,
  onReact,
  onReply,
  allUsers = [],
}) {
  const currentUserId = getCurrentUserId();
  const isMine = Number(m.sender_id) === Number(currentUserId);

  const [lightbox, setLightbox]               = useState(null);
  const [editing, setEditing]                 = useState(false);
  const [editText, setEditText]               = useState(m.message || "");
  const [showMenu, setShowMenu]               = useState(false);
  const [menuPos, setMenuPos]                 = useState({ x: 0, y: 0 });
  const [showReactionBar, setShowReactionBar] = useState(false);

  const time       = formatTime(m.created_at);
  const senderName = m.sender?.first_name
    ? `${m.sender.first_name} ${m.sender.last_name ?? ""}`.trim()
    : m.sender_name ?? "";

  const isDeleted = !!(
    m.is_deleted || m.isDeleted || m.deleted_at || m.deletedAt ||
    m.message_deleted_at || m._attachments_deleted
  );

  const canEdit = !isDeleted && (() => {
    if (!m.created_at) return false;
    return Date.now() - new Date(m.created_at).getTime() < 60 * 60 * 1000;
  })();

  const attachments = isDeleted ? [] : (Array.isArray(m.attachments) ? m.attachments : []);
  const hasText     = isDeleted ? false : !!(m.message || m.text);
  const hasFiles    = attachments.length > 0;

  const allImagesOnly =
    !hasText && attachments.length > 0 && attachments.every((a) => getFileType(a) === "image");

  const isEmpty       = !isDeleted && !hasText && !hasFiles;
  const showAsDeleted = isEmpty && !isMine;
  const hideEntirely  = isEmpty && isMine;
  const isMentioned   = !!m.is_mentioned && !isMine;

  const handleEditSave = async () => {
    if (!editText.trim() || editText.trim() === m.message) { setEditing(false); return; }
    try { await onEdit?.(m.id, editText.trim()); setEditing(false); } catch {}
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  if (hideEntirely) return null;

  const avatarEl = (
    <Avatar name={senderName || "?"} photo={m.sender?.profile_photo} size={8} />
  );

  return (
    <>
      {/* Image lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <img
            src={lightbox}
            alt="full"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl animate-scale-in"
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30
              rounded-full flex items-center justify-center text-white text-2xl transition-all hover:scale-110"
          >
            ×
          </button>
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <MessageContextMenu
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setShowMenu(false)}
          onReply={() => { onReply?.(m); setShowMenu(false); }}
          onCopy={() => { if (m.message) navigator.clipboard.writeText(m.message); setShowMenu(false); }}
          onForward={() => {}}
          onStar={() => {}}
        />    )}

      {/* Message row */}
      <div
        className={`flex items-end gap-2 group relative
          ${isMine ? "justify-end" : "justify-start"}
          ${isMentioned
            ? "rounded-xl px-2 py-1 -mx-2 bg-amber-50/60 dark:bg-amber-900/10 border-l-2 border-amber-400"
            : ""
          }`}
        onMouseEnter={() => setShowReactionBar(true)}
        onMouseLeave={() => setShowReactionBar(false)}
        onContextMenu={handleContextMenu}
      >
        {!isMine && avatarEl}

        <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>

          {!isMine && senderName && (
            <span
              className="text-[11px] font-bold px-1 mb-0.5 truncate max-w-full bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${colorFor(senderName).split(" ")[1]}, ${colorFor(senderName).split(" ")[2]})`,
              }}
            >
              {senderName}
            </span>
          )}

          <div className="relative w-full">
            {showReactionBar && !isDeleted && !editing && (
              <ReactionBar
                messageId={m.id}
                isMine={isMine}
                onReact={(msgId, emoji) => { onReact?.(msgId, emoji); setShowReactionBar(false); }}
                onMoreReactions={() => setShowReactionBar(false)}
              />
            )}

            {editing ? (
              <div className="flex items-center gap-2 max-w-xs animate-slide-up">
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border-2 border-orange-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-800
                    text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleEditSave}
                  className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500
                    hover:from-orange-600 hover:to-amber-600 rounded-xl flex items-center
                    justify-center text-white transition-all hover:scale-110"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700
                    rounded-xl flex items-center justify-center transition-all hover:scale-110"
                >
                  <X size={14} />
                </button>
              </div>

            ) : isDeleted || showAsDeleted ? (
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed
                  text-sm backdrop-blur-sm animate-fade-in
                  ${isMine
                    ? "border-orange-300/50 bg-orange-50/50 dark:bg-orange-900/20"
                    : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50"
                  }`}
              >
                <Clock size={14} className="opacity-50" />
                <span className={`text-xs font-medium ${isMine ? "text-orange-600/70 dark:text-orange-400/60" : "text-gray-500 dark:text-gray-400"}`}>
                  This message was deleted
                </span>
              </div>

            ) : allImagesOnly ? (
              <div className={`flex flex-col gap-2 ${isMine ? "items-end" : "items-start"} animate-scale-in`}>
                {attachments.map((att, i) => (
                  <ImgAtt
                    key={att.id ?? i}
                    att={att}
                    isMine={isMine}
                    onOpen={setLightbox}
                    onDeleteAtt={onDeleteAttachment ? (attId) => onDeleteAttachment(m.id, attId) : undefined}
                  />
                ))}
              </div>

            ) : (
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                  shadow-md transition-all duration-300 hover:shadow-lg
                  ${isMine
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-br-sm"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                  } ${m._temp ? "opacity-60" : ""} animate-slide-up`}
              >
                {/* Quoted reply snippet */}
                {(m.reply_to || m.replyTo) && (
                  <ReplyPreview message={m.reply_to ?? m.replyTo} compact={true} />
                )}
                {hasFiles && (
                  <div className={`flex flex-col gap-2 ${hasText ? "mb-2" : ""}`}>
                    {attachments.map((att, i) => (
                      <AttItem
                        key={att.id ?? i}
                        att={att}
                        isMine={isMine}
                        onImageOpen={setLightbox}
                        onDeleteAtt={onDeleteAttachment ? (attId) => onDeleteAttachment(m.id, attId) : undefined}
                      />
                    ))}
                  </div>
                )}
                {hasText && (
                  <MentionText text={m.message || m.text} currentUserId={currentUserId} isMine={isMine} />
                )}
                {m.is_edited && !isDeleted && (
                  <span className={`text-[10px] ml-1 opacity-70 ${isMine ? "text-white/80" : "text-gray-400"}`}>
                    edited
                  </span>
                )}
              </div>
            )}
          </div>

          {!isDeleted && reactions && Object.keys(reactions).length > 0 && (
            <ReactionDisplay
              reactions={reactions}
              currentUserId={currentUserId}
              onToggleReaction={(emoji) => onReact?.(m.id, emoji)}
              allUsers={allUsers}
            />
          )}

          {!isDeleted && (
            <div className={`flex items-center gap-1 px-1 mt-0.5 ${isMine ? "flex-row-reverse" : ""}`}>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{time}</span>
              {isMine &&
                (m.is_read
                  ? <CheckCheck size={11} className="text-blue-500" />
                  : <Check size={11} className="text-gray-400 dark:text-gray-600" />
                )}
              {!editing && (
                <MessageActionsMenu
                  editing={editing}
                  canEdit={canEdit && isMine}
                  canDelete={isMine}
                  onEdit={() => { setEditing(true); setEditText(m.message || ""); }}
                  onDelete={() => onDelete?.(m.id)}
                  onReply={() => onReply?.(m)}
                />
              )}
            </div>
          )}
        </div>

        {isMine && avatarEl}
      </div>
    </>
  );
}

// ─── MessageList ──────────────────────────────────────────────────────────────
export function MessageList({
  messages = [],
  showSender = false,
  onEdit,
  onDelete,
  onDeleteAttachment,
  getReactions,
  onReact,
  onReply,
  allUsers = [],
}) {
  let lastDateKey = null;
  return (
    <div className="space-y-3">
      {messages.map((m, idx) => {
        const dk       = toDateKey(m.created_at);
        const showDate = dk && dk !== lastDateKey;
        lastDateKey    = dk;
        return (
          <div
            key={m.id || idx}
            className="animate-slide-up"
            style={{ animationDelay: `${idx * 0.02}s` }}
          >
            {showDate && <DateSeparator label={formatDateLabel(m.created_at)} />}
            <MessageBubble
              message={m}
              showSender={showSender}
              onEdit={onEdit}
              onDelete={onDelete}
              onDeleteAttachment={onDeleteAttachment}
              reactions={getReactions?.(m.id)}
              onReact={onReact}
              onReply={onReply}
              allUsers={allUsers}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Global animation styles ──────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slide-up        { from{opacity:0;transform:translateY(20px)}  to{opacity:1;transform:translateY(0)} }
    @keyframes slide-down      { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slide-in-right  { from{opacity:0;transform:translateX(100px)} to{opacity:1;transform:translateX(0)} }
    @keyframes fade-in         { from{opacity:0}                             to{opacity:1} }
    @keyframes scale-in        { from{opacity:0;transform:scale(0.9)}        to{opacity:1;transform:scale(1)} }
    @keyframes bounce-in       { 0%{opacity:0;transform:scale(0.3)} 50%{opacity:1;transform:scale(1.05)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
    .animate-slide-up          { animation: slide-up       0.3s ease-out; }
    .animate-slide-down        { animation: slide-down     0.3s ease-out; }
    .animate-slide-in-right    { animation: slide-in-right 0.3s ease-out; }
    .animate-fade-in           { animation: fade-in        0.2s ease-out; }
    .animate-scale-in          { animation: scale-in       0.2s ease-out; }
    .animate-bounce-in         { animation: bounce-in      0.4s cubic-bezier(0.68,-0.55,0.265,1.55); }
  `;
  document.head.appendChild(style);
}

export function MessageAttachments() { return null; }