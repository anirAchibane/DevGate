<template>
    <div class="message-content-wrapper">
        <div class="message-container" :class="isSent ? 'sent' : 'received'">
            <button v-if="canDelete" class="delete-button" @click.stop="confirmDelete" title="Delete message">
                <i class="fas fa-trash-alt"></i>
            </button>
            <div class="message-bubble" :class="{ 'sent-bubble': isSent }">
                <p>{{ message.content }}</p>
            </div>
        </div>
        <div class="message-meta">
            <span class="timestamp">{{ formattedTimestamp }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from "vue";

const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    timestamp: {
        type: [Date, Object],
        default: null
    },
    isSent: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(["delete"]);

// Determine if user can delete this message (only sender can delete)
const canDelete = computed(() => {
    return props.isSent; // Only allow users to delete their own messages
});

// Function to handle message deletion
const confirmDelete = (event) => {
    event.stopPropagation();

    if (confirm("Are you sure you want to delete this message?")) {
        emit("delete", props.message.id);
    }
};

// Format timestamp for display
const formattedTimestamp = computed(() => {
    if (!props.timestamp && !props.message.created_at) return "";

    const timestamp = props.timestamp || props.message.created_at;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
        new Date(now.setDate(now.getDate() - 1)).toDateString() ===
        date.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } else if (isYesterday) {
        return `Yesterday, ${date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    } else {
        return (
            date.toLocaleDateString([], {
                month: "short",
                day: "numeric",
            }) +
            ", " +
            date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    }
});
</script>

<style scoped>
.message-content-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    transition: all 0.2s ease;
}

.message-container {
    position: relative;
    display: flex;
    align-items: center;
}

.message-container.sent {
    justify-content: flex-end;
}

.message-bubble {
    border-radius: 12px;
    padding: 0.75rem 1rem;
    max-width: 100%;
    position: relative;
    background-color: #1a2233;
    color: #e6e6e6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.message-bubble.sent-bubble {
    background-color: #3498db;
    color: white;
    border-top-right-radius: 4px;
}

/* Delete button styling */
.delete-button {
    position: relative;
    margin: 0 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: #7d8796;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.message-container:hover .delete-button {
    opacity: 1;
}

.delete-button:hover {
    background-color: rgba(220, 53, 69, 0.2);
    color: #e74c3c;
}

.message-bubble p {
    margin: 0;
    word-break: break-word;
    line-height: 1.4;
    font-size: 0.95rem;
}

.message-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 2px;
    opacity: 0.7;
}

.timestamp {
    font-size: 0.7rem;
    color: #7d8796;
    margin-right: 4px;
}

@media screen and (max-width: 768px) {
    .message-content-wrapper {
        max-width: 80%;
    }

    .message-bubble {
        padding: 0.5rem 0.75rem;
    }

    .message-bubble p {
        font-size: 0.9rem;
    }

    .delete-button {
        width: 24px;
        height: 24px;
        font-size: 10px;
    }
}
</style>