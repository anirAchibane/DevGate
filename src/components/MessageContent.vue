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
import { ref, onMounted, defineProps, watch, computed, onUnmounted } from "vue";
import { auth, db } from "@/firebase/config";
import { useSendMessage } from "@/composables/getChatMessages";

const props = defineProps({
    chat: { type: Object, required: true }
});

const messages = ref([]);
const newMessage = ref("");
const currentUserId = auth.currentUser.uid;
const unsubscribe = ref(null);

// Reactive chat reference
const chatRef = computed(() => db.collection("chat").doc(props.chat.id));

// Use a computed property to get the current chat ID
const currentChatId = computed(() => props.chat.id);

// Initialize sendMessage composable with a function that always uses the current chat ID
const sendMessage = async () => {
    if (!newMessage.value.trim()) return;

    // Create a new instance of the sendMessage composable with the current chat ID
    const { sendMessage: sendMessageComposable } = useSendMessage(currentChatId.value);

    await sendMessageComposable(newMessage.value);
    newMessage.value = "";
};

const setupListener = () => {
    // Clear existing listener
    if (unsubscribe.value) {
        unsubscribe.value();
    }

    unsubscribe.value = chatRef.value.collection("messages")
        .orderBy("created_at")
        .onSnapshot(snapshot => {
            messages.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            scrollToBottom();
        });
};

onMounted(() => {
    setupListener();
});

watch(() => props.chat.id, (newVal) => {
    if (newVal) {
        setupListener();
    }
});

// Cleanup listener when component unmounts
onUnmounted(() => {
    if (unsubscribe.value) {
        unsubscribe.value();
    }
});

const scrollToBottom = () => {
    const messagesBox = document.querySelector(".messages-box");
    if (messagesBox) {
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }
};
</script>

<style scoped>
.messages-box {
    min-height: 400px;
    max-height: 400px;
    overflow-y: auto;
}
</style>