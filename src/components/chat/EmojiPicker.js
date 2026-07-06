// src/components/chat/EmojiPicker.js
// ─────────────────────────────────────────────────────────────────────────────
// Exports:
//   <EmojiPickerButton>   — 😊 button that opens a full emoji grid picker
//                           onEmojiSelect(emoji) called when user picks one
//   <ReactionBar>         — hover bar with quick reaction emojis (6 icons)
//                           shown above/below a message bubble on hover
//   <ReactionDisplay>     — renders reaction counts below a bubble
//                           frontend-only state (backend-ready structure)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Smile, X, Search, ChevronDown } from "lucide-react";

// ── Emoji dataset (no external dependency) ────────────────────────────────────
const CATEGORIES = [
  {
    label: "😀 Smileys",
    icon: "😀",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃",
      "😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙",
      "🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫",
      "🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬",
      "🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢",
      "🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸",
      "😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲",
      "😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱",
      "😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠",
    ],
  },
  {
    label: "👋 People",
    icon: "👋",
    emojis: [
      "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞",
      "🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍",
      "👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝",
      "🙏","✍️","💅","🤳","💪","🦵","🦶","👂","🦻","👃",
      "🧠","🦷","🦴","👀","👁️","👅","👄","💋","👶","🧒",
      "👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵",
      "🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦","🤷",
    ],
  },
  {
    label: "❤️ Hearts",
    icon: "❤️",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
      "❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️",
      "✝️","☪️","🕉️","✡️","🔯","🕎","☯️","☦️","🛐","⛎",
      "💯","🔥","💥","✨","🌟","⭐","🌠","🎇","🎆","🌈",
    ],
  },
  {
    label: "🐶 Animals",
    icon: "🐶",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
      "🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧",
      "🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄",
      "🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂",
      "🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀",
      "🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆",
    ],
  },
  {
    label: "🍕 Food",
    icon: "🍕",
    emojis: [
      "🍕","🍔","🌮","🌯","🥗","🥘","🍜","🍝","🍛","🍣",
      "🍱","🍤","🍙","🍚","🍘","🍥","🥮","🍢","🧆","🥚",
      "🍳","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍟",
      "🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫",
      "🍬","🍭","🍮","🍯","🍼","🥤","🧃","☕","🍵","🧋",
      "🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾",
    ],
  },
  {
    label: "⚽ Activity",
    icon: "⚽",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱",
      "🏓","🏸","🏒","🥊","🥋","🎽","🛹","🛼","🛷","⛸️",
      "🥅","⛳","🏹","🎣","🤿","🎽","🎿","🛷","🥌","🎯",
      "🎮","🎲","🧩","🎭","🎨","🖼️","🎰","🚂","🚃","🚄",
    ],
  },
  {
    label: "🚀 Travel",
    icon: "🚀",
    emojis: [
      "🚀","✈️","🚂","🚗","🚕","🚙","🚌","🚎","🏎️","🚓",
      "🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🚲",
      "🛴","🛺","🚁","🛸","⛵","🚤","🛥️","🛳️","⛴️","🚢",
      "🗺️","🗾","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️",
      "🏝️","🏞️","🏟️","🏛️","🏗️","🏘️","🏚️","🏠","🏡","🏢",
    ],
  },
  {
    label: "💡 Objects",
    icon: "💡",
    emojis: [
      "💡","🔦","🕯️","🪔","🧯","🛢️","💰","💴","💵","💸",
      "💳","🪙","💎","⚖️","🔧","🪛","🔨","⛏️","⚙️","🗜️",
      "🔩","🪤","🧲","🔫","💣","🪖","🛡️","🔪","🗡️","⚔️",
      "🪚","🔬","🔭","📡","💉","🩸","💊","🩹","🩺","🚪",
      "🪞","🪟","🛋️","🪑","🚽","🪠","🚿","🛁","🪤","🧴",
      "📱","💻","⌨️","🖥️","🖨️","🖱️","🖲️","💾","💿","📀",
    ],
  },
  {
    label: "🔣 Symbols",
    icon: "🔣",
    emojis: [
      "✅","❌","❎","🔴","🟠","🟡","🟢","🔵","🟣","⚫",
      "⚪","🟤","🔶","🔷","🔸","🔹","🔺","🔻","💠","🔘",
      "🔲","🔳","▪️","▫️","◾","◽","◼️","◻️","🟥","🟧",
      "🟨","🟩","🟦","🟪","⬛","⬜","🔈","🔉","🔊","📢",
      "📣","🔔","🔕","🎵","🎶","💬","💭","🗯️","♻️","🚮",
      "🚰","♿","🚹","🚺","🚻","🚼","🚾","🛂","🛃","🛄",
    ],
  },
];

// Quick reaction emojis shown on hover
export const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

// ── EmojiPickerButton ─────────────────────────────────────────────────────────
export function EmojiPickerButton({ onEmojiSelect, disabled }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const popupRef  = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      // Auto-focus search
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback((emoji) => {
    onEmojiSelect(emoji);
    // Keep open so user can pick multiple
  }, [onEmojiSelect]);

  // Search across all categories
  const searchResults = search.trim()
    ? CATEGORIES.flatMap((c) => c.emojis).filter((e) =>
        e.includes(search.trim())
      ).slice(0, 60)
    : null;

  const displayEmojis = searchResults ?? CATEGORIES[activeTab]?.emojis ?? [];

  return (
    <div className="relative" ref={popupRef}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen((v) => !v); setSearch(""); }}
        className={`p-2 rounded-lg transition-all duration-200
          ${open
            ? "bg-amber-100 text-amber-500 scale-110"
            : "hover:bg-gray-100 text-gray-400 hover:text-amber-500"}
          disabled:opacity-40`}
        title="Emoji"
      >
        <Smile size={18} />
      </button>

      {/* Picker popup */}
      {open && (
        <div
          className="absolute bottom-12 left-0 z-[100]
            bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
            border border-gray-200 dark:border-gray-700
            w-[320px] flex flex-col overflow-hidden
            animate-emoji-pop"
          style={{ animation: "emojiPop 0.18s cubic-bezier(.34,1.56,.64,1) both" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Emoji
            </span>
            <button
              onClick={() => { setOpen(false); setSearch(""); }}
              className="w-6 h-6 rounded-full flex items-center justify-center
                text-gray-400 hover:text-gray-600 hover:bg-gray-100
                dark:hover:bg-gray-800 transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search emoji…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-xl
                  bg-gray-100 dark:bg-gray-800 border-0
                  focus:outline-none focus:ring-2 focus:ring-amber-400
                  text-gray-800 dark:text-gray-100 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Category tabs — hidden during search */}
          {!search.trim() && (
            <div className="flex gap-0.5 px-2 pb-1 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  title={cat.label}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg text-base flex items-center justify-center
                    transition-all duration-150
                    ${activeTab === i
                      ? "bg-amber-100 dark:bg-amber-900/40 scale-110"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div className="overflow-y-auto px-2 pb-3"
            style={{ maxHeight: 220 }}>
            {displayEmojis.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No emoji found
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-0.5">
                {displayEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(emoji)}
                    className="w-9 h-9 rounded-lg text-xl flex items-center justify-center
                      hover:bg-amber-50 dark:hover:bg-amber-900/30
                      hover:scale-125 transition-all duration-100
                      active:scale-95"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category label */}
          {!search.trim() && (
            <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {CATEGORIES[activeTab]?.label}
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes emojiPop {
          from { opacity: 0; transform: scale(0.85) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── ReactionBar ───────────────────────────────────────────────────────────────
// Shown on message hover — 6 quick emoji + "more" button
export function ReactionBar({ messageId, isMine, onReact, onMoreReactions }) {
  const [hovered, setHovered] = useState(null);

  return (
    // BUG 3 FIX: was "right-full mr-2" / "left-full ml-2" — positions the bar
    // outside the bubble element. On narrow screens or when the bubble sits near
    // the viewport edge, the bar escapes the scroll container and is invisible.
    // Now floats ABOVE the bubble (-top-10) anchored to the same side as the
    // bubble, which always stays inside the chat column.
    <div
      className={`absolute -top-10 z-30
        ${isMine ? "right-0" : "left-0"}
        flex items-center gap-0.5
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-full px-1.5 py-1
        shadow-xl`}
      style={{ animation: "reactionBarIn 0.16s cubic-bezier(.34,1.56,.64,1) both" }}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact?.(messageId, emoji)}
          onMouseEnter={() => setHovered(emoji)}
          onMouseLeave={() => setHovered(null)}
          className="relative w-7 h-7 rounded-full flex items-center justify-center
            text-base transition-all duration-150
            hover:bg-amber-50 dark:hover:bg-amber-900/40
            hover:scale-150 active:scale-90"
        >
          {emoji}
          {hovered === emoji && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2
              bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded-md
              whitespace-nowrap pointer-events-none shadow-lg z-50">
              {emoji}
            </span>
          )}
        </button>
      ))}

      {/* More reactions button */}
      <button
        onClick={() => onMoreReactions?.(messageId)}
        className="w-7 h-7 rounded-full flex items-center justify-center
          text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-all duration-150 text-xs"
        title="More reactions"
      >
        <Smile size={14} />
      </button>

      <style>{`
        @keyframes reactionBarIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── ReactionDisplay ───────────────────────────────────────────────────────────
// Shows reaction counts below a message bubble
// reactions = { "❤️": [userId1, userId2], "😂": [userId3] }
// Change signature to accept allUsers
export function ReactionDisplay({ reactions, currentUserId, onToggleReaction, allUsers = [] }) {
  const [tooltip, setTooltip] = useState(null);

  if (!reactions || Object.keys(reactions).length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(reactions).map(([emoji, users]) => {
        const count    = users.length;
        const iReacted = users.some(u => Number(u.user_id) === Number(currentUserId));
        const reactors = users.map(u => {
          if (!u || typeof u !== "object") return "Unknown";
          const first = typeof u.first_name === "string" ? u.first_name : "";
          const last  = typeof u.last_name  === "string" ? u.last_name  : "";
          return `${first} ${last}`.trim() || `User ${u.user_id ?? "?"}`;
        });

        return (
          <div key={emoji} className="relative">
            <button
              onClick={() => onToggleReaction?.(emoji)}
              onMouseEnter={() => setTooltip(emoji)}
              onMouseLeave={() => setTooltip(null)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                border transition-all duration-200 hover:scale-110 active:scale-95
                ${iReacted
                  ? "bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/40 dark:border-amber-500"
                  : "bg-white border-gray-200 text-gray-600 hover:border-amber-300 dark:bg-gray-800 dark:border-gray-600"
                }`}
            >
              <span className="text-sm">{emoji}</span>
              <span className="font-semibold">{count}</span>
            </button>

            {tooltip === emoji && reactors.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 z-50
                bg-gray-900 text-white text-[11px] rounded-xl px-3 py-2
                shadow-xl whitespace-nowrap min-w-max max-w-[200px]">
                <div className="flex flex-col gap-1">
                  {reactors.slice(0, 10).map((name, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] font-bold">
                        {name[0]?.toUpperCase()}
                      </div>
                      <span>{name}</span>
                    </div>
                  ))}
                  {reactors.length > 10 && (
                    <span className="text-gray-400">+{reactors.length - 10} more</span>
                  )}
                </div>
                <div className="absolute top-full left-3 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── useReactions (frontend-only state, backend-ready) ─────────────────────────
// Manages reaction state per message in a Map.
// Structure: { [messageId]: { [emoji]: [userId, ...] } }
// When backend is ready, replace setReactions calls with API calls.
export function useReactions(currentUserId) {
  const [reactions, setReactions] = useState(() => {
    try {
      const stored = localStorage.getItem("chat_reactions");
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    try { localStorage.setItem("chat_reactions", JSON.stringify(reactions)); } catch {}
  }, [reactions]);

// AFTER
const toggleReaction = useCallback((messageId, emoji) => {
  setReactions((prev) => {
    const msgReactions = { ...(prev[messageId] || {}) };
    const uid = Number(currentUserId);

    // Find if user already reacted with ANY emoji on this message
    const previousEmoji = Object.keys(msgReactions).find((e) =>
      msgReactions[e]?.includes(uid)
    );

    // Remove user from their previous reaction (if any)
    if (previousEmoji) {
      const prevUsers = msgReactions[previousEmoji].filter((u) => u !== uid);
      if (prevUsers.length === 0) delete msgReactions[previousEmoji];
      else msgReactions[previousEmoji] = prevUsers;
    }

    // If tapping the SAME emoji they already had → just remove (toggle off)
    if (previousEmoji === emoji) {
      return { ...prev, [messageId]: msgReactions };
    }

    // Add user to the new emoji
    msgReactions[emoji] = [...(msgReactions[emoji] || []), uid];

    return { ...prev, [messageId]: msgReactions };
  });
}, [currentUserId]);

  const getReactions = useCallback((messageId) => {
    return reactions[messageId] || {};
  }, [reactions]);

  // ── NEW: wipe reactions for a deleted message ─────────────────────────────
  const clearMessageReactions = useCallback((messageId) => {
    setReactions((prev) => {
      const next = { ...prev };
      delete next[String(messageId)];
      delete next[Number(messageId)];
      return next;
    });
  }, []);

const applySocketReaction = useCallback((messageId, emoji, userId, action) => {
  setReactions((prev) => {
    const msgReactions = { ...(prev[messageId] || {}) };
    const uid = Number(userId);

    // Always remove this user from ALL emojis first (clean slate)
    Object.keys(msgReactions).forEach((e) => {
      const filtered = (msgReactions[e] || []).filter((u) => Number(u) !== uid);
      if (filtered.length === 0) delete msgReactions[e];
      else msgReactions[e] = filtered;
    });

    // Re-add only for add or replaced
    if (action === "added" || action === "replaced") {
      msgReactions[emoji] = [...(msgReactions[emoji] || []), uid];
    }
    // "removed" → user already wiped above, nothing to re-add

    return { ...prev, [messageId]: msgReactions };
  });
}, []);

  return { toggleReaction, getReactions, applySocketReaction, clearMessageReactions };
}