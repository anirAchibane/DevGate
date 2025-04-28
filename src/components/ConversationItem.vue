<template>
    <div class="conversation-item" :class="{ 'active': active }" @click="$emit('select', chat)">
        <div class="conversation-avatar">
            <img :src="otherUserPfp || '/default_pfp.jpg'" alt="Profile Picture" class="avatar-img">
            <span class="status-indicator" :class="{ 'online': isOnline }"></span>
        </div>
        <div class="conversation-content">
            <div class="conversation-header">
                <h5 class="user-name">{{ otherUsername || "Chat" }}</h5>
                <small class="timestamp">
                    {{ formatTime(chat.lastUpdate) }}
                </small>
            </div>
            <p class="last-message">
                <span v-if="loading" class="loading-message">Loading...</span>
                <span v-else>{{ chat.lastMessage?.content || "No messages yet" }}</span>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from "vue";
import { auth } from "@/firebase/config";
import { getUser } from "@/composables/getUser";

const props = defineProps({
    chat: { type: Object, required: true },
    active: { type: Boolean, default: false }
});

const otherUsername = ref("");
const otherUserPfp = ref("");
const loading = ref(true);
const isOnline = ref(false); // You can implement online status later if needed

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
                otherUserPfp.value = "/default_pfp.jpg";
                loading.value = false;
                clearInterval(checkData);
                console.error("Error fetching user:", error.value);
            }
        }, 100);

        setTimeout(() => clearInterval(checkData), 5000);
    } else {
        otherUsername.value = "Chat";
        otherUserPfp.value = "/default_pfp.jpg";
        loading.value = false;
    }
};

// Format time to a more readable format
const formatTime = (timestamp) => {
    if (!timestamp) return "No activity";

    try {
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now - date;

        // Less than a day
        if (diff < 86400000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Less than a week
        if (diff < 604800000) {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days[date.getDay()];
        }

        // Otherwise return date
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
        return "No activity";
    }
};
</script>

<style scoped>
.conversation-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-md);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--transition-normal);
    margin-bottom: var(--spacing-xs);
    border: 1px solid transparent;
}

.conversation-item:hover {
    background-color: rgba(60, 66, 76, 0.8);
    transform: translateY(-1px);
}

.conversation-item.active {
    background-color: rgba(52, 152, 219, 0.15);
    border-left: 3px solid var(--primary-color);
    box-shadow: var(--shadow-sm);
}

.conversation-avatar {
    position: relative;
    margin-right: var(--spacing-md);
    flex-shrink: 0;
    width: 50px;
    height: 50px;
}

.avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--lighter-blue);
    transition: all var(--transition-fast);
    box-shadow: var(--shadow-sm);
}

.active .avatar-img {
    border-color: var(--primary-color);
}

.status-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--borders-grey);
    border: 1px solid var(--background-secondary);
}

.status-indicator.online {
    background-color: var(--success-color);
}

.conversation-content {
    flex: 1;
    min-width: 0;
    /* Ensures text truncation works */
}

.conversation-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 3px;
}

.user-name {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
    transition: color var(--transition-fast);
}

.active .user-name {
    color: var(--primary-color);
}

.timestamp {
    color: var(--text-muted);
    font-size: 0.75rem;
}

.last-message {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.loading-message {
    color: var(--text-muted);
    font-style: italic;
}
</style>