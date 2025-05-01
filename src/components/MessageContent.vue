<template>
    <div class="message-content">
        <div class="messages-container" ref="messagesContainer">
            <div v-for="(message, index) in messages" :key="index" class="message-wrapper"
                :class="{ 'sent': message.sender_id === currentUserId, 'received': message.sender_id !== currentUserId }">
                <!-- Delete button in front of messages (only for messages sent by the current user) -->
                <button v-if="message.sender_id === currentUserId" class="delete-button"
                    @click.stop="confirmDeleteMessage(message.id)" :title="'Delete message'">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <div class="message-bubble">
                    <p class="message-text">{{ message.content }}</p>
                    <div class="message-meta">
                        <span class="message-time">
                            {{ message.created_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...' }}
                        </span>
                    </div>
                </div>
            </div>
            <div id="message-end" ref="messagesEnd"></div>
        </div>

        <!-- Confirmation Dialog -->
        <div v-if="showDeleteConfirm" class="delete-confirmation-overlay" @click.self="cancelDelete">
            <div class="delete-confirmation-dialog">
                <h3 class="delete-dialog-title">Delete Message</h3>
                <p class="delete-dialog-message">Are you sure you want to delete this message?</p>
                <div class="delete-dialog-buttons">
                    <button class="btn btn-secondary" @click="cancelDelete">Cancel</button>
                    <button class="btn btn-danger" @click="deleteSelectedMessage">Delete</button>
                </div>
            </div>
        </div>

        <form @submit.prevent="sendMessage" class="message-form">
            <div class="input-container">
                <input v-model="newMessage" class="message-input" type="text" placeholder="Type a message..."
                    required />
                <button class="send-button" type="submit" :disabled="!newMessage.trim()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, onMounted, defineProps, watch, computed, onUnmounted, nextTick } from "vue";
import { auth, db } from "@/firebase/config";
import { useSendMessage, deleteMessage } from "@/composables/getChatMessages";

const props = defineProps({
    chat: { type: Object, required: true }
});

const messages = ref([]);
const newMessage = ref("");
const currentUserId = auth.currentUser.uid;
const unsubscribe = ref(null);
const messagesEnd = ref(null);
const messagesContainer = ref(null);
const showDeleteConfirm = ref(false);
const messageToDelete = ref(null);

// Reactive chat reference
const chatRef = computed(() => db.collection("chat").doc(props.chat.id));

// Use a computed property to get the current chat ID
const currentChatId = computed(() => props.chat.id);

// Initialize sendMessage composable with a function that always uses the current chat ID
const sendMessage = async () => {
    if (!newMessage.value.trim()) return;

    // Store message content before clearing the input
    const messageContent = newMessage.value;

    // Clear input immediately for better UX
    newMessage.value = "";

    // Immediate scroll to bottom (no animation) before sending
    scrollToBottomInstant();

    // Create a new instance of the sendMessage composable with the current chat ID
    const { sendMessage: sendMessageComposable } = useSendMessage(currentChatId.value);

    try {
        await sendMessageComposable(messageContent);
    } catch (error) {
        console.error("Error sending message:", error);
    }
};

// Mark messages as read when the component mounts or when the chat changes
const markMessagesAsRead = async () => {
    if (!props.chat?.id || !auth.currentUser) return;

    try {
        const currentUserId = auth.currentUser.uid;
        const chatRef = db.collection("chat").doc(props.chat.id);

        // Only update if the unreadMessages field exists and the current user has unread messages
        const chatDoc = await chatRef.get();
        if (chatDoc.exists) {
            const chatData = chatDoc.data();
            if (chatData.unreadMessages && chatData.unreadMessages[currentUserId] > 0) {
                // Reset unread counter for the current user
                await chatRef.update({
                    [`unreadMessages.${currentUserId}`]: 0
                });
            }
        }
    } catch (error) {
        console.error("Error marking messages as read:", error);
    }
};

// Message deletion functions
const confirmDeleteMessage = (messageId) => {
    messageToDelete.value = messageId;
    showDeleteConfirm.value = true;
};

const cancelDelete = () => {
    showDeleteConfirm.value = false;
    messageToDelete.value = null;
};

const deleteSelectedMessage = async () => {
    if (!messageToDelete.value) return;

    try {
        await deleteMessage(currentChatId.value, messageToDelete.value);
    } catch (error) {
        console.error("Failed to delete message:", error);
    } finally {
        showDeleteConfirm.value = false;
        messageToDelete.value = null;
    }
};

const setupListener = () => {
    // Clear existing listener
    if (unsubscribe.value) {
        unsubscribe.value();
    }

    unsubscribe.value = chatRef.value.collection("messages")
        .orderBy("created_at")
        .onSnapshot(snapshot => {
            const prevCount = messages.value.length;
            messages.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // If new messages arrived or initial load, scroll to bottom
            if (messages.value.length > prevCount || prevCount === 0) {
                scrollToBottomInstant();
            }
        });
};

// Immediate scroll without animation
const scrollToBottomInstant = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    });
};

onMounted(() => {
    setupListener();
    markMessagesAsRead();

    // Force scroll on initial load
    nextTick(() => {
        scrollToBottomInstant();

        // Add a backup scroll with slight delay just to be sure
        setTimeout(scrollToBottomInstant, 100);
    });
});

watch(() => props.chat.id, (newVal) => {
    if (newVal) {
        setupListener();
        markMessagesAsRead();
        // Force scroll when changing chats
        setTimeout(scrollToBottomInstant, 50);
    }
});

// Cleanup listener when component unmounts
onUnmounted(() => {
    if (unsubscribe.value) {
        unsubscribe.value();
    }
});
</script>

<style scoped>
.message-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    /* Added to create proper positioning context */
    overflow: hidden;
    /* Prevent any potential overflow issues */
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    background-color: var(--background-secondary);
    /* Added fixed bottom padding to ensure content isn't hidden behind input */
    padding-bottom: calc(var(--spacing-md) * 3 + 58px);
}

.message-wrapper {
    display: flex;
    max-width: 80%;
    align-items: center;
}

.message-wrapper.sent {
    align-self: flex-end;
    flex-direction: row-reverse;
    /* Move delete button to the left of sent messages */
}

.message-wrapper.received {
    align-self: flex-start;
}

.message-bubble {
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
    position: relative;
    animation: message-appear 0.3s ease-out forwards;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-normal);
}

.sent .message-bubble {
    background-color: var(--sent-message-bg);
    color: var(--sent-message-color);
    border-top-right-radius: var(--radius-sm);
}

.received .message-bubble {
    background-color: var(--received-message-bg);
    color: var(--received-message-color);
    border-top-left-radius: var(--radius-sm);
}

.message-bubble:hover {
    box-shadow: var(--shadow-md);
}

.message-text {
    margin: 0;
    word-break: break-word;
    line-height: 1.4;
}

.message-meta {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--spacing-xs);
    opacity: 0.7;
    font-size: 0.75rem;
}

.message-time {
    color: inherit;
}

.message-form {
    position: absolute;
    /* Fixed position at bottom */
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-md);
    border-top: 1px solid var(--border-light);
    background-color: var(--background-secondary);
    z-index: 5;
    /* Ensure it sits above messages */
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    /* Subtle shadow to separate from content */
}

.input-container {
    display: flex;
    align-items: center;
    background-color: rgba(13, 17, 23, 0.7);
    border-radius: var(--radius-full);
    padding: var(--spacing-xs);
    transition: all var(--transition-normal);
    border: 1px solid var(--border-light);
}

.input-container:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.message-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--text-primary);
    font-size: 1rem;
}

.message-input:focus {
    outline: none;
}

.message-input::placeholder {
    color: var(--text-muted);
    opacity: 0.7;
}

.send-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background-color: var(--primary-color);
    color: white;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.send-button:hover:not(:disabled) {
    background-color: var(--primary-hover);
    transform: scale(1.05);
}

.send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Delete button styling */
.delete-button {
    width: 28px;
    height: 28px;
    background-color: rgba(0, 0, 0, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease, background-color 0.2s ease;
    margin: auto 8px;
    flex-shrink: 0;
}

.message-wrapper:hover .delete-button {
    opacity: 1;
}

.delete-button:hover {
    background-color: rgba(220, 53, 69, 0.8);
}

/* Confirmation dialog styling */
.delete-confirmation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(1, 5, 8, 0.8);
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.delete-confirmation-dialog {
    background-color: var(--background-secondary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    width: 90%;
    max-width: 400px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    animation: dialog-appear 0.3s ease-out;
}

.delete-dialog-title {
    margin-top: 0;
    color: var(--text-primary);
    font-size: 1.2rem;
    margin-bottom: var(--spacing-md);
}

.delete-dialog-message {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
}

.delete-dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
}

@keyframes dialog-appear {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes message-appear {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .message-wrapper {
        max-width: 90%;
    }
}
</style>