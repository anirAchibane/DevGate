<template>
    <div class="list-group-item list-group-item-action" :class="{ active: active }" @click="$emit('select', chat)">
        <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">{{ otherUsername || "Chat" }}</h5>
            <small class="text-muted">
                {{ chat.lastUpdate?.toDate().toLocaleString() || "No activity" }}
            </small>
        </div>
        <p class="mb-1 text-truncate">{{ chat.lastMessage?.content || "No messages yet" }}</p>
    </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from "vue";
import { auth } from "@/firebase/config";
import { getUser } from "@/composables/getUser";

const props = defineProps({
    chat: { type: Object, required: true },
    active: { type: Boolean, default: false }
});

const otherUsername = ref("");
const loading = ref(true);

onMounted(() => {
    fetchOtherUsername();
});

// Function to get the other user in the conversation
const fetchOtherUsername = async () => {
    if (!props.chat || !props.chat.users) return;

    // Find the ID of the other user in the conversation
    const currentUserId = auth.currentUser?.uid;
    const otherUserId = props.chat.users.find(id => id !== currentUserId);

    if (otherUserId) {
        // Use the getUser composable to fetch user data
        const { userData, error } = getUser(otherUserId);

        // We need to watch for userData to be populated since getUser is asynchronous
        const checkData = setInterval(() => {
            if (userData.value) {
                otherUsername.value = userData.value.username || "User";
                loading.value = false;
                clearInterval(checkData);
            } else if (error.value) {
                otherUsername.value = "Unknown User";
                loading.value = false;
                clearInterval(checkData);
                console.error("Error fetching user:", error.value);
            }
        }, 100);

        // Clear interval after 5 seconds to prevent leaks
        setTimeout(() => clearInterval(checkData), 5000);
    } else {
        otherUsername.value = "Chat";
        loading.value = false;
    }
};
</script>