// src/components/chat/MentionInput.js
"use client";

import {
    useState, useEffect, useRef, useCallback, forwardRef,
} from "react";
import { buildMentionToken } from "@/src/hooks/useMentions";
import { Avatar } from "./ui";

const MAX_SUGGESTIONS = 8;

// Special virtual user for @all
const ALL_OPTION = {
    id:         "__all__",
    first_name: "all",
    last_name:  "",
    _isAll:     true,
};

const MentionInput = forwardRef(function MentionInput(
    {
        value = "",
        onChange,
        onSend,
        onTyping,
        users = [],
        currentUserId,
        disabled  = false,
        placeholder = "Type a message… use @ to mention someone",
    },
    forwardedRef
) {
    const innerRef    = useRef(null);
    const taRef       = forwardedRef || innerRef;
    const dropdownRef = useRef(null);

    const [mentionState, setMentionState] = useState({
        open:    false,
        query:   "",
        atIndex: -1,
    });
    const [highlighted, setHighlighted] = useState(0);

    // ── Build suggestion list ── @all first, then filtered members ────────────
    const suggestions = mentionState.open
        ? [
            // Show @all when query is empty OR starts with "a"/"al"/"all"
            ...("all".startsWith(mentionState.query.toLowerCase()) ? [ALL_OPTION] : []),
            ...users
                .filter((u) => Number(u.id) !== Number(currentUserId))
                .filter((u) => {
                    if (!mentionState.query) return true;
                    const full = `${u.first_name} ${u.last_name ?? ""}`.toLowerCase();
                    return full.includes(mentionState.query.toLowerCase());
                })
                .slice(0, MAX_SUGGESTIONS),
          ]
        : [];

    // ── Auto-grow textarea ────────────────────────────────────────────────────
    useEffect(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
    }, [value]);

    // ── Reset highlight when query changes ────────────────────────────────────
    useEffect(() => { setHighlighted(0); }, [mentionState.query]);

    // ── Close on outside click ────────────────────────────────────────────────
    useEffect(() => {
        if (!mentionState.open) return;
        const handler = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target) &&
                taRef.current &&
                !taRef.current.contains(e.target)
            ) {
                setMentionState((s) => ({ ...s, open: false }));
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mentionState.open]);

    // ── Handle text change — detect "@" trigger ───────────────────────────────
    const handleChange = useCallback(
        (e) => {
            const newVal = e.target.value;
            const caret  = e.target.selectionStart ?? newVal.length;

            onChange?.(newVal);
            onTyping?.();

            const textBeforeCaret = newVal.slice(0, caret);
            const atMatch         = textBeforeCaret.match(/@([^\s@]*)$/);

            if (atMatch) {
                const atIndex = caret - atMatch[0].length;
                setMentionState({ open: true, query: atMatch[1], atIndex });
            } else {
                setMentionState((s) => ({ ...s, open: false, query: "" }));
            }
        },
        [onChange, onTyping]
    );

    // ── Insert a mention token ────────────────────────────────────────────────
    const insertMention = useCallback(
        (user) => {
            const ta = taRef.current;

            let token;

            if (user._isAll) {
                // @all → insert tokens for every group member
                const filtered = users.filter(
                    (u) => Number(u.id) !== Number(currentUserId)
                );
                token = filtered.map((u) => buildMentionToken(u)).join(" ") + " ";
            } else {
                token = buildMentionToken(user) + " ";
            }

            const before = value.slice(0, mentionState.atIndex);
            const caret  = ta?.selectionStart ?? value.length;
            const after  = value.slice(caret);
            const newVal = before + token + after;

            onChange?.(newVal);
            setMentionState({ open: false, query: "", atIndex: -1 });

            requestAnimationFrame(() => {
                if (!ta) return;
                ta.focus();
                const pos = (before + token).length;
                ta.setSelectionRange(pos, pos);
            });
        },
        [value, mentionState.atIndex, onChange, users, currentUserId]
    );

    // ── Keyboard navigation ───────────────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e) => {
            if (mentionState.open && suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
                    return;
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlighted((h) => Math.max(h - 1, 0));
                    return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    insertMention(suggestions[highlighted]);
                    return;
                }
                if (e.key === "Escape") {
                    setMentionState((s) => ({ ...s, open: false }));
                    return;
                }
            }

            // Normal Enter → send message
            if (e.key === "Enter" && !e.shiftKey && !mentionState.open) {
                e.preventDefault();
                onSend?.();
            }
        },
        [mentionState.open, suggestions, highlighted, insertMention, onSend]
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="relative flex-1">
            <textarea
                ref={taRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={placeholder}
                rows={1}
                className="w-full resize-none rounded-2xl px-4 py-2.5 text-sm
                    bg-white text-black placeholder-gray-400
                    border border-transparent
                    focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400
                    transition-all duration-200 disabled:opacity-50 leading-relaxed overflow-hidden"
                style={{ minHeight: 40, maxHeight: 140 }}
            />

            {/* ── Suggestion dropdown ─────────────────────────────────────── */}
            {mentionState.open && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute bottom-full left-0 mb-2 z-[200]
                        w-72 bg-white dark:bg-gray-900
                        border border-gray-200 dark:border-gray-700
                        rounded-2xl shadow-2xl overflow-hidden"
                    style={{ animation: "mentionPop 0.15s cubic-bezier(.34,1.56,.64,1) both" }}
                >
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800
                        flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest
                            text-gray-400 dark:text-gray-500">
                            Mention someone
                        </span>
                        {mentionState.query && (
                            <span className="text-[10px] bg-orange-100 text-orange-600
                                dark:bg-orange-900/40 dark:text-orange-400
                                px-1.5 py-0.5 rounded-full font-semibold">
                                @{mentionState.query}
                            </span>
                        )}
                    </div>

                    {/* User list */}
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {suggestions.map((user, idx) => {
                            const isActive = idx === highlighted;
                            const isAll    = user._isAll;
                            const name     = isAll
                                ? "all"
                                : `${user.first_name} ${user.last_name ?? ""}`.trim();

                            return (
                                <li key={user.id}>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            insertMention(user);
                                        }}
                                        onMouseEnter={() => setHighlighted(idx)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5
                                            transition-colors text-left
                                            ${isActive
                                                ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20"
                                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        {isAll ? (
                                            <div className="w-8 h-8 rounded-full flex-shrink-0
                                                bg-gradient-to-br from-orange-400 to-amber-500
                                                flex items-center justify-center
                                                text-white text-sm font-bold">
                                                @
                                            </div>
                                        ) : (
                                            <Avatar
                                                name={name}
                                                photo={user.profile_photo}
                                                size={8}
                                            />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            {isAll ? (
                                                <p className="text-sm font-semibold text-gray-800
                                                    dark:text-gray-100">
                                                    @all{" "}
                                                    <span className="text-[11px] font-normal text-gray-400">
                                                        — mention everyone
                                                    </span>
                                                </p>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-semibold text-gray-800
                                                        dark:text-gray-100 truncate">
                                                        {name}
                                                    </p>
                                                    {user.employee_code && (
                                                        <p className="text-[11px] text-gray-400 truncate">
                                                            {user.employee_code}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {isActive && (
                                            <span className="text-[10px] text-orange-400
                                                font-semibold flex-shrink-0">
                                                ↵
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Footer hints */}
                    <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800
                        flex items-center gap-3 text-[10px] text-gray-400">
                        <span>↑↓ navigate</span>
                        <span>↵ / Tab select</span>
                        <span>Esc dismiss</span>
                    </div>
                </div>
            )}

            {/* No results */}
            {mentionState.open && mentionState.query && suggestions.length === 0 && (
                <div className="absolute bottom-full left-0 mb-2 z-[200]
                    w-56 bg-white dark:bg-gray-900
                    border border-gray-200 dark:border-gray-700
                    rounded-2xl shadow-xl px-4 py-3 text-sm text-gray-400">
                    No users found for "{mentionState.query}"
                </div>
            )}

            <style>{`
                @keyframes mentionPop {
                    from { opacity: 0; transform: scale(0.92) translateY(6px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
});

export default MentionInput;