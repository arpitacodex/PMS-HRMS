// src/components/chat/MentionText.js
// ─────────────────────────────────────────────────────────────────────────────
// Renders a message string that may contain @[Name](id) tokens.
// Tokens are replaced with styled mention chips.
// If the mentioned user is the current viewer, the chip is highlighted (amber).
//
// Usage:
//   <MentionText text={m.message} currentUserId={currentUserId} />
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import { MENTION_TOKEN_RE } from "@/src/hooks/useMentions";
import { getCurrentUserId } from "@/src/lib/auth";

export default function MentionText({ text, currentUserId, isMine = false }) {
    if (!text) return null;

    const userId = currentUserId ?? getCurrentUserId();

    // Split the text into segments: plain strings and mention tokens
    const segments = [];
    let lastIndex  = 0;
    const re       = new RegExp(MENTION_TOKEN_RE.source, "g");
    let match;

    while ((match = re.exec(text)) !== null) {
        // Push plain text before this token
        if (match.index > lastIndex) {
            segments.push({
                type: "text",
                content: text.slice(lastIndex, match.index),
            });
        }

        segments.push({
            type:        "mention",
            displayName: match[1],
            mentionedId: Number(match[2]),
        });

        lastIndex = match.index + match[0].length;
    }

    // Remaining plain text after last token
    if (lastIndex < text.length) {
        segments.push({ type: "text", content: text.slice(lastIndex) });
    }

    return (
        <span className="whitespace-pre-wrap break-words">
            {segments.map((seg, i) => {
                if (seg.type === "text") {
                    return <React.Fragment key={i}>{seg.content}</React.Fragment>;
                }

                // Mention chip
                const isMe = Number(seg.mentionedId) === Number(userId);

                return (
                    <span
                        key={i}
                        className={`inline-flex items-center gap-0.5 rounded-full
                            px-1.5 py-0.5 text-[0.82em] font-semibold
                            leading-tight mx-0.5 cursor-default
                            transition-all duration-200
                            ${isMe
                                ? isMine
                                    // Sender bubble is orange — use white/gold chip
                                    ? "bg-white/30 text-white ring-1 ring-white/50 animate-mention-pulse"
                                    // Receiver bubble is white — use amber chip
                                    : "bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:ring-amber-700 animate-mention-pulse"
                                : isMine
                                    ? "bg-white/20 text-white/90"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                        title={isMe ? "You were mentioned" : `@${seg.displayName}`}
                    >
                        @{seg.displayName}
                    </span>
                );
            })}

            <style>{`
                @keyframes mention-pulse {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.75; }
                }
                .animate-mention-pulse {
                    animation: mention-pulse 2s ease-in-out 3;
                }
            `}</style>
        </span>
    );
}