<template>
    <div class="conversation-item" :class="{ 'active': active, 'has-unread': hasUnreadMessages }"
        @click="$emit('select', chat)">
        <div class="conversation-avatar">
            <img :src="otherUserPfp || '/default_pfp.jpg'" alt="Profile Picture" class="avatar-img">

            <div v-if="hasUnreadMessages" class="unread-badge">
                {{ unreadCount > 9 ? '9+' : unreadCount }}
            </div>
        </div>
        <div class="conversation-content">
            <div class="conversation-header">
                <h5 class="user-name">{{ otherUsername || "Chat" }}</h5>
                <small class="timestamp">
                    {{ formatTime(chat.lastUpdate) }}
                </small>
            </div>
            <p class="last-message" :class="{ 'unread-message': hasUnreadMessages }">
                <span v-if="loading" class="loading-message">Loading...</span>
                <span v-else>{{ chat.lastMessage?.content || "No messages yet" }}</span>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, defineProps, computed } from "vue";
import { auth } from "@/firebase/config";
import { getUser } from "@/composables/getUser";

const props = defineProps({
    chat: { type: Object, required: true },
    active: { type: Boolean, default: false },
    isCurrentlyActive: { type: Boolean, default: false } // New prop to track if user is viewing this chat
});

const otherUsername = ref("");
const otherUserPfp = ref("");
const loading = ref(true);

// Computed property to check if there are unread messages
const hasUnreadMessages = computed(() => {
    const currentUserId = auth.currentUser?.uid;
    // Don't show unread indicator if the chat is currently active/open
    if (!currentUserId || !props.chat?.unreadMessages || props.isCurrentlyActive) {
        return false;
    }
    return props.chat.unreadMessages[currentUserId] > 0;
});

// Computed property to get the unread count
const unreadCount = computed(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || !props.chat?.unreadMessages) {
        return 0;
    }
    return props.chat.unreadMessages[currentUserId];
});

onMounted(() => {
    fetchOtherUserDetails();
});

const fetchOtherUserDetails = async () => {
    if (!props.chat || !props.chat.users) return;

    const currentUserId = auth.currentUser?.uid;
    const otherUserId = props.chat.users.find(id => id !== currentUserId);

    if (otherUserId) {
        const { userData, error } = getUser(otherUserId);

        const checkData = setInterval(() => {
            if (userData.value) {
                otherUsername.value = userData.value.username || "User";
                otherUserPfp.value = userData.value.avatar || require('@/assets/default_pfp.jpg');
                loading.value = false;
                clearInterval(checkData);
            } else if (error.value) {
                otherUsername.value = "Unknown User";
                loading.value = false;
                clearInterval(checkData);
            }
        }, 200);
    } else {
        otherUsername.value = "Chat";
        loading.value = false;
    }
};

// Format timestamp (e.g., "2h ago" or "10:30")
const formatTime = (timestamp) => {
    if (!timestamp) return "";

    // Convert Firebase timestamp to JS Date if needed
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    if (now.getFullYear() === date.getFullYear()) {
        // Same year, show month and day
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    // Different year
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
</script>

<style scoped>
.conversation-item {
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    transition: all var(--transition-fast);
    border-bottom: 1px solid var(--border-light);
    cursor: pointer;
}

.conversation-item:hover,
.conversation-item.active {
    background-color: rgba(13, 17, 23, 0.7);
}

.conversation-item.has-unread {
    background-color: rgba(52, 152, 219, 0.1);
}

.conversation-avatar {
    position: relative;
    flex-shrink: 0;
}

.avatar-img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid transparent;
    transition: all var(--transition-fast);
}

.active .avatar-img {
    border-color: var(--primary-color);
}




.conversation-content {
    flex-grow: 1;
    min-width: 0;
    /* Ensures content can shrink below flex-basis */
}

.conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xs);
}

.user-name {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.timestamp {
    color: var(--text-muted);
    font-size: 0.75rem;
}

.last-message {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.loading-message {
    opacity: 0.6;
    font-style: italic;
}

.unread-message {
    color: var(--text-primary);
    font-weight: 700;
}

.unread-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    background-color: var(--primary-color);
    color: white;
    font-size: 0.7rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>