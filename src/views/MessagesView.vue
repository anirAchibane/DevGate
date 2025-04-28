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

const { conversations, loading } = useConversations();
const selectedChat = ref(null);
const showAddChatModal = ref(false);
const searchUsername = ref("");
const searchResults = ref([]);

const selectChat = (chat) => {
    selectedChat.value = chat;
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