<template>
    <mini-navbar></mini-navbar>
    <div class="chat-container" v-if="!isLoading">
        <!-- Desktop Layout -->
        <div class="chat-layout">
            <!-- Left sidebar - Conversation list -->
            <div class="sidebar-container">
                <div class="sidebar-header">
                    <h2>Messages</h2>
                    <button @click="showNewChatUI = !showNewChatUI" class="new-chat-btn"
                        :class="{ 'active': showNewChatUI }">
                        <i class="fas" :class="showNewChatUI ? 'fa-times' : 'fa-plus'"></i>
                    </button>
                </div>

                <!-- New chat UI -->
                <div v-if="showNewChatUI" class="new-chat-container">
                    <div class="search-form">
                        <input v-model="searchQuery" type="text" class="search-input"
                            placeholder="Search by username..." @input="searchUsers" />
                    </div>

                    <!-- User selection list -->
                    <div class="user-results">
                        <div v-if="searching" class="searching">
                            <div class="spinner-small"></div>
                            <span>Searching users...</span>
                        </div>

                        <div v-else-if="filteredUsers.length" class="user-list">
                            <div v-for="user in filteredUsers" :key="user.id" class="user-select-row"
                                @click="startChatWith(user.id)">
                                <div class="user-avatar">
                                    <img :src="user.avatar || require('@/assets/default_pfp.jpg')" alt="User avatar" />
                                </div>
                                <div class="user-details">
                                    <div class="username">{{ user.username }}</div>
                                    <div class="name" v-if="user.name">{{ user.name }}</div>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="searchQuery.trim()" class="no-results">
                            <p>No matching users found.</p>
                        </div>

                        <div v-else class="search-prompt">
                            <p>Enter a username to find users</p>
                        </div>
                    </div>
                </div>

                <!-- Regular conversations list -->
                <div v-else class="conversations-container">
                    <!-- Loading state -->
                    <div v-if="chatsLoading" class="loading-container">
                        <div class="spinner"></div>
                        <p>Loading conversations...</p>
                    </div>

                    <!-- No conversations -->
                    <div v-else-if="chats.length === 0" class="no-chats">
                        <i class="fas fa-comments"></i>
                        <p>No conversations yet</p>
                        <p class="no-chats-hint">Click the + button to start a new conversation</p>
                    </div>

                    <!-- Conversation list -->
                    <div v-else class="chat-list">
                        <div v-for="chat in chats" :key="chat.id" @click="selectChat(chat)"
                            :class="{ 'active': activeChat && activeChat.id === chat.id }">
                            <ChatConversationItem :chat="chat" :otherUser="getChatOtherUser(chat)" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right section - Current chat -->
            <div class="chat-content-container">
                <div v-if="!activeChat" class="no-chat-selected">
                    <div class="no-chat-content">
                        <i class="fas fa-comment-dots"></i>
                        <h3>Select a conversation</h3>
                        <p>Choose a conversation from the list to start chatting</p>
                    </div>
                </div>

                <div v-else class="active-chat-container">
                    <!-- Chat header -->
                    <div class="chat-header">
                        <div class="chat-header-info">
                            <img :src="activeOtherUser?.avatar || require('@/assets/default_pfp.jpg')" alt="Profile"
                                class="chat-header-avatar" />
                            <div class="chat-header-details">
                                <h3>{{ activeOtherUser?.username || 'User' }}</h3>
                            </div>
                        </div>
                        <div class="chat-header-actions">
                            <router-link :to="'/profile/' + activeOtherUser?.id" class="profile-link">
                                <button class="profile-btn" title="View profile">
                                    <i class="fas fa-user"></i>
                                </button>
                            </router-link>
                        </div>
                    </div>

                    <!-- Messages area - Completely redesigned rendering approach -->
                    <div class="messages-container" ref="messagesContainer">
                        <!-- Loading state -->
                        <div v-if="messagesLoading" class="loading-container">
                            <div class="spinner"></div>
                            <p>Loading messages...</p>
                        </div>
                        
                        <!-- No messages -->
                        <div v-else-if="messages.length === 0" class="no-messages">
                            <i class="fas fa-paper-plane"></i>
                            <p>No messages yet</p>
                            <p class="no-messages-hint">Send a message to start the conversation</p>
                        </div>
                        
                        <!-- Messages list - Simplified rendering -->
                        <template v-else>
                            <div class="messages-list">
                                <template v-for="message in messages" :key="message.id">
                                    <div :class="[
                                        'message-row',
                                        message.sender_id === currentUser?.uid ? 'message-sent' : 'message-received'
                                    ]">
                                        <ChatMessageItem 
                                            :message="message" 
                                            :isSent="message.sender_id === currentUser?.uid"
                                            @delete="deleteMessageHandler" 
                                        />
                                    </div>
                                </template>
                            </div>
                        </template>
                    </div>

                    <!-- Message input -->
                    <div class="message-input-container">
                        <textarea v-model="newMessage" placeholder="Type a message..." class="message-input"
                            @keydown.enter.prevent="sendMessage" :disabled="sendingMessage"></textarea>
                        <button class="send-button" @click="sendMessage"
                            :disabled="!newMessage.trim() || sendingMessage">
                            <i v-if="!sendingMessage" class="fas fa-paper-plane"></i>
                            <div v-else class="spinner-small"></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="loading-page">
        <div class="spinner-large"></div>
        <p>Loading chat...</p>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db, firebase } from '@/firebase/config';
import { useChats } from '@/composables/getChats';
import { deleteMessage, createChat } from '@/composables/getChatMessages';
import ChatConversationItem from '@/components/ChatConversationItem.vue';
import ChatMessageItem from '@/components/ChatMessageItem.vue';
import MiniNavbar from '@/components/MiniNavbar.vue';

// Router
const router = useRouter();

// State variables
const isLoading = ref(true);
const currentUser = ref(null);
const activeChat = ref(null);
const newMessage = ref('');
const sendingMessage = ref(false);
const messagesContainer = ref(null);

// New chat UI state
const showNewChatUI = ref(false);
const searchQuery = ref('');
const allUsers = ref([]);
const searching = ref(false);

// User data for chat participants
const usersData = ref({}); // Store user data by ID

// Get chats
const { chats, loading: chatsLoading } = useChats();

// Messages state for active chat
const messages = ref([]);
const messagesLoading = ref(false);
const messagesError = ref(null);
const messagesUnsubscribe = ref(null);

// Filtered users based on search
const filteredUsers = computed(() => {
    if (!searchQuery.value.trim()) return [];

    const query = searchQuery.value.toLowerCase();
    return allUsers.value
        .filter(user => user.id !== currentUser.value?.uid) // Don't show current user
        .filter(user =>
            user.username?.toLowerCase().includes(query)
        );
});

// Get all users for search
const fetchAllUsers = async () => {
    try {
        const snapshot = await db.collection("users").get();
        allUsers.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching users:", error);
    }
};

// Search users
const searchUsers = () => {
    if (!allUsers.value.length) {
        searching.value = true;
        fetchAllUsers().finally(() => {
            searching.value = false;
        });
    }
};

// Start a chat with user
const startChatWith = async (userId) => {
    try {
        // Show loading state
        searching.value = true;

        // Create or get existing chat
        const chatId = await createChat(userId);

        // Reset search UI
        searchQuery.value = '';
        showNewChatUI.value = false;

        // Find the chat in chat list
        // Wait for chats to update with the new chat
        const checkChatExists = () => {
            const chat = chats.value.find(c => c.id === chatId);
            if (chat) {
                selectChat(chat);
                return true;
            }
            return false;
        };

        // Try immediately
        if (!checkChatExists()) {
            // Wait for the chats to update and try again
            watch(chats, () => {
                if (checkChatExists()) {
                    return true;
                }
            });
        }
    } catch (error) {
        console.error("Error creating chat:", error);
    } finally {
        searching.value = false;
    }
};

// Get the other user in a chat (for 1-to-1 chats)
const getChatOtherUser = (chat) => {
    if (!chat || !chat.users || !currentUser.value) return null;

    const otherUserId = chat.users.find(userId => userId !== currentUser.value.uid);
    if (!otherUserId) return null;

    return usersData.value[otherUserId] || { id: otherUserId };
};

// Active other user in current chat
const activeOtherUser = computed(() => {
    if (!activeChat.value) return null;
    return getChatOtherUser(activeChat.value);
});

// Select a chat to view
const selectChat = async (chat) => {
    if (activeChat.value && activeChat.value.id === chat.id) return;
    
    try {
        // Clean up previous chat subscription
        if (messagesUnsubscribe.value) {
            messagesUnsubscribe.value();
            messagesUnsubscribe.value = null;
        }
        
        // Set loading state first
        messagesLoading.value = true;
        messages.value = []; // Clear previous messages
        
        // Set active chat
        activeChat.value = chat;
        newMessage.value = '';
        
        // Keep a reference to the current chat ID for closure safety
        const currentChatId = chat.id;
        
        // Set up messages subscription with a more robust approach
        messagesUnsubscribe.value = db
            .collection("chat")
            .doc(currentChatId)
            .collection("messages")
            .orderBy("created_at", "asc")
            .limit(100)
            .onSnapshot(
                (snapshot) => {
                    // Only proceed if we haven't switched to a different chat
                    if (activeChat.value?.id !== currentChatId) {
                        return;
                    }
                    
                    // Process snapshot in a way that minimizes DOM updates
                    const newMessages = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    // Set messages with proper Vue reactivity
                    messages.value = newMessages;
                    messagesLoading.value = false;
                    
                    // Queue scrolling in next tick to avoid accessing DOM before Vue updates
                    requestAnimationFrame(() => {
                        if (messagesContainer.value) {
                            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                        }
                    });
                },
                (err) => {
                    console.error("Error fetching messages:", err);
                    // Only update error state if this is still the active chat
                    if (activeChat.value?.id === currentChatId) {
                        messagesLoading.value = false;
                        messagesError.value = `Error loading messages: ${err.message}`;
                    }
                }
            );
    } catch (error) {
        console.error("Error setting up chat listener:", error);
        if (activeChat.value?.id === chat.id) {
            messagesLoading.value = false;
            messagesError.value = `Error: ${error.message}`;
        }
    }
};

// Send a new message - completely rewritten to avoid DOM errors
const sendMessage = async () => {
    // Skip if no message, no active chat, or already sending
    if (!newMessage.value.trim() || !activeChat.value || sendingMessage.value) return;
    
    // Store message content and clear input immediately
    const messageContent = newMessage.value.trim();
    newMessage.value = '';
    
    try {
        // Disable send button during operation
        sendingMessage.value = true;
        
        // Send directly to Firebase without using the composable
        if (!auth.currentUser) {
            throw new Error("User not authenticated");
        }
        
        const chatId = activeChat.value.id;
        
        // Create message data
        const messageData = {
            content: messageContent,
            sender_id: auth.currentUser.uid,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
        };
        
        // Use a batch write to ensure consistency
        const batch = db.batch();
        
        // Add new message
        const newMessageRef = db
            .collection("chat")
            .doc(chatId)
            .collection("messages")
            .doc();
            
        batch.set(newMessageRef, messageData);
        
        // Update chat metadata
        const chatRef = db.collection("chat").doc(chatId);
        batch.update(chatRef, {
            lastMessage: {
                content: messageContent,
                sender_id: auth.currentUser.uid,
            },
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
        });
        
        // Commit the batch
        await batch.commit();
        
        // No need to update the UI - Firebase listener will do that
    } catch (error) {
        console.error('Error sending message:', error);
        // Only show the error in the console, don't try to recover the UI state
        // This prevents potential race conditions with DOM updates
    } finally {
        // Ensure sending state is reset
        sendingMessage.value = false;
    }
};

// Delete a message
const deleteMessageHandler = async (messageId) => {
    if (!activeChat.value || !messageId) return;

    try {
        await deleteMessage(activeChat.value.id, messageId);
        // The message will be removed via the Firebase listener
    } catch (error) {
        console.error('Error deleting message:', error);
        // Optional: Add error handling UI here
    }
};

// Load user data for chat participants
const loadUserData = async () => {
    // Get current user first
    try {
        // Use the authenticated user directly instead of relying on getCurrentUser
        if (auth.currentUser) {
            currentUser.value = auth.currentUser;

            // Also fetch additional user data if needed
            const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
            if (userDoc.exists) {
                // Merge Firebase auth user with Firestore user data
                currentUser.value = {
                    ...currentUser.value,
                    ...userDoc.data()
                };
            }
        } else {
            console.error("User not authenticated");
            router.push('/login');
            return;
        }

        // Watch chats to load user data for participants
        watch(chats, async (newChats) => {
            if (!newChats || newChats.length === 0) return;

            const uniqueUserIds = new Set();

            // Collect unique user IDs
            newChats.forEach(chat => {
                if (chat.users) {
                    chat.users.forEach(userId => {
                        if (userId !== currentUser.value?.uid) {
                            uniqueUserIds.add(userId);
                        }
                    });
                }
            });

            // Fetch user data for each participant
            const fetchPromises = Array.from(uniqueUserIds).map(async userId => {
                try {
                    const userDoc = await db.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        usersData.value[userId] = {
                            id: userId,
                            ...userDoc.data()
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching user data for ${userId}:`, error);
                }
            });

            await Promise.all(fetchPromises);
        }, { immediate: true });
    } catch (error) {
        console.error("Error loading user data:", error);
        isLoading.value = false;
    }
};

// Initialize component
onMounted(async () => {
    // Make sure user is logged in
    if (!auth.currentUser) {
        router.push('/login');
        return;
    }

    await loadUserData();
    isLoading.value = false;

    // Check if there's a chatId in the route
    const chatId = router.currentRoute.value.query.id;
    const userId = router.currentRoute.value.query.user;

    if (chatId) {
        // Wait for chats to load
        watch(chats, (newChats) => {
            if (!newChats || chatsLoading.value) return;

            const chat = newChats.find(c => c.id === chatId);
            if (chat) {
                selectChat(chat);
            }
        }, { immediate: true });
    } else if (userId) {
        // If coming from a profile page with user ID
        showNewChatUI.value = true;
        startChatWith(userId);
    }
});
</script>

<style scoped>
.chat-container {
    width: 100%;
    height: calc(100vh - 60px); /* Account for the navbar height */
    margin-top: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #0D1117;
    color: #e6e6e6;
}

.loading-page {
    height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #0D1117;
    color: #e6e6e6;
}

.spinner-large {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(52, 152, 219, 0.2);
    border-top-color: #3498db;
    border-radius: 50%;
    animation: spinner 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}

.chat-layout {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

/* Sidebar */
.sidebar-container {
    width: 320px;
    height: 100%;
    border-right: 1px solid #1e2a38;
    display: flex;
    flex-direction: column;
}

.sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid #1e2a38;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.sidebar-header h2 {
    font-size: 1.5rem;
    margin: 0;
    color: #e6e6e6;
}

.new-chat-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #3498db;
    color: white;
    text-decoration: none;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
}

.new-chat-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
}

.new-chat-btn.active {
    background-color: #e74c3c;
}

.conversations-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
}

/* New Chat UI Styles */
.new-chat-container {
    padding: 1rem;
    border-bottom: 1px solid #1e2a38;
}

.search-form {
    margin-bottom: 0.75rem;
}

.search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: #1a2233;
    border: 1px solid #30374B;
    border-radius: 8px;
    color: #e6e6e6;
    font-size: 0.95rem;
}

.search-input:focus {
    outline: none;
    border-color: #3498db;
}

.search-input::placeholder {
    color: #7d8796;
}

.user-results {
    max-height: 250px;
    overflow-y: auto;
}

.user-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.user-select-row {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background-color: #1a2233;
    border-radius: 8px;
    border: 1px solid #30374B;
    cursor: pointer;
    transition: all 0.2s ease;
}

.user-select-row:hover {
    border-color: #3498db;
    transform: translateY(-2px);
}

.user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 0.75rem;
    flex-shrink: 0;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-details {
    flex: 1;
}

.username {
    font-weight: 600;
    color: #e6e6e6;
    font-size: 0.9rem;
}

.name {
    font-size: 0.75rem;
    color: #7d8796;
}

.searching,
.no-results,
.search-prompt {
    padding: 1rem 0;
    text-align: center;
    color: #7d8796;
    font-size: 0.9rem;
}

.searching {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

/* Chat content area */
.chat-content-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Chat header */
.chat-header {
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid #1e2a38;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #101822;
}

.chat-header-info {
    display: flex;
    align-items: center;
}

.chat-header-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 1rem;
    border: 2px solid #1e2a38;
}

.chat-header-details h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #e6e6e6;
}

.chat-header-actions {
    display: flex;
    align-items: center;
}

.profile-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: 1px solid #1e2a38;
    color: #3498db;
    cursor: pointer;
    transition: all 0.2s ease;
}

.profile-btn:hover {
    background-color: rgba(52, 152, 219, 0.1);
    transform: translateY(-2px);
}

/* Messages area */
.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    background-color: #0D1117;
}

.messages-list {
    display: flex;
    flex-direction: column;
}

.message-row {
    margin-bottom: 0.5rem;
    display: flex;
    max-width: 100%;
}

.message-sent {
    justify-content: flex-end;
}

.message-received {
    justify-content: flex-start;
}

/* Message input */
.message-input-container {
    padding: 1rem;
    border-top: 1px solid #1e2a38;
    display: flex;
    align-items: center;
    background-color: #101822;
}

.message-input {
    flex: 1;
    padding: 0.75rem 1rem;
    background-color: #1a2233;
    border: 1px solid #30374B;
    border-radius: 8px;
    color: #e6e6e6;
    font-size: 0.95rem;
    resize: none;
    min-height: 45px;
    max-height: 120px;
    overflow-y: auto;
}

.message-input:focus {
    outline: none;
    border-color: #3498db;
}

.send-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #3498db;
    color: white;
    border: none;
    margin-left: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.send-button:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
}
</style>