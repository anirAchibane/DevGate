<template>
    <div class="conversation-item shadow-sm rounded-lg card-hover">
        <div class="conversation-pic-wrapper">
            <img
                :src="getConversationPfp(chat)"
                alt="profile"
                class="conversation-pic"
            />
            <div
                v-if="chat.unreadCount && chat.unreadCount > 0"
                class="unread-badge"
            >
                {{ chat.unreadCount > 9 ? "9+" : chat.unreadCount }}
            </div>
        </div>
        <div class="conversation-info">
            <div class="conversation-header">
                <h4 class="conversation-name">
                    {{ getConversationName(chat) }}
                </h4>
                <small
                    v-if="chat.lastMessage?.created_at"
                    class="conversation-time"
                >
                    {{ formatTime(chat.lastMessage.created_at) }}
                </small>
            </div>
            <p
                class="text-truncate-2"
                :class="{ 'fw-bold': chat.unreadCount && chat.unreadCount > 0 }"
            >
                <span
                    v-if="chat.type === 'group' && chat.lastMessage?.sender_id"
                    class="sender-name"
                >
                    {{ getSenderName(chat.lastMessage.sender_id) }}:
                </span>
                {{ chat.lastMessage?.content || "No messages yet" }}
            </p>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineExpose } from "vue";

const props = defineProps({
    chat: Object,
    currentUser: Object,
    users: Array,
});

// Get conversation profile picture
const getConversationPfp = (chat) => {
    if (!chat) return require("@/assets/pfp_default.jpg");

    if (chat.type === "group") {
        return (
            chat.pfp ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                chat.name || "Group"
            )}`
        );
    }

    // For private chats, get the other user's profile picture
    const otherUserId = chat.users?.find((id) => id !== props.currentUser?.uid);
    if (!otherUserId) return require("@/assets/pfp_default.jpg");

    const otherUser = props.users.find((u) => u.uid === otherUserId);
    return otherUser?.pfp || require("@/assets/pfp_default.jpg");
};

// Get conversation display name
const getConversationName = (chat) => {
    if (!chat) return "";

    if (chat.type === "group") {
        return chat.name || "Group Chat";
    }

    // For private chats, find the other user
    const otherUserId = chat.users?.find((id) => id !== props.currentUser?.uid);
    if (!otherUserId) return "Private Chat";

    const otherUser = props.users.find((u) => u.uid === otherUserId);
    return otherUser ? otherUser.username : "Private Chat";
};

// Get sender name for group chats
const getSenderName = (senderId) => {
    if (senderId === props.currentUser?.uid) return "You";
    const sender = props.users.find((u) => u.uid === senderId);
    return sender?.username || "User";
};

// Format timestamp
const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // If this week, show day
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: "short" });
    }

    // Otherwise show date
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

defineExpose({
    getConversationPfp,
    getConversationName,
});
</script>

<style scoped>
.conversation-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-md);
    background-color: white;
    cursor: pointer;
    margin-bottom: var(--spacing-sm);
    transition: all 0.2s ease;
}

.conversation-pic-wrapper {
    position: relative;
    margin-right: var(--spacing-md);
    flex-shrink: 0;
}

.conversation-pic {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid white;
    box-shadow: var(--shadow-sm);
}

.unread-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 20px;
    height: 20px;
    background-color: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
    border: 2px solid white;
}

.conversation-info {
    flex: 1;
    min-width: 0; /* Enable text truncation in flex children */
}

.conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
}

.conversation-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--gray-800);
}

.conversation-time {
    font-size: 12px;
    color: var(--gray-500);
    white-space: nowrap;
}

.conversation-info p {
    margin: 0;
    font-size: 14px;
    color: var(--gray-600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sender-name {
    font-weight: 500;
    color: var(--gray-700);
}

.fw-bold {
    font-weight: 600 !important;
    color: var(--gray-800) !important;
}

/* Responsive styles */
@media screen and (max-width: 768px) {
    .conversation-item {
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-xs);
    }

    .conversation-pic {
        width: 45px;
        height: 45px;
    }

    .conversation-name {
        font-size: 15px;
    }

    .conversation-info p {
        font-size: 13px;
    }
}

@media screen and (max-width: 480px) {
    .conversation-pic {
        width: 40px;
        height: 40px;
    }

    .conversation-name {
        font-size: 14px;
    }

    .conversation-info p {
        font-size: 12px;
    }
}
</style>
