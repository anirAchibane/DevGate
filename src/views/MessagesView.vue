<template>
    <div class="messages-container" v-if="!isBanned">
        <mini-navbar />
        <!-- <div class="action-bar">
            <button class="btn btn-primary" @click="openAddChatModal">
                <i class="fas fa-plus-circle me-2"></i> New Conversation
            </button>
        </div> -->
        <div class="messages-layout">
            <div class="conversations-panel">
                <!-- Search bar for chats -->
                <div class="chat-search-container">
                    <i class="fas fa-search search-icon"></i>
                    <input v-model="chatSearchQuery" class="chat-search-input" type="text"
                        placeholder="Search by username..." />
                    <button v-if="chatSearchQuery" class="clear-search-btn" @click="chatSearchQuery = ''">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="add-chat-btn" @click="openAddChatModal">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                </div>

                <div v-if="loading" class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading conversations...</p>
                </div>
                <div v-else-if="filteredConversations.length === 0" class="empty-state">
                    <i class="fas fa-comment-slash fa-3x mb-3"></i>
                    <p v-if="chatSearchQuery">No conversations match your search</p>
                    <p v-else>No conversations yet</p>
                    <p class="empty-state-hint">Start a new conversation using the button above</p>
                </div>
                <div v-else class="conversations-list">
                    <ConversationItem v-for="chat in filteredConversations" :key="chat.id" :chat="chat"
                        :active="selectedChat?.id === chat.id" :isCurrentlyActive="selectedChat?.id === chat.id"
                        @select="selectChat" />
                </div>
            </div>
            <div class="chat-panel">
                <!-- Chat header with user profile info -->
                <div v-if="selectedChat && otherUserDetails" class="chat-header"
                    @click="goToUserProfile(otherUserDetails.id)">
                    <div class="chat-header-content">
                        <img :src="otherUserDetails.avatar || require('@/assets/default_pfp.jpg')" class="user-avatar"
                            alt="Profile Picture">
                        <div class="user-info">
                            <h5 class="username">{{ otherUserDetails.username }}</h5>
                            <!-- <small class="user-status">Click to view profile</small> -->
                        </div>
                    </div>
                </div>
                <MessageContent v-if="selectedChat" :chat="selectedChat" />
                <div v-else class="empty-chat">
                    <div class="empty-chat-content">
                        <i class="fas fa-comments fa-4x mb-3"></i>
                        <p>Select a conversation to start messaging</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Chat Modal -->
        <div v-if="showAddChatModal" class="modal-overlay" @click.self="closeAddChatModal">
            <div class="modal-card">
                <div class="modal-header">
                    <h5 class="modal-title">Start a Conversation</h5>
                    <button type="button" class="modal-close-btn" @click="closeAddChatModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="search-container">
                        <i class="fas fa-search search-icon"></i>
                        <input v-model="searchUsername" class="search-input" type="text"
                            placeholder="Search by username" @input="handleSearch">
                    </div>
                    <div class="search-results">
                        <div v-if="searchUsername && !searchResults.length" class="no-results">
                            <p>No users found matching "{{ searchUsername }}"</p>
                        </div>
                        <ul v-else class="user-list">
                            <li v-for="user in searchResults" :key="user.id" class="user-list-item">
                                <div class="user-list-info">
                                    <img :src="user.avatar || require('@/assets/default_pfp.jpg')"
                                        class="user-list-avatar" alt="User avatar">
                                    <span class="user-list-name">{{ user.username }}</span>
                                </div>
                                <button class="btn btn-sm btn-primary" @click="addChat(user.id)">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-else>
        <h1 class="text-center text-white mt-5">Error accessing app: Access denied</h1>
    </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { useConversations } from "@/composables/useConversations";
import ConversationItem from "@/components/ConversationItem.vue";
import MessageContent from "@/components/MessageContent.vue";
import MiniNavbar from "@/components/MiniNavbar.vue";
import { db, auth } from "@/firebase/config";
import { useRouter } from "vue-router";

const router = useRouter();
const isBanned = ref(false);
const { conversations, loading } = useConversations();
const selectedChat = ref(null);
const showAddChatModal = ref(false);
const searchUsername = ref("");
const searchResults = ref([]);
const otherUserDetails = ref(null);
const chatSearchQuery = ref("");
const usernameMap = ref({}); // Store usernames by user ID for searching

// Fill username map on component mount
onMounted(() => {
    db.collection("users").doc(auth.currentUser?.uid).get().then(doc => {
        if (doc.exists) {
            isBanned.value = doc.data().role === "banned";
        }
    });
    // Initialize from localStorage cache if available
    try {
        const cachedUsernames = JSON.parse(localStorage.getItem('usernameCache') || '{}');
        usernameMap.value = { ...cachedUsernames };
    } catch (e) {
        console.error("Error loading cached usernames:", e);
    }

    // Pre-populate username map with all conversations
    setTimeout(async () => {
        if (conversations.value && conversations.value.length > 0) {
            for (const chat of conversations.value) {
                if (chat.users) {
                    const currentUserId = auth.currentUser?.uid;
                    const otherUserId = chat.users.find(id => id !== currentUserId);
                    if (otherUserId && !usernameMap.value[otherUserId]) {
                        await fetchUsernameForUser(otherUserId);
                    }
                }
            }
        }
    }, 500);
});

// Fetch and cache username for a user ID
const fetchUsernameForUser = async (userId) => {
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            // Update both local map and localStorage cache
            usernameMap.value = { ...usernameMap.value, [userId]: userData.username };

            const cachedUsernames = JSON.parse(localStorage.getItem('usernameCache') || '{}');
            cachedUsernames[userId] = userData.username;
            localStorage.setItem('usernameCache', JSON.stringify(cachedUsernames));
        }
    } catch (error) {
        console.error("Error fetching username for user:", error);
    }
};

// Filter conversations based on search query with improved username matching
const filteredConversations = computed(() => {
    if (!chatSearchQuery.value.trim()) {
        return conversations.value;
    }

    const query = chatSearchQuery.value.toLowerCase();

    return conversations.value.filter(chat => {
        if (!chat.users) return false;

        const currentUserId = auth.currentUser?.uid;
        const otherUserId = chat.users.find(id => id !== currentUserId);

        if (!otherUserId) return false;

        // Check if we have a username for this user in our map
        const username = usernameMap.value[otherUserId];

        return username && username.toLowerCase().includes(query);
    });
});

const fetchOtherUserDetails = async (userId) => {
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();

            // Update username map for search
            usernameMap.value = { ...usernameMap.value, [userId]: userData.username };

            // Update localStorage cache
            const cachedUsernames = JSON.parse(localStorage.getItem('usernameCache') || '{}');
            cachedUsernames[userId] = userData.username;
            localStorage.setItem('usernameCache', JSON.stringify(cachedUsernames));

            return {
                id: userId,
                ...userData
            };
        }
    } catch (error) {
        console.error("Error fetching user details:", error);
    }
    return null;
};

const selectChat = async (chat) => {
    selectedChat.value = chat;

    // Get the other user in the conversation
    if (chat && chat.users) {
        const currentUserId = auth.currentUser?.uid;
        const otherUserId = chat.users.find(id => id !== currentUserId);

        if (otherUserId) {
            otherUserDetails.value = await fetchOtherUserDetails(otherUserId);
        }

        // Mark messages as read when selecting a chat
        try {
            if (chat.unreadMessages && chat.unreadMessages[currentUserId] > 0) {
                // Reset unread counter for this user
                await db.collection("chat").doc(chat.id).update({
                    [`unreadMessages.${currentUserId}`]: 0
                });
            }
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    }
};

// Navigate to user profile
const goToUserProfile = (userId) => {
    if (userId) {
        router.push(`/profil/${userId}`);
    }
};

const openAddChatModal = () => {
    showAddChatModal.value = true;
};

const closeAddChatModal = () => {
    showAddChatModal.value = false;
    searchUsername.value = "";
    searchResults.value = [];
};

const addChat = async (userId) => {
    await createChat(userId);
    closeAddChatModal();
};

const searchUsersByUsername = async (username) => {
    // Get users that match the search query
    const usersRef = db.collection("users");
    const snapshot = await usersRef.orderBy("username").startAt(username).endAt(username + "\uf8ff").get();
    const matchingUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get the list of users that the current user already has chats with
    const currentUserId = auth.currentUser?.uid;
    const existingChatPartners = new Set();

    // Add the current user's ID to exclude self from search results
    existingChatPartners.add(currentUserId);

    // Add all users the current user already has chats with
    if (conversations.value && conversations.value.length > 0) {
        conversations.value.forEach(chat => {
            if (chat.users) {
                const otherUserId = chat.users.find(id => id !== currentUserId);
                if (otherUserId) {
                    existingChatPartners.add(otherUserId);
                }
            }
        });
    }

    // Filter out users that the current user already has chats with
    return matchingUsers.filter(user => !existingChatPartners.has(user.id));
};

const createChat = async (userId) => {
    const currentUserId = auth.currentUser?.uid;
    const chatRef = db.collection("chat").doc();
    await chatRef.set({
        createdAt: new Date(),
        lastUpdate: new Date(),
        lastMessage: null,
        users: [currentUserId, userId],
        // Add unreadMessages object to track unread status for each user
        unreadMessages: {
            [currentUserId]: 0,  // Number of unread messages for current user
            [userId]: 0           // Number of unread messages for the other user
        }
    });
};

// Handle AddChat function
const handleSearch = async () => {
    if (searchUsername.value.trim()) {
        searchResults.value = await searchUsersByUsername(searchUsername.value);
    } else {
        searchResults.value = [];
    }
};

watch(searchUsername, async (newVal) => {
    if (newVal.trim()) {
        searchResults.value = await searchUsersByUsername(newVal);
    } else {
        searchResults.value = [];
    }
});
</script>

<style scoped>
.messages-container {
    width: 100%;
    height: 100%;
    margin: 0 auto;
    padding: var(--spacing-lg);
}

.messages-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: var(--spacing-md);
    color: var(--text-primary);
    text-align: center;
    position: relative;
}

.messages-title::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background-color: var(--primary-color);
    border-radius: var(--radius-full);
}

.action-bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--spacing-md);
}

.messages-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--spacing-md);
    height: calc(100vh - 200px);
    min-height: 500px;
}

.conversations-panel {
    background-color: var(--background-secondary);
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-sm);
}

.conversations-list {
    overflow-y: auto;
    flex-grow: 1;
    padding: var(--spacing-xs);
}

.chat-panel {
    display: flex;
    flex-direction: column;
    background-color: var(--background-secondary);
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-sm);
}

.chat-header {
    background-color: rgba(13, 17, 23, 0.8);
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-light);
    cursor: pointer;
    transition: all var(--transition-normal);
}

.chat-header:hover {
    background-color: rgba(21, 29, 40, 0.9);
}

.chat-header-content {
    display: flex;
    align-items: center;
}

.user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--primary-color);
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-fast);
}

.chat-header:hover .user-avatar {
    transform: scale(1.05);
}

.user-info {
    margin-left: var(--spacing-md);
}

.username {
    margin: 0;
    font-weight: 600;
    color: var(--text-primary);
}

.user-status {
    color: var(--primary-color);
    font-size: 0.8rem;
}

.empty-chat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--spacing-xl);
    color: var(--text-muted);
}

.empty-chat-content {
    text-align: center;
}

.empty-chat i {
    color: var(--borders-grey);
    opacity: 0.5;
}

/* Loading and empty states */
.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--spacing-md);
    color: var(--text-muted);
    text-align: center;
}

.spinner {
    width: 40px;
    height: 40px;
    margin-bottom: var(--spacing-md);
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s infinite linear;
}

.empty-state i {
    color: var(--borders-grey);
    opacity: 0.5;
}

.empty-state-hint {
    font-size: 0.8rem;
    margin-top: var(--spacing-sm);
    opacity: 0.8;
}

/* Modal styling */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(1, 5, 8, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
}

.modal-card {
    background-color: var(--background-secondary);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 500px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    overflow: hidden;
    animation: modal-in 0.3s ease-out forwards;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-light);
}

.modal-title {
    margin: 0;
    color: var(--text-primary);
    font-weight: 600;
}

.modal-close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.1rem;
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
}

.modal-close-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
}

.modal-body {
    padding: var(--spacing-md);
}

/* Search styling */
.search-container {
    position: relative;
    margin-bottom: var(--spacing-md);
}

.search-icon {
    position: absolute;
    left: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
}

.search-input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-md) * 2 + 16px);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-light);
    background-color: rgba(13, 17, 23, 0.7);
    color: var(--text-primary);
    transition: all var(--transition-fast);
}

.search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.search-results {
    max-height: 300px;
    overflow-y: auto;
}

/* User list styling */
.user-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.user-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    transition: background-color var(--transition-fast);
    border-bottom: 1px solid var(--border-light);
}

.user-list-item:last-child {
    border-bottom: none;
}

.user-list-item:hover {
    background-color: rgba(13, 17, 23, 0.7);
}

.user-list-info {
    display: flex;
    align-items: center;
}

.user-list-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: var(--spacing-md);
    border: 1px solid var(--border-light);
}

.user-list-name {
    font-weight: 500;
    color: var(--text-primary);
}

.no-results {
    padding: var(--spacing-md);
    text-align: center;
    color: var(--text-muted);
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes modal-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .messages-layout {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
    }

    .conversations-panel {
        max-height: 300px;
    }

    .chat-panel {
        height: calc(100vh - 500px);
        min-height: 400px;
    }
}

/* Chat search styling */
.chat-search-container {
    position: relative;
    padding: var(--spacing-sm);
    border-bottom: 1px solid var(--border-light);
    background-color: rgba(1, 5, 8, 0.3);
    display: flex;
    flex-direction: row;
}

.chat-search-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) calc(var(--spacing-md) * 2 + 8px);
    border-radius: var(--radius-full);
    border: 1px solid var(--border-light);
    background-color: rgba(13, 17, 23, 0.7);
    color: var (--text-primary);
    font-size: 0.9rem;
    transition: all var(--transition-fast);
}

.chat-search-input:focus {
    outline: none;
    border-color: var(--lighter-blue);
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.search-icon {
    position: absolute;
    left: calc(var(--spacing-sm) + var(--spacing-sm));
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 0.9rem;
}

.clear-search-btn {
    position: absolute;
    right: calc(var(--spacing-sm) + var(--spacing-xs));
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 0.8rem;
    transition: all var(--transition-fast);
}

.clear-search-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var (--text-primary);
}

/* Add chat button styling */
.add-chat-btn {
    background-color: #3498db;
    /* Specific color as requested */
    color: white;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-left: var(--spacing-sm);
    transition: all var(--transition-fast);
    flex-shrink: 0;
}

.add-chat-btn:hover {
    background-color: #2980b9;
    transform: scale(1.05);
}

.add-chat-btn i {
    font-size: 1rem;
}
</style>