// src/components/chat/AttachmentUI.js
// ── Updated: ChatInputBar now uses MentionInput for @mention support ──────────
// All other exports (AttachmentButton, AttachmentPreview, MessageAttachments)
// are UNCHANGED — only ChatInputBar is modified.
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
    Paperclip, Image, Film, Music, FileText,
    X, Download, Eye, Send,
} from "lucide-react";
import { ALL_ACCEPTED, ACCEPTED_TYPES, formatFileSize } from "@/src/hooks/useAttachments";
import { EmojiPickerButton } from "./EmojiPicker";
import MentionInput from "./MentionInput";

const BASE_URL = "http://localhost:8080";

// ── Full Chat Input Bar ───────────────────────────────────────────────────────
// NEW props vs original:
//   users         User[]   — all users for @mention dropdown
//   currentUserId number   — exclude self from suggestions
export function ChatInputBar({
    onSend,
    onFiles,
    onTyping,
    disabled    = false,
    placeholder = "Type a message…",
    users       = [],
    currentUserId,
}) {
    const [text, setText]   = useState("");
    const textareaRef       = useRef(null);

    // Wrap onSend so ChatInputBar can clear text after send
    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSend?.(trimmed);
        setText("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    }, [text, disabled, onSend]);

    // Insert emoji at cursor position inside MentionInput's textarea
    const handleEmojiSelect = useCallback((emoji) => {
        const ta = textareaRef.current;
        if (!ta) {
            setText((prev) => prev + emoji);
            return;
        }
        const start = ta.selectionStart ?? text.length;
        const end   = ta.selectionEnd   ?? text.length;
        const next  = text.slice(0, start) + emoji + text.slice(end);
        setText(next);
        requestAnimationFrame(() => {
            ta.focus();
            const pos = start + emoji.length;
            ta.setSelectionRange(pos, pos);
        });
    }, [text]);

    const canSend = text.trim().length > 0 && !disabled;

    return (
        <div className="flex items-end gap-1 px-3 py-2
            bg-white dark:bg-gray-900
            border-t border-gray-200 dark:border-gray-700">

            {/* Emoji picker */}
            <EmojiPickerButton
                onEmojiSelect={handleEmojiSelect}
                disabled={disabled}
            />

            {/* Attachment picker */}
            <AttachmentButton onFiles={onFiles} disabled={disabled} />

            {/* ── Mention-aware textarea (replaces plain <textarea>) ─────────── */}
            <MentionInput
                ref={textareaRef}
                value={text}
                onChange={setText}
                onSend={handleSend}
                onTyping={onTyping}
                users={users}
                currentUserId={currentUserId}
                disabled={disabled}
                placeholder={placeholder}
            />

            {/* Send button */}
            <button
                onClick={handleSend}
                disabled={!canSend}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    transition-all duration-200
                    ${canSend
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md hover:scale-110 active:scale-95"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    }`}
                title="Send (Enter)"
            >
                <Send size={16} className={canSend ? "" : "opacity-50"} />
            </button>
        </div>
    );
}

// ── AttachmentButton ──────────────────────────────────────────────────────────
// UNCHANGED
export function AttachmentButton({ onFiles, disabled }) {
    const [open, setOpen] = useState(false);
    const imageRef  = useRef(null);
    const videoRef  = useRef(null);
    const audioRef  = useRef(null);
    const fileRef   = useRef(null);
    const popupRef  = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const pick = (ref) => { ref.current?.click(); setOpen(false); };

    const handleChange = (e) => {
        if (e.target.files?.length) onFiles(e.target.files);
        e.target.value = "";
    };

    const options = [
        { icon: Image,    label: "Image",    color: "text-pink-500   bg-pink-50",   ref: imageRef, accept: ACCEPTED_TYPES.image },
        { icon: Film,     label: "Video",    color: "text-purple-500 bg-purple-50", ref: videoRef, accept: ACCEPTED_TYPES.video },
        { icon: Music,    label: "Audio",    color: "text-blue-500   bg-blue-50",   ref: audioRef, accept: ACCEPTED_TYPES.audio },
        { icon: FileText, label: "Document", color: "text-orange-500 bg-orange-50", ref: fileRef,  accept: ACCEPTED_TYPES.file  },
    ];

    return (
        <div className="relative" ref={popupRef}>
            {options.map(({ ref, accept, label }) => (
                <input key={label} ref={ref} type="file" multiple accept={accept}
                    className="hidden" onChange={handleChange} />
            ))}

            {open && (
                <div className="absolute bottom-12 left-0 bg-white dark:bg-gray-900
                    rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700
                    p-2 flex gap-1 z-50"
                    style={{ animation: "emojiPop 0.16s cubic-bezier(.34,1.56,.64,1) both" }}>
                    {options.map(({ icon: Icon, label, color, ref }) => (
                        <button key={label} onClick={() => pick(ref)}
                            className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl
                                hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-[64px]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                                <Icon size={18} />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                                {label}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <button type="button" disabled={disabled} onClick={() => setOpen((v) => !v)}
                className={`p-2 rounded-lg transition-all duration-200
                    ${open ? "bg-orange-100 text-orange-500" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-orange-500"}
                    disabled:opacity-40`}
                title="Attach file">
                <Paperclip size={18} />
            </button>

            <style>{`
                @keyframes emojiPop {
                    from { opacity: 0; transform: scale(0.85) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0); }
                }
            `}</style>
        </div>
    );
}

// ── AttachmentPreview ─────────────────────────────────────────────────────────
// UNCHANGED
export function AttachmentPreview({ files, onRemove }) {
    if (!files.length) return null;
    return (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {files.map((f) => (
                    <div key={f.id} className="relative flex-shrink-0 group">
                        {f.type === "image" && f.preview ? (
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-orange-200">
                                <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                            </div>
                        ) : f.type === "video" ? (
                            <div className="w-20 h-20 rounded-xl bg-purple-50 border-2 border-purple-200
                                flex flex-col items-center justify-center gap-1">
                                <Film size={20} className="text-purple-500" />
                                <span className="text-[9px] text-purple-500 font-semibold px-1 truncate w-full text-center">
                                    {f.name.split(".").pop().toUpperCase()}
                                </span>
                            </div>
                        ) : f.type === "audio" ? (
                            <div className="w-20 h-20 rounded-xl bg-blue-50 border-2 border-blue-200
                                flex flex-col items-center justify-center gap-1">
                                <Music size={20} className="text-blue-500" />
                                <span className="text-[9px] text-blue-500 font-semibold px-1 truncate w-full text-center">
                                    {f.name.split(".").pop().toUpperCase()}
                                </span>
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-orange-50 border-2 border-orange-200
                                flex flex-col items-center justify-center gap-1 px-1">
                                <FileText size={20} className="text-orange-500" />
                                <span className="text-[9px] text-gray-600 dark:text-gray-400 font-medium text-center leading-tight line-clamp-2">
                                    {f.name}
                                </span>
                                <span className="text-[9px] text-gray-400">{formatFileSize(f.size)}</span>
                            </div>
                        )}
                        <button onClick={() => onRemove(f.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white
                                rounded-full flex items-center justify-center
                                opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10">
                            <X size={10} />
                        </button>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
                {files.length} file{files.length > 1 ? "s" : ""} ·{" "}
                {files.reduce((acc, f) => acc + f.size, 0) > 1024 * 1024
                    ? `${(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1)} MB`
                    : `${Math.round(files.reduce((acc, f) => acc + f.size, 0) / 1024)} KB`
                } total
            </p>
        </div>
    );
}

// ── MessageAttachments ────────────────────────────────────────────────────────
// UNCHANGED
export function MessageAttachments({ attachments }) {
    if (!attachments?.length) return null;
    return (
        <div className="flex flex-col gap-1.5 mt-1">
            {attachments.map((att) => (
                <AttachmentItem key={att.id} attachment={att} />
            ))}
        </div>
    );
}

function AttachmentItem({ attachment }) {
    const url  = attachment.file_path?.startsWith("http")
        ? attachment.file_path
        : `${BASE_URL}/${attachment.file_path}`;
    const type = attachment.file_type;
    const name = attachment.original_name || "file";

    if (type === "image") {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="relative max-w-[240px] rounded-xl overflow-hidden">
                    <img src={url} alt={name} className="w-full rounded-xl object-cover max-h-60"
                        onError={(e) => { e.target.style.display = "none"; }} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors
                        flex items-center justify-center">
                        <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </a>
        );
    }
    if (type === "video") {
        return (
            <div className="max-w-[280px] rounded-xl overflow-hidden bg-black">
                <video src={url} controls className="w-full max-h-48 rounded-xl" preload="metadata" />
            </div>
        );
    }
    if (type === "audio") {
        return (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2.5 max-w-[260px]">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Music size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 truncate">{name}</p>
                    <audio src={url} controls className="w-full h-6 mt-0.5" />
                </div>
            </div>
        );
    }
    const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" download={name}
            className="flex items-center gap-2.5 bg-gray-100 dark:bg-gray-800
                hover:bg-gray-200 dark:hover:bg-gray-700
                rounded-xl px-3 py-2.5 max-w-[260px] transition-colors group">
            <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{name}</p>
                <p className="text-[10px] text-gray-400">{ext} · tap to download</p>
            </div>
            <Download size={14} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
        </a>
    );
}