const MENTION_REGEX = /@\[([^\]]+)\]\((\d+)\)/g;

function extractMentionedUserIds(message) {
    if (!message || typeof message !== "string") return [];
    const ids = new Set();
    let match;
    MENTION_REGEX.lastIndex = 0;
    while ((match = MENTION_REGEX.exec(message)) !== null) {
        ids.add(Number(match[2]));
    }
    return [...ids];
}

async function processMentions({
    message,
    messageId,
    senderId,
    chatGroupId,
    io,
    GroupMessageMention,
    ChatGroup,
    User,
}) {
    const mentionedIds = extractMentionedUserIds(message);
    const validIds     = mentionedIds.filter(id => id !== Number(senderId));
    if (validIds.length === 0) return;

    // Fetch sender info
    const sender = await User.findByPk(senderId, {
        attributes: ["id", "first_name", "last_name", "profile_photo"],
    });

    // Fetch group name
    const group = await ChatGroup.findByPk(chatGroupId, {
        attributes: ["id", "group_name"],
    });

    // Save to DB
    const mentionRows = validIds.map(userId => ({
        message_id:        messageId,
        mentioned_user_id: userId,
        mentioned_by_id:   senderId,
        chat_group_id:     chatGroupId,
        is_read:           false,
    }));

    await GroupMessageMention.bulkCreate(mentionRows, {
        ignoreDuplicates: true,
    });

    // Emit real-time to each mentioned user's personal room
    if (io) {
        for (const userId of validIds) {
            io.to(`user_${userId}`).emit("group_mention", {
                message_id:    Number(messageId),
                chat_group_id: Number(chatGroupId),
                group_name:    group?.group_name ?? "",   // ← needed by bell
                message_text:  message,                   // ← needed for preview
                mentioned_by:  sender,
                sender_id:     Number(senderId),
                sender:        sender,                    // ← alias for bell
                type:          "group",
                is_read:       false,
                created_at:    new Date().toISOString(),
            });
        }
    }
}

module.exports = { extractMentionedUserIds, processMentions };