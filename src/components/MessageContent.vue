<template>
    <div class="card shadow-sm">
        <div class="card-body messages-box">
            <div v-for="(message, index) in messages" :key="index" class="mb-2">
                <div
                    :class="['p-2 rounded', { 'bg-light': message.sender_id !== currentUserId, 'bg-primary text-white': message.sender_id === currentUserId }]">
                    <small>{{ message.content }}</small>
                    <div class="text-end small mt-1 text-muted">
                        {{ message.created_at?.toDate().toLocaleTimeString() || '...' }}
                    </div>
                </div>
            </div>
        </div>

        <form @submit.prevent="sendMessage" class="card-footer d-flex">
            <input v-model="newMessage" class="form-control me-2" type="text" placeholder="Type a message..."
                required />
            <button class="btn btn-primary" type="submit">Send</button>
        </form>
    </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from "vue";
import { auth, db } from "@/firebase/config";
import sendMessageToChat from "@/composables/sendMessageToChat";

const props = defineProps({
    chat: { type: Object, required: true }
});

const messages = ref([]);
const newMessage = ref("");
const currentUserId = auth.currentUser.uid;

const chatRef = db.collection("chat").doc(props.chat.id);

const sendMessage = async () => {
    if (!newMessage.value.trim()) return;
    await sendMessageToChat(props.chat.id, {
        content: newMessage.value,
        sender_id: currentUserId
    });
    newMessage.value = "";
};

onMounted(() => {
    chatRef.collection("messages")
        .orderBy("created_at")
        .onSnapshot(snapshot => {
            messages.value = snapshot.docs.map(doc => doc.data());
        });
});
</script>

<style scoped>
.messages-box {
    min-height: 400px;
    max-height: 400px;
    overflow-y: auto;
}
</style>