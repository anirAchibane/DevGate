<template>
    <div class="home-container" v-if="!isLoading">
        <!-- Left mini navbar -->

        <MiniNavbar :currentUser="currentUser" />

        <!-- Desktop Layout -->
        <template v-if="!isMobile">
            <!-- Middle section - Conversation list -->

            <div class="item conversation-list shadow-md rounded-lg">
                <SearchBar
                    v-model="searchQuery"
                    @search="handleSearch"
                    @clear="resetSearch"
                    placeholder="Search users and groups..."
                    :debounceTime="300"
                    :isLoading="searchLoading"
                    class="search-container"
                />
                <div class="conversations-container">
                    <!-- Conversations loading indicator -->
                    <div
                        v-if="conversationsLoading"
                        class="loading-container-small"
                    >
                        <div class="loading-spinner"></div>
                        <p>Loading conversations...</p>
                    </div>
                    <!-- No results message -->
                    <div
                        v-else-if="
                            searchQuery && filteredConversations.length === 0
                        "
                        class="no-results"
                    >
                        <p>No conversations found for "{{ searchQuery }}"</p>
                    </div>

                    <!-- Individual chats -->
                    <div
                        v-else-if="filteredConversations.length > 0"
                        class="conversation-list-items"
                    >
                        <div
                            v-for="chat in filteredConversations"
                            :key="chat.uid"
                            @click="selectConversation(chat)"
                            :class="{ 'active-chat': isChatActive(chat) }"
                        >
                            <ConversationItem
                                :chat="chat"
                                :currentUser="currentUser"
                                :users="users"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right section - Current chat -->
            <div class="item current-chat shadow-md rounded-lg">
                <div class="chat-header" v-if="hasActiveChat">
                    <div class="chat-header-user">
                        <img
                            :src="getActiveChatPfp()"
                            alt="chat"
                            class="chat-pic"
                        />
                        <div class="chat-info" @click="goToActiveChatProfile">
                            <h3 class="mb-0 active-chat-name">
                                {{ getActiveChatName() }}
                            </h3>
                            <p class="text-muted small mb-0">
                                {{ activeChatStatus }}
                            </p>
                        </div>
                    </div>
                    <router-link
                        :to="{
                            path: '/newReport',
                            query: { targetID: activeChat.uid },
                        }"
                    >
                        <button class="report">Report</button>
                    </router-link>
                </div>
                <div class="chat-messages" v-if="hasActiveChat">
                    <div v-if="messageLoading" class="message-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading messages...</p>
                    </div>

                    <div v-else-if="hasMessages" class="messages-container">
                        <div
                            v-for="message in messages"
                            :key="message.uid || message.id"
                            :class="[
                                'message-wrapper',
                                message.sender_id === currentUser?.uid
                                    ? 'sent'
                                    : 'received',
                            ]"
                        >
                            <div
                                class="message-avatar"
                                v-if="
                                    message.sender_id !== currentUser?.uid &&
                                    activeChat.type === 'group'
                                "
                            >
                                <img
                                    :src="getUserAvatar(message.sender_id)"
                                    :alt="getUserName(message.sender_id)"
                                    class="rounded-circle cursor-pointer"
                                    @click="goToProfile(message.sender_id)"
                                />
                            </div>
                            <MessageContent
                                :message="message"
                                :senderName="getUserName(message.sender_id)"
                                :showSender="
                                    activeChat.type === 'group' &&
                                    message.sender_id !== currentUser?.uid
                                "
                                :timestamp="
                                    message.created_at || message.createdAt
                                "
                                :users="users"
                                :isSent="message.sender_id === currentUser?.uid"
                                :chatType="activeChat.type"
                                @delete="handleDeleteMessage"
                                @profileClick="goToProfile"
                                :admin="
                                    activeChat.type === 'group'
                                        ? activeChat.admin
                                        : ''
                                "
                            />
                        </div>
                    </div>
                    <div
                        v-else
                        class="no-messages d-flex flex-column align-items-center justify-content-center"
                    >
                        <i
                            class="fas fa-comments mb-3 display-4 text-muted"
                        ></i>
                        <p class="lead">
                            No messages yet. Start the conversation!
                        </p>
                    </div>
                </div>
                <div
                    v-else
                    class="chat-placeholder d-flex flex-column align-items-center justify-content-center"
                >
                    <i
                        class="fas fa-comment-dots mb-4 display-3 text-muted"
                    ></i>
                    <h3>Select a conversation to start chatting</h3>
                    <p class="mt-2 text-muted">
                        Choose from your existing conversations or start a new
                        one
                    </p>
                </div>
                <div class="chat-input" v-if="hasActiveChat">
                    <MentionInput
                        v-model="newMessage"
                        @send="sendMessage"
                        :users="
                            activeChat.type === 'group'
                                ? activeChatUsers
                                : users
                        "
                        :chatType="activeChat.type"
                        :currentUser="currentUser"
                        :disabled="sendingMessage"
                        :placeholder="
                            activeChat.type === 'group'
                                ? 'Type a message ... (use @ to mention)'
                                : 'Type a message ...'
                        "
                        ref="messageInputRef"
                    />
                </div>
            </div>
        </template>

        <!-- Mobile Layout -->
        <template v-else>
            <div class="item main-content">
                <!-- Chat list view -->
                <div v-if="!hasActiveChat" class="chat-list-view">
                    <SearchBar
                        v-model="searchQuery"
                        @search="handleSearch"
                        @clear="resetSearch"
                        placeholder="Search users and groups..."
                        :debounceTime="300"
                        :isLoading="searchLoading"
                        class="search-container"
                    />
                    <div class="conversations">
                        <!-- Conversations loading indicator -->
                        <div
                            v-if="conversationsLoading"
                            class="loading-container-small"
                        >
                            <div class="loading-spinner"></div>
                            <p>Loading conversations...</p>
                        </div>
                        <!-- No results message -->
                        <div
                            v-else-if="
                                searchQuery &&
                                filteredConversations.length === 0
                            "
                            class="no-results"
                        >
                            <p>
                                No conversations found for "{{ searchQuery }}"
                            </p>
                        </div>

                        <!-- Individual chats -->

                        <div
                            v-else-if="filteredConversations.length > 0"
                            v-for="chat in filteredConversations"
                            :key="chat.uid"
                            class="conversation-item"
                            @click="selectConversation(chat)"
                        >
                            <ConversationItem
                                :chat="chat"
                                :currentUser="currentUser"
                                :users="users"
                            />
                        </div>
                    </div>
                </div>

                <!-- Current chat view -->
                <div v-else class="current-chat-view">
                    <div class="chat-header">
                        <button
                            class="back-button"
                            @click="
                                activeChat = {};
                                chatIdentifier = null;
                                chatType = null;
                            "
                            :disabled="chatSelectionLoading"
                        >
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="chat-header-user">
                            <img
                                :src="getActiveChatPfp()"
                                alt="chat"
                                class="chat-pic"
                            />
                            <div class="chat-info">
                                <h3 class="mb-0" @click="goToActiveChatProfile">
                                    {{ getActiveChatName() }}
                                </h3>
                                <p class="text-muted small mb-0">
                                    {{ activeChatStatus }}
                                </p>
                            </div>
                        </div>
                        <router-link
                            :to="{
                                path: '/newReport',
                                query: { targetID: activeChat.uid },
                            }"
                        >
                            <button class="report">Report</button>
                        </router-link>
                    </div>
                    <div class="chat-messages">
                        <div v-if="messageLoading" class="message-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading messages...</p>
                        </div>

                        <div v-else-if="hasMessages" class="messages-container">
                            <div
                                v-for="message in messages"
                                :key="message.uid || message.id"
                                :class="[
                                    'message-wrapper',
                                    message.sender_id === currentUser?.uid
                                        ? 'sent'
                                        : 'received',
                                ]"
                            >
                                <div
                                    class="message-avatar"
                                    v-if="
                                        message.sender_id !==
                                            currentUser?.uid &&
                                        activeChat.type === 'group'
                                    "
                                >
                                    <img
                                        :src="getUserAvatar(message.sender_id)"
                                        :alt="getUserName(message.sender_id)"
                                        class="rounded-circle cursor-pointer"
                                        @click="goToProfile(message.sender_id)"
                                    />
                                </div>
                                <MessageContent
                                    :message="message"
                                    :senderName="getUserName(message.sender_id)"
                                    :showSender="
                                        activeChat.type === 'group' &&
                                        message.sender_id !== currentUser?.uid
                                    "
                                    :timestamp="
                                        message.created_at || message.createdAt
                                    "
                                    :users="users"
                                    :isSent="
                                        message.sender_id === currentUser?.uid
                                    "
                                    :chatType="activeChat.type"
                                    @delete="handleDeleteMessage"
                                    @profileClick="goToProfile"
                                    :admin="
                                        activeChat.type === 'group'
                                            ? activeChat.admin
                                            : ''
                                    "
                                />
                            </div>
                        </div>
                        <div
                            v-else
                            class="no-messages d-flex flex-column align-items-center justify-content-center"
                        >
                            <i
                                class="fas fa-comments mb-3 display-4 text-muted"
                            ></i>
                            <p class="lead">
                                No messages yet. Start the conversation!
                            </p>
                        </div>
                    </div>
                    <div class="chat-input">
                        <MentionInput
                            v-model="newMessage"
                            @send="sendMessage"
                            :users="
                                activeChat.type === 'group'
                                    ? activeChatUsers
                                    : users
                            "
                            :currentUser="currentUser"
                            :disabled="sendingMessage"
                            placeholder="Type a message... (use @ to mention)"
                            ref="messageInputRef"
                        />
                    </div>
                </div>
            </div>
        </template>
    </div>
    <div v-else>
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading chat...</p>
        </div>
    </div>
</template>

<script setup>
/*
 * HomeView.vue - Main Chat Application Interface
 *
 * This component handles the main chat application interface with the following features:
 * - Responsive design with desktop and mobile layouts
 * - User authentication handling
 * - Conversation list with search functionality
 * - Real-time message display and sending
 * - Group and private chat support
 *
 * Structure:
 * 1. Imports and component setup
 * 2. State management (ref, computed)
 * 3. Chat functionality (selecting conversations, sending messages)
 * 4. UI helper functions (formatting, display logic)
 * 5. Lifecycle hooks
 * 6. Responsive design handling
 *
 * Functions in order of appearance:
 * - getConversationName: Get display name for a conversation
 * - handleSearch/resetSearch: Handle search queries for conversations
 * - formatDate: Format timestamps for messages
 * - handleResize: Handle window resizing
 * - handleKeyDown: Handle keyboard events
 * - clearActiveChat: Reset active chat state
 * - fetchCurrentUser: Get current user data
 * - handleRouteParams: Handle URL parameters for chat selection
 * - getUserName: Get username by user ID
 * - getActiveChatName/getActiveChatPfp: Get active chat display info
 * - selectConversation: Set the active conversation
 * - goToActiveChatProfile: Navigate to a user's profile
 * - sendMessage: Send a new message
 * - getConversationPfp: Get profile picture for a conversation
 * - getUserAvatar: Get avatar for a specific user
 * - isChatActive: Check if a chat is currently active
 * - scrollToBottom: Scroll to the bottom of the message list
 */

import { ref, onMounted, onUnmounted, watch, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { useAllChats } from "@/composables/getConversations";
import { getAllUsers } from "@/composables/getUser";
import {
    useMessages,
    addMessageToChat,
    deleteMessage,
} from "@/composables/getMessages";
import { useSearch } from "@/composables/useSearch";
import { db, auth } from "@/firebase/config";
import { cloneDeep } from "lodash";
import MiniNavbar from "@/components/MiniNavbar.vue";
import ConversationItem from "@/components/ConversationItem.vue";
import SearchBar from "@/components/SearchBar.vue";
import MentionInput from "@/components/MentionInput.vue";
import MessageContent from "@/components/MessageContent.vue";

// Router setup
const router = useRouter();

// UI state refs
const activeChat = ref({});
const newMessage = ref("");
const isMobile = ref(window.innerWidth <= 768);
const isLoading = ref(true);

// Data states refs
const users = ref([]);
const currentUser = ref(null);
const messages = ref([]);

// Loading states
const messageLoading = ref(false);
const sendingMessage = ref(false);
const searchLoading = ref(false);
const conversationsLoading = ref(true);
const chatSelectionLoading = ref(false);

// Chat state refs
const chatIdentifier = ref(null);
const chatType = ref(null);

// Get auth state
const { isAuthenticated, isLoading: authLoading } = useAuth();

// Fetch conversations
const { allChats: conversations, loading: conversationsApiLoading } =
    useAllChats();

// Watch conversations loading state
watch(conversationsApiLoading, (loading) => {
    conversationsLoading.value = loading;
});

// Create function for getting conversation name
const getConversationName = (chat) => {
    if (!chat) return "";

    if (chat.type === "group") {
        return chat.name || "Group Chat";
    }

    // For private chats, find the other user
    const otherUserId = chat.users?.find((id) => id !== currentUser.value?.uid);
    if (!otherUserId) return "Private Chat";

    const otherUser = users.value.find((u) => u.uid === otherUserId);
    return otherUser ? otherUser.username : "Private Chat";
};

// Set up search functionality
const {
    searchQuery,
    filteredConversations,
    handleSearch: originalHandleSearch,
    resetSearch,
} = useSearch({
    conversations,
    getConversationName,
});

// Enhanced search with loading state
const handleSearch = async (query) => {
    searchLoading.value = true;
    try {
        await originalHandleSearch(query);
    } finally {
        searchLoading.value = false;
    }
};

// Computed properties
const hasMessages = computed(() => messages.value && messages.value.length > 0);
const hasActiveChat = computed(
    () => !!activeChat.value.uid || !!activeChat.value.chatKey
);

// Set up message listener when chatIdentifier changes
watch(
    [chatIdentifier, chatType],
    ([newChatId, newChatType]) => {
        // Reset message state
        messageLoading.value = true;
        messages.value = []; // Clear existing messages

        // Don't proceed if missing required info
        if (!newChatId || !newChatType) {
            console.error("Missing required chat information:", {
                chatId: newChatId,
                chatType: newChatType,
            });
            messageLoading.value = false;
            messages.value = []; // Clear any existing messages
            return;
        }

        if (!["private", "group"].includes(newChatType)) {
            console.error(
                `Invalid chat type: ${newChatType}. Must be 'private' or 'group'`
            );
            messageLoading.value = false;
            messages.value = [];
            return;
        }

        console.log(`Loading messages for ${newChatType} chat: ${newChatId}`);

        try {
            // Create a new messages composable instance
            const {
                messages: chatMessages,
                loading,
                error,
            } = useMessages(newChatId, newChatType);

            // Monitor loading state
            watch(
                loading,
                (isLoading) => {
                    messageLoading.value = isLoading;
                    if (!isLoading && chatMessages.value.length === 0) {
                        console.log("No messages found for this chat");
                    }
                },
                { immediate: true }
            );

            // Monitor error state
            watch(
                error,
                (newError) => {
                    if (newError) {
                        console.error("Message loading error:", newError);
                        messageLoading.value = false;
                    }
                },
                { immediate: true }
            );

            // Modify the existing watch for messages to include scroll to bottom
            watch(
                chatMessages,
                (newMessages) => {
                    console.log(
                        `${newMessages.length} messages received for ${newChatType} chat`
                    );
                    messages.value = newMessages;
                    scrollToBottom();
                },
                { immediate: true }
            );

            // Also, add this to scroll when active chat changes
            watch(activeChat, () => {
                scrollToBottom();
            });
        } catch (error) {
            console.error("Error setting up message listener:", error);
            messages.value = [];
            messageLoading.value = false;
        }
    },
    { immediate: true }
);

// Handle window resize
const handleResize = () => {
    isMobile.value = window.innerWidth <= 768;
};

// Handle Escape key press to unselect chat
const handleKeyDown = (event) => {
    if (event.key === "Escape" && !isMobile.value && hasActiveChat.value) {
        clearActiveChat();
    }
};

// Clear active chat selection
const clearActiveChat = () => {
    activeChat.value = {};
    chatIdentifier.value = null;
    chatType.value = null;
    messages.value = [];
};

// Fetch current user data
const fetchCurrentUser = async () => {
    isLoading.value = true;
    try {
        // Check authentication
        if (!isAuthenticated.value && !authLoading.value) {
            router.push("/login");
            return;
        }

        // Get current user (from auth)
        currentUser.value = auth.currentUser;

        // Get all users
        const { users: fetchedUsers, loading: usersLoading } =
            await getAllUsers();

        // Wait for users to load
        watch(
            usersLoading,
            (loading) => {
                if (!loading) {
                    users.value = fetchedUsers.value || [];
                }
            },
            { immediate: true }
        );
    } catch (error) {
        console.error("Error fetching current user:", error);
    } finally {
        // Don't set isLoading to false until both auth and user data are loaded
        watch(
            [authLoading, conversationsApiLoading],
            ([authIsLoading, convsIsLoading]) => {
                if (!authIsLoading && !convsIsLoading) {
                    isLoading.value = false;
                }
            },
            { immediate: true }
        );
    }
};

// Check if there's a chat ID in the route and select it
const handleRouteParams = () => {
    const route = router.currentRoute.value;
    if (route.query.chat) {
        const chatId = route.query.chat;
        const chatType = route.query.type || "private";

        // Find the conversation in the list
        const chat = conversations.value.find(
            (c) =>
                (chatType === "private" && c.chatKey === chatId) ||
                (chatType === "group" && (c.uid === chatId || c.id === chatId))
        );

        if (chat) {
            selectConversation(chat);
        } else {
            console.warn(`Chat with ID ${chatId} not found in conversations`);
        }
    }
};

// Get username by ID
const getUserName = (userId) => {
    if (!userId) return "Unknown User";
    const user = users.value.find((u) => u.uid === userId);
    return user ? user.username : "Unknown User";
};

// Get active chat name and profile picture
const getActiveChatName = () => {
    return activeChat.value.name || getConversationName(activeChat.value);
};

const getActiveChatPfp = () => {
    return activeChat.value.pfp || getConversationPfp(activeChat.value);
};

const selectConversation = async (chat) => {
    if (!chat) return;

    if (activeChat.value.uid === chat.uid) {
        return;
    }

    console.log("Selecting conversation:", chat);

    // Set loading state
    chatSelectionLoading.value = true;

    // Clean up existing messages before loading new ones
    messages.value = [];
    messageLoading.value = true;

    // Update activeChat reference
    activeChat.value = cloneDeep(chat); // Use cloneDeep instead of spread operator

    // Set chatType first
    chatType.value = chat.type;

    if (chat.type === "private") {
        // For private chats, use chatKey as the identifier
        if (!chat.chatKey) {
            console.error("Private chat missing chatKey:", chat);
            // Try to extract from id if available
            if (chat.id) {
                try {
                    // Find the chat document to get its chatKey
                    const chatDoc = await db
                        .collection("chat")
                        .doc(chat.id)
                        .get();
                    if (chatDoc.exists && chatDoc.data().chatKey) {
                        chat.chatKey = chatDoc.data().chatKey;
                        activeChat.value.chatKey = chat.chatKey;
                        console.log(
                            "Retrieved chatKey from document:",
                            chat.chatKey
                        );
                    } else {
                        // Last resort: create a fallback key from users array if available
                        if (chat.users && chat.users.length === 2) {
                            const sortedUsers = [...chat.users].sort();
                            chat.chatKey = `${sortedUsers[0]}_${sortedUsers[1]}`;
                            activeChat.value.chatKey = chat.chatKey;
                            console.log(
                                "Created fallback chatKey:",
                                chat.chatKey
                            );
                        } else {
                            console.error(
                                "Failed to create chatKey - insufficient user data"
                            );
                            messageLoading.value = false;
                            chatSelectionLoading.value = false;
                            return;
                        }
                    }
                } catch (error) {
                    console.error("Error retrieving chat document:", error);
                    messageLoading.value = false;
                    chatSelectionLoading.value = false;
                    return;
                }
            } else {
                console.error(
                    "Unable to determine chat identifier - missing both chatKey and id"
                );
                messageLoading.value = false;
                chatSelectionLoading.value = false;
                return;
            }
        }

        chatIdentifier.value = chat.chatKey;
        console.log(
            `Set chat identifier to private chatKey: ${chatIdentifier.value}`
        );
    } else if (chat.type === "group") {
        // For group chats, use the document ID as identifier
        if (!chat.uid && chat.id) {
            chat.uid = chat.id;
            activeChat.value.uid = chat.id;
            console.log("Using id as uid for group chat:", chat.id);
        }

        if (!chat.uid) {
            console.error("Group chat missing uid:", chat);
            messageLoading.value = false;
            chatSelectionLoading.value = false;
            return; // Don't proceed with an invalid group chat
        }

        chatIdentifier.value = chat.uid;
        console.log(
            `Set chat identifier to group uid: ${chatIdentifier.value}`
        );
    } else {
        console.error("Invalid chat type:", chat.type);
        messageLoading.value = false;
        chatSelectionLoading.value = false;
        return;
    }

    console.log("Selection complete. Chat state:", {
        type: chatType.value,
        identifier: chatIdentifier.value,
        activeChat: activeChat.value,
    });

    // Clear search when selecting a conversation for better UX
    resetSearch();

    // Scroll to bottom after selecting conversation
    nextTick(() => {
        scrollToBottom();
    });

    // Finished conversation selection process
    chatSelectionLoading.value = false;
};

// Go to Profile of active chat
const goToActiveChatProfile = () => {
    if (!activeChat.value) return;
    if (activeChat.value.type === "group") {
        // Redirect to group profile view
        router.push("/group-profile/" + activeChat.value.id);
    } else {
        // Redirect to the other user's profile
        const otherUserId = activeChat.value.users.find(
            (id) => id !== auth.currentUser.uid
        );
        if (!otherUserId) return;
        router.push("/profile/" + otherUserId);
    }
};

// Navigate to a user's profile
const goToProfile = (userId) => {
    if (!userId) return;
    console.log("Navigating to profile:", userId);
    // Navigate to the user's profile page
    router.push("/profile/" + userId);
};

// Send a new message
const sendMessage = async () => {
    if (!newMessage.value.trim()) {
        console.log("Message is empty, not sending");
        return;
    }

    if (!chatIdentifier.value) {
        console.error("Cannot send message: Chat identifier is missing");
        // Try to recover the identifier from activeChat if possible
        if (activeChat.value?.type === "private" && activeChat.value?.chatKey) {
            chatIdentifier.value = activeChat.value.chatKey;
            chatType.value = "private";
            console.log(
                "Recovered chatIdentifier from activeChat:",
                chatIdentifier.value
            );
        } else if (
            activeChat.value?.type === "group" &&
            activeChat.value?.uid
        ) {
            chatIdentifier.value = activeChat.value.uid;
            chatType.value = "group";
            console.log(
                "Recovered chatIdentifier from activeChat:",
                chatIdentifier.value
            );
        } else if (activeChat.value?.type === "group" && activeChat.value?.id) {
            // Fallback to id for group chats
            chatIdentifier.value = activeChat.value.id;
            chatType.value = "group";
            console.log(
                "Recovered chatIdentifier from activeChat id:",
                chatIdentifier.value
            );
        } else {
            console.error(
                "Cannot recover chat identifier from activeChat:",
                activeChat.value
            );
            return;
        }
    }

    // Set sending indicator
    sendingMessage.value = true;

    try {
        // Create message data
        const messageData = {
            content: newMessage.value,
            sender_id: currentUser.value.uid,
            created_at: new Date(),
        };

        console.log(`Sending message to chat: ${chatIdentifier.value}`);

        // Clear the input field immediately for better UX
        newMessage.value = "";

        // Send message using the helper function
        await addMessageToChat(chatIdentifier.value, messageData);

        // Add this to the end, after the message is sent
        scrollToBottom();

        // Force input focus after a small delay to ensure DOM updates are complete
        setTimeout(() => {
            if (messageInputRef.value) {
                messageInputRef.value.focus();
                console.log("Attempting to focus input after sending message");
            }
        }, 50);
    } catch (error) {
        console.error("Error sending message:", error);
        // Show a notification or handle the error (could add a notification system)
    } finally {
        // Reset sending indicator
        sendingMessage.value = false;
    }
};

// Handler for message deletion
const handleDeleteMessage = async (messageId) => {
    if (!messageId || !chatIdentifier.value || !chatType.value) {
        console.error("Cannot delete message: Missing required information");
        return;
    }

    try {
        // Show loading or disable buttons if needed
        console.log(
            `Deleting message ${messageId} from ${chatType.value} chat: ${chatIdentifier.value}`
        );

        // Call the delete function
        await deleteMessage(chatIdentifier.value, messageId, chatType.value);

        // No need to manually update UI as the Firebase listener will update the messages automatically
        console.log("Message deleted successfully");
    } catch (error) {
        console.error("Error deleting message:", error);
        // Show error notification if needed
    }
};

// Lifecycle hooks
onMounted(() => {
    console.log("HomeView mounted");

    // Add window resize and keyboard event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    // Start loading user data
    fetchCurrentUser();

    // Check if there's a chat ID in the route and select it
    handleRouteParams();
});

onUnmounted(() => {
    console.log("HomeView unmounted");

    // Remove window event listeners
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("keydown", handleKeyDown);
    if (auth.currentUser !== null) {
        db.collection("users").doc(auth.currentUser.uid).update({
            status: false,
        });
    }
});

const getConversationPfp = (chat) => {
    if (!chat) return "https://ui-avatars.com/api/?name=Chat";

    if (chat.type === "group") {
        return chat.pfp || require("@/assets/pfp_default.jpg");
    }

    // For private chats, get the other user's profile picture
    const otherUserId = chat.users?.find((id) => id !== currentUser.value?.uid);
    if (!otherUserId) return "https://ui-avatars.com/api/?name=Chat";

    const otherUser = users.value.find((u) => u.uid === otherUserId);
    return otherUser?.pfp || require("@/assets/pfp_default.jpg");
};

const getUserAvatar = (userId) => {
    const user = users.value.find((u) => u.uid === userId);
    return user?.pfp || getConversationPfp(user);
};

// Add this in the script section, along with other methods
const isChatActive = (chat) => {
    if (!activeChat.value || !activeChat.value.uid) return false;
    return chat.uid === activeChat.value.uid;
};

// Create a ref for the message input component
const messageInputRef = ref(null);

// Add this computed property
const activeChatStatus = computed(() => {
    if (!activeChat.value) return "";

    if (activeChat.value.type === "group") {
        const memberCount = activeChat.value.users?.length || 0;
        return `${memberCount} members`;
    } else {
        const otherUserId = activeChat.value.users?.find(
            (id) => id !== currentUser.value?.uid
        );
        if (!otherUserId) return "Unknown User Id";
        const otherUser = users.value.find((u) => u.uid === otherUserId);
        return otherUser.status ? "Online" : "Offline";
    }
});

// Global function to scroll to bottom of messages
const scrollToBottom = () => {
    nextTick(() => {
        const messagesContainer = document.querySelector(".chat-messages");
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });
};

// Computed property to get users from active chat
const activeChatUsers = computed(() => {
    // If no active chat or it's not a group chat, return an empty array
    if (
        !activeChat.value ||
        !activeChat.value.type ||
        activeChat.value.type !== "group"
    ) {
        return [];
    }

    // Get user IDs from the active group chat
    const memberIds = activeChat.value.users || [];

    // Filter the users array to only include users in the active group
    return users.value.filter(
        (user) =>
            // Don't include current user in mentions
            user.uid !== currentUser.value?.uid &&
            // Only include users who are members of the active group
            memberIds.includes(user.uid)
    );
});
</script>

<style scoped>
.home-container {
    display: flex;
    width: 100%;
    height: 100vh;
    padding: 20px;
    gap: 20px;
    background-color: var(--light-bg);
}

.item {
    background-color: white;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-lg);
}

.conversation-list {
    flex: 0 0 30%;
    max-width: 350px;
    min-width: 280px;
    /* Add padding to contain the search bar */
    padding: var(--spacing-md);
    padding-bottom: 0; /* Remove bottom padding if conversations container has its own */
}

/* Add margin specifically to the SearchBar component instance */
.conversation-list > .search-container {
    margin-bottom: var(--spacing-md);
}

.conversations-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
    padding-top: 0; /* Adjust if needed based on search bar margin */
}

.conversation-list-items {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.conversation-list-items > div {
    position: relative;
}

.conversation-list-items > div.active-chat::before {
    content: "";
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 70%;
    background-color: var(--primary-color);
    border-radius: 2px;
}

.current-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--gray-200);
    background-color: white;
}

.chat-header-user {
    display: flex;
    align-items: center;
    width: 100%;
}

.chat-pic {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: var(--spacing-md);
    border: 2px solid white;
    box-shadow: var(--shadow-sm);
}

.chat-info {
    display: flex;
    flex-direction: column;
}

.chat-info h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--gray-800);
    margin: 0;
}

.chat-info p {
    margin: 0;
    font-size: 0.85rem;
}

.cursor-pointer {
    cursor: pointer;
}

.loading-container-small {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
    color: var(--gray-500);
}

.loading-spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 3px solid var(--gray-200);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}

.no-results {
    padding: var(--spacing-lg);
    text-align: center;
    color: var(--gray-500);
}

/* Chat messages area */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: #ffffff;
    position: relative;
}

.message-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--spacing-xl);
    color: var(--gray-500);
}

.messages-container {
    display: flex;
    flex-direction: column;
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
    margin-top: auto; /* Push content to bottom */
}

.message-wrapper {
    display: flex;
    max-width: 70%;
    margin-bottom: var(--spacing-sm);
    animation: fadeIn 0.3s ease;
    transition: transform 0.2s ease;
}

.message-wrapper:hover {
    transform: translateY(-1px);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-wrapper.sent {
    margin-left: auto;
    flex-direction: row-reverse;
}

.message-wrapper.received {
    margin-right: auto;
}

/* Consecutive messages from the same sender styling */
.message-wrapper.sent + .message-wrapper.sent,
.message-wrapper.received + .message-wrapper.received {
    margin-top: -5px;
}

.message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 var(--spacing-sm);
    align-self: flex-end;
    border: 2px solid white;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease;
}

.message-avatar:hover {
    transform: scale(1.05);
}

.message-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.message-content {
    display: flex;
    flex-direction: column;
}

.message-sender {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--gray-600);
    margin-bottom: 2px;
    padding-left: var(--spacing-xs);
}

.message-bubble {
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm) var(--spacing-md);
    max-width: 100%;
    position: relative;
    box-shadow: var(--shadow-sm);
}

.sent .message-bubble,
.message-bubble.sent-bubble {
    background-color: var(--sent-message-bg, #3c6e71) !important;
    color: var(--sent-message-color, white);
    border-top-right-radius: var(--radius-sm);
    box-shadow: var(--shadow-md);
}

.received .message-bubble {
    background-color: var(--received-message-bg);
    color: var(--received-message-color);
    border-top-left-radius: var(--radius-sm);
}

.message-bubble p {
    margin: 0;
    word-break: break-word;
}

.active-chat-name {
    cursor: pointer;
}

.message-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 2px;
}

.timestamp {
    font-size: 0.7rem;
    color: var(--gray-500);
    margin: 0 4px;
    position: static;
    bottom: auto;
    right: auto;
}

.no-messages,
.chat-placeholder {
    height: 100%;
    padding: var(--spacing-xl);
    color: var(--gray-500);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.no-messages i,
.chat-placeholder i {
    color: var(--gray-300);
}

.chat-input {
    padding: var(--spacing-md);
    background-color: white;
    border-top: 1px solid var(--gray-200);
    position: relative;
    z-index: 5;
}

.input-group {
    position: relative;
    box-shadow: var(--shadow-sm);
    border-radius: var(--radius-full);
    background-color: white;
}

.message-input {
    border-radius: var(--radius-full) 0 0 var(--radius-full) !important;
    padding: 0.75rem 1.25rem;
    height: 50px;
    border: 1px solid var(--gray-200);
    border-right: none;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    background-color: white;
}

.message-input:focus {
    box-shadow: none;
    border-color: var(--primary-color);
}

.message-input:disabled {
    background-color: var(--gray-100);
    cursor: not-allowed;
}

.send-btn {
    background-color: var(--primary-color);
    color: white;
    border-radius: 0 var(--radius-full) var(--radius-full) 0;
    width: 50px;
    height: 50px;
    padding: 0;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.send-btn:hover:not(:disabled) {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
}

.send-btn:active:not(:disabled) {
    transform: translateY(0);
}

.send-btn:disabled {
    background-color: var(--gray-400);
    cursor: not-allowed;
}

.send-btn i {
    font-size: 1.1rem;
}

.sending-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.sending-spinner {
    width: 1.2rem;
    height: 1.2rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

.back-button {
    position: relative;
    box-shadow: var(--shadow-sm);
    border-radius: var(--radius-full);
    background-color: white;
}

.message-input {
    border-radius: var(--radius-full) 0 0 var(--radius-full) !important;
    padding: 0.75rem 1.25rem;
    height: 50px;
    border: 1px solid var(--gray-200);
    border-right: none;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    background-color: white;
}

.message-input:focus {
    box-shadow: none;
    border-color: var(--primary-color);
}

.message-input:disabled {
    background-color: var(--gray-100);
    cursor: not-allowed;
}

.send-btn {
    background-color: var(--primary-color);
    color: white;
    border-radius: 0 var(--radius-full) var(--radius-full) 0;
    width: 50px;
    height: 50px;
    padding: 0;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.send-btn:hover:not(:disabled) {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
}

.send-btn:active:not(:disabled) {
    transform: translateY(0);
}

.send-btn:disabled {
    background-color: var(--gray-400);
    cursor: not-allowed;
}

.send-btn i {
    font-size: 1.1rem;
}

.sending-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.sending-spinner {
    width: 1.2rem;
    height: 1.2rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

.back-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 8px;
    margin-right: 10px;
    color: var(--gray-600);
    transition: color 0.2s;
}

.back-button:hover {
    color: var(--gray-800);
}

.back-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Mobile Layout */
@media screen and (max-width: 768px) {
    .home-container {
        padding: 10px;
        gap: 10px;
    }

    .item {
        padding: 0;
    }

    .chat-header {
        padding: var(--spacing-sm);
    }

    .chat-pic {
        width: 38px;
        height: 38px;
        margin-right: var(--spacing-sm);
    }

    .chat-info h3 {
        font-size: 1rem;
    }

    .message-wrapper {
        max-width: 85%;
    }

    .messages-container {
        padding: var(--spacing-sm);
        gap: var(--spacing-sm);
    }

    .message-bubble {
        padding: var(--spacing-xs) var(--spacing-sm);
    }

    .main-content {
        width: calc(100% - 60px);
        height: 100%;
    }

    .chat-input {
        padding: var(--spacing-sm);
    }

    .message-input {
        height: 45px;
        font-size: 0.9rem;
    }

    .send-btn {
        width: 45px;
        height: 45px;
    }

    .send-btn i {
        font-size: 0.9rem;
    }

    .main-content {
        width: calc(100% - 50px);
    }

    .chat-list-view {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: var(--spacing-sm);
    }

    /* Add margin specifically to the SearchBar component instance in mobile */
    .chat-list-view > .search-container {
        margin-bottom: var(--spacing-sm);
    }

    .conversations {
        flex: 1;
        overflow-y: auto;
        /* Add negative margin if padding was added to parent */
        margin: 0 calc(-1 * var(--spacing-sm));
        padding: 0 var(--spacing-sm);
    }

    .conversation-item {
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--gray-100);
    }

    .current-chat-view {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .chat-header {
        padding: var(--spacing-sm) var(--spacing-md);
    }

    .chat-pic {
        width: 40px;
        height: 40px;
        margin-right: var(--spacing-sm);
    }

    .chat-info h3 {
        font-size: 1rem;
    }

    .chat-info p {
        font-size: 0.8rem;
    }

    .chat-messages {
        flex: 1;
        background-color: #ffffff;
    }

    .messages-container {
        padding: var(--spacing-md);
        gap: var(--spacing-sm);
    }

    .message-wrapper {
        max-width: 80%;
    }

    .message-avatar {
        width: 30px;
        height: 30px;
    }

    .message-bubble {
        padding: var(--spacing-xs) var(--spacing-sm);
    }

    .chat-input {
        padding: var(--spacing-sm);
    }

    .message-input {
        height: 45px;
        padding: 0.6rem 1rem;
        font-size: 0.9rem;
    }

    .send-btn {
        height: 45px;
        width: 45px;
    }

    .send-btn i {
        font-size: 1rem;
    }
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100%;
    background-color: var(--light-bg);
}

.loading-container .loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid var(--gray-200);
    border-top-color: var(--primary-color);
    margin-bottom: var(--spacing-md);
}

.loading-container p {
    font-size: 1.2rem;
    color: var(--gray-600);
    font-weight: 500;
}

@media screen and (max-width: 768px) {
    .loading-container .loading-spinner {
        width: 2.5rem;
        height: 2.5rem;
    }

    .loading-container p {
        font-size: 1.1rem;
    }
}

.report {
    color: black;
    width: 70px;
    height: 30px;
    border: none;
    border-radius: 7px;
    background-color: #d9d9d9;
}
</style>
