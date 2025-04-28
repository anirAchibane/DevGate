<template>
    <div class="container py-5">
        <h2 class="text-center mb-4">Messages</h2>
        <div class="text-end mb-3">
            <button class="btn btn-primary" @click="openAddChatModal">Add Chat</button>
        </div>
        <div class="row">
            <div class="col-md-4">
                <div v-if="loading">Loading chats...</div>
                <div v-else-if="conversations.length === 0" class="text-center text-muted">
                    No conversations yet
                </div>
                <div v-else class="list-group">
                    <ConversationItem v-for="chat in conversations" :key="chat.id" :chat="chat"
                        :active="selectedChat?.id === chat.id" @select="selectChat" />
                </div>
            </div>
            <div class="col-md-8">
                <!-- Chat header with user profile info -->
                <div v-if="selectedChat && otherUserDetails" class="chat-header mb-3 p-3 rounded shadow-sm"
                    @click="goToUserProfile(otherUserDetails.id)">
                    <div class="d-flex align-items-center">
                        <img :src="otherUserDetails.profilePicture || '/default_pfp.jpg'" class="rounded-circle me-3"
                            alt="Profile Picture"
                            style="width: 48px; height: 48px; object-fit: cover; cursor: pointer;">
                        <div>
                            <h5 class="mb-0">{{ otherUserDetails.username }}</h5>
                            <small class="text-muted">Click to view profile</small>
                        </div>
                    </div>
                </div>
                <MessageContent v-if="selectedChat" :chat="selectedChat" />
                <div v-else class="text-center mt-5 text-muted">
                    Select a conversation
                </div>
            </div>
        </div>

        <!-- Add Chat Modal -->
        <div v-if="showAddChatModal" class="modal" tabindex="-1" style="display: block;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Chat</h5>
                        <button type="button" class="btn-close" @click="closeAddChatModal"></button>
                    </div>
                    <div class="modal-body">
                        <input v-model="searchUsername" class="form-control" type="text"
                            placeholder="Search by username">
                        <ul class="list-group mt-3">
                            <li v-for="user in searchResults" :key="user.id"
                                class="list-group-item d-flex justify-content-between align-items-center">
                                <span>{{ user.username }}</span>
                                <button class="btn btn-sm btn-primary" @click="addChat(user.id)">Add</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useConversations } from "@/composables/useConversations";
import ConversationItem from "@/components/ConversationItem.vue";
import MessageContent from "@/components/MessageContent.vue";
import { db, auth } from "@/firebase/config";
import { useRouter } from "vue-router";

const router = useRouter();
const { conversations, loading } = useConversations();
const selectedChat = ref(null);
const showAddChatModal = ref(false);
const searchUsername = ref("");
const searchResults = ref([]);
const otherUserDetails = ref(null);

const selectChat = async (chat) => {
    selectedChat.value = chat;

    // Get the other user in the conversation
    if (chat && chat.users) {
        const currentUserId = auth.currentUser?.uid;
        const otherUserId = chat.users.find(id => id !== currentUserId);

        if (otherUserId) {
            try {
                const userDoc = await db.collection("users").doc(otherUserId).get();
                if (userDoc.exists) {
                    otherUserDetails.value = {
                        id: otherUserId,
                        ...userDoc.data()
                    };
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
                otherUserDetails.value = null;
            }
        }
    }
};

// Navigate to user profile
const goToUserProfile = (userId) => {
    if (userId) {
        router.push(`/profile/${userId}`);
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
    const usersRef = db.collection("users");
    const snapshot = await usersRef.orderBy("username").startAt(username).endAt(username + "\uf8ff").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const createChat = async (userId) => {
    const currentUserId = auth.currentUser?.uid;
    const chatRef = db.collection("chat").doc();
    await chatRef.set({
        createdAt: new Date(),
        lastUpdate: new Date(),
        lastMessage: null,
        users: [currentUserId, userId]
    });
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
.chat-header {
    background-color: #f8f9fa;
    transition: all 0.2s ease;
    cursor: pointer;
    border-left: 3px solid #3498db;
}

.chat-header:hover {
    background-color: #e9ecef;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chat-header img {
    border: 2px solid #3498db;
    transition: transform 0.2s ease;
}

.chat-header:hover img {
    transform: scale(1.05);
}
</style>