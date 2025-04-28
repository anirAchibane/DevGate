<template>
    <div class="container py-5">
        <h2 class="text-center mb-4">Messages</h2>
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
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useConversations } from "@/composables/useConversations";
import ConversationItem from "@/components/ConversationItem.vue";
import MessageContent from "@/components/MessageContent.vue";

const { conversations, loading } = useConversations();
const selectedChat = ref(null);

const selectChat = (chat) => {
    selectedChat.value = chat;
};
</script>