<template>
    <div class="message-content-wrapper" @click="goToProfile">
        <div v-if="showSender" class="message-sender">
            {{ senderName }}
        </div>
        <div class="message-container" v-if="isSent">
            <button
                v-if="canDelete"
                class="delete-button"
                @click.stop="confirmDelete"
                title="Delete message"
            >
                <i class="fas fa-trash-alt"></i>
            </button>
            <div
                class="message-bubble"
                :class="{ 'has-emoji': hasEmoji, 'sent-bubble': isSent }"
            >
                <p v-html="formattedContent"></p>
            </div>
        </div>
        <div v-else class="message-container">
            <div
                class="message-bubble"
                :class="{ 'has-emoji': hasEmoji, 'sent-bubble': isSent }"
            >
                <p v-html="formattedContent"></p>
            </div>
            <button
                v-if="canDelete"
                class="delete-button"
                @click.stop="confirmDelete"
                title="Delete message"
            >
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
        <div class="message-meta">
            <span class="timestamp">{{ formattedTimestamp }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from "vue";
import { auth } from "@/firebase/config";

const props = defineProps({
    message: {
        type: Object,
        required: true,
    },
    senderName: {
        type: String,
        default: "Unknown User",
    },
    showSender: {
        type: Boolean,
        default: false,
    },
    timestamp: {
        type: [Date, Object],
        default: null,
    },
    users: {
        type: Array,
        default: () => [],
    },
    isSent: {
        type: Boolean,
        default: false,
    },
    chatType: {
        type: String,
        default: "group", // 'private' or 'group'
        validator: (value) => ["private", "group"].includes(value),
    },
    admin: {
        type: String,
        default: "",
    },
});

const emit = defineEmits(["delete", "profileClick"]);

// Determine if user can delete this message
const canDelete = computed(() => {
    console.log("effective admin: ", effectiveAdmin.value);
    return props.isSent || auth.currentUser?.uid === effectiveAdmin.value; // Only allow users to delete their own messages
});

const effectiveAdmin = computed(() => {
    return props.chatType === "private" ? "" : props.admin;
});

// Function to handle message deletion
const confirmDelete = (event) => {
    event.stopPropagation();

    if (confirm("Are you sure you want to delete this message?")) {
        emit("delete", props.message.id);
    }
};

// Format timestamp for display with more context
const formattedTimestamp = computed(() => {
    if (!props.timestamp) return "";

    const date = props.timestamp.toDate
        ? props.timestamp.toDate()
        : new Date(props.timestamp);
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

// Detect if message is just emoji(s)
const hasEmoji = computed(() => {
    if (!props.message.content) return false;

    // Simple emoji detection - if the content has only emoji-like characters
    // This is a basic check and will catch many but not all emoji patterns
    const emojiPattern = /^(\p{Emoji}|\s)+$/u;
    return (
        emojiPattern.test(props.message.content) &&
        props.message.content.length <= 8
    );
});

// Format content to highlight mentions and make text more interactive
const formattedContent = computed(() => {
    if (props.chatType === "private") {
        return props.message.content;
    }
    if (!props.message.content) return "";

    let formattedText = props.message.content;

    // Process mentions only if chat type is group
    if (props.chatType === "group") {
        // Regular expression to match @username patterns
        const mentionRegex = /@([a-zA-Z0-9._]+)/g;

        // Replace mentions with styled spans
        formattedText = formattedText.replace(
            mentionRegex,
            (match, username) => {
                // Check if this is a valid user mention
                const isValidUser = props.users.some(
                    (user) => user.username === username
                );

                if (isValidUser) {
                    const user = props.users.find(
                        (user) => user.username === username
                    );
                    const userId = user?.uid || "";
                    return `<span class="mention-tag" data-userid="${userId}">@${username}</span>`;
                }

                // If not a valid user, just return the original text
                return match;
            }
        );
    }

    // Replace URLs with clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formattedText = formattedText.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    // Make email addresses clickable
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    formattedText = formattedText.replace(emailRegex, (email) => {
        return `<a href="mailto:${email}" class="email-link">${email}</a>`;
    });

    return formattedText;
});

// Update the goToProfile method to handle both mention tag clicks and emit events
const goToProfile = (event) => {
    // Check if clicked element is a mention tag
    if (event.target.classList.contains("mention-tag")) {
        const userId = event.target.dataset.userid;
        if (userId) {
            // Emit event for parent component to handle navigation
            emit("profileClick", userId);
        }
    }
};
</script>

<style scoped>
.message-content-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 100%;
    transition: all 0.2s ease;
}

.message-sender {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--gray-600);
    margin-bottom: 3px;
    padding-left: var(--spacing-xs);
}

.message-container {
    position: relative;
    display: flex;
    align-items: center;
}

.message-bubble {
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm) var(--spacing-md);
    max-width: 100%;
    position: relative;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s ease, transform 0.1s ease;
}

.message-bubble:hover {
    box-shadow: var(--shadow-md);
}

/* Add background and text colors for sent messages */
:deep(.sent .message-bubble) {
    background-color: var(--current-user-bg, #3c6e71);
    color: var(--current-user-color, white);
}

/* Direct styling for sent messages within this component */
.message-bubble.sent-bubble {
    background-color: var(--sent-message-bg, #3c6e71) !important;
    color: var(--sent-message-color, white);
    border-top-right-radius: var(--radius-sm);
}

/* Delete button styling */
.delete-button {
    position: relative;
    margin-right: 8px;
    background-color: rgba(255, 255, 255, 0.7);
    border: none;
    border-radius: 50%;
    color: var(--gray-500);
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
    color: var(--danger-color, #dc3545);
}

/* Special styling for emoji-only messages */
.message-bubble.has-emoji {
    background-color: transparent !important;
    box-shadow: none;
    padding: var(--spacing-xs);
}

.message-bubble.has-emoji p {
    font-size: 1.5rem;
}

.message-bubble p {
    margin: 0;
    word-break: break-word;
    line-height: 1.4;
}

.message-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 2px;
    opacity: 0.85;
    transition: opacity 0.2s ease;
}

.message-content-wrapper:hover .message-meta {
    opacity: 1;
}

.timestamp {
    font-size: 0.7rem;
    color: var(--gray-500);
    margin: 0 4px;
}

.message-status {
    font-size: 0.7rem;
    margin-right: 2px;
    color: var(--gray-500);
}

.message-status .read {
    color: var(--accent-color);
}

:deep(.mention-tag) {
    background-color: rgba(79, 70, 229, 0.15);
    color: var(--primary-color);
    border-radius: 4px;
    padding: 1px 4px;
    font-weight: 500;
    display: inline-block;
    transition: background-color 0.2s ease;
}

:deep(.mention-tag:hover) {
    background-color: rgba(79, 70, 229, 0.25);
}

:deep(a) {
    color: var(--accent-color);
    text-decoration: underline;
    word-break: break-all;
    transition: color 0.2s ease;
}

:deep(a:hover) {
    color: var(--accent-hover);
    text-decoration: underline;
}

:deep(.email-link) {
    color: var(--info-color);
}

:deep(.email-link:hover) {
    color: var(--primary-color);
}

@media screen and (max-width: 768px) {
    .message-bubble {
        padding: var(--spacing-xs) var(--spacing-sm);
    }

    .message-bubble.has-emoji p {
        font-size: 1.3rem;
    }
}
</style>
