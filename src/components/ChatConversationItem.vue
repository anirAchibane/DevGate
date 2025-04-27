<template>
    <div class="conversation-item shadow-sm rounded-lg">
        <div class="conversation-pic-wrapper">
            <img :src="conversationPic" alt="profile" class="conversation-pic" />
        </div>
        <div class="conversation-info">
            <div class="conversation-header">
                <h4 class="conversation-name">
                    {{ conversationName }}
                </h4>
                <small v-if="chat.lastUpdate" class="conversation-time">
                    {{ formatTime(chat.lastUpdate) }}
                </small>
            </div>
            <p class="text-truncate-2">
                {{ chat.lastMessage?.content || "No messages yet" }}
            </p>
        </div>
    </div>
</template>

<script setup>
import { defineProps, computed } from "vue";

const props = defineProps({
    chat: Object,
    otherUser: Object,
});

// Default avatar
const defaultAvatar = require("@/assets/default_pfp.jpg");

// Get conversation profile picture
const conversationPic = computed(() => {
    if (!props.otherUser || !props.otherUser.avatar) return defaultAvatar;
    return props.otherUser.avatar;
});

// Get conversation name
const conversationName = computed(() => {
    if (!props.otherUser) return "Chat";
    return props.otherUser.username || "User";
});

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
</script>

<style scoped>
.conversation-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: #0D1117;
    cursor: pointer;
    margin-bottom: 0.5rem;
    transition: all 0.2s ease;
    border: 1px solid #1e2a38;
}

.conversation-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    border-color: #3498db;
}

.conversation-pic-wrapper {
    position: relative;
    margin-right: 1rem;
    flex-shrink: 0;
}

.conversation-pic {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #1e2a38;
}

.conversation-info {
    flex: 1;
    min-width: 0;
    /* Enable text truncation in flex children */
}

.conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
}

.conversation-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #e6e6e6;
}

.conversation-time {
    font-size: 0.8rem;
    color: #7d8796;
    white-space: nowrap;
}

.conversation-info p {
    margin: 0;
    font-size: 0.9rem;
    color: #7d8796;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Responsive styles */
@media screen and (max-width: 768px) {
    .conversation-item {
        padding: 0.75rem;
    }

    .conversation-pic {
        width: 45px;
        height: 45px;
    }

    .conversation-name {
        font-size: 0.95rem;
    }

    .conversation-info p {
        font-size: 0.85rem;
    }
}
</style>