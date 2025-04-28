<template>
    <div class="list-group-item list-group-item-action" :class="{ active: active }" @click="$emit('select', chat)">
        <div class="d-flex w-100 justify-content-between">
            <div class="d-flex align-items-center">
                <img :src="otherUserPfp || '/default_pfp.jpg'" alt="Profile Picture" class="rounded-circle me-2"
                    style="width: 40px; height: 40px;">
                <h5 class="mb-1">{{ otherUsername || "Chat" }}</h5>
            </div>
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
const otherUserPfp = ref("");
const loading = ref(true);

onMounted(() => {
    fetchOtherUserDetails();
});

const fetchOtherUserDetails = async () => {
    if (!props.chat || !props.chat.users) return;

    const currentUserId = auth.currentUser?.uid;
    const otherUserId = props.chat.users.find(id => id !== currentUserId);

    if (otherUserId) {
        const { userData, error } = getUser(otherUserId);

        const checkData = setInterval(() => {
            if (userData.value) {
                otherUsername.value = userData.value.username || "User";
                otherUserPfp.value = userData.value.profilePicture || "/default_pfp.jpg";
                loading.value = false;
                clearInterval(checkData);
            } else if (error.value) {
                otherUsername.value = "Unknown User";
                otherUserPfp.value = "/default_pfp.jpg";
                loading.value = false;
                clearInterval(checkData);
                console.error("Error fetching user:", error.value);
            }
        }, 100);

        setTimeout(() => clearInterval(checkData), 5000);
    } else {
        otherUsername.value = "Chat";
        otherUserPfp.value = "/default_pfp.jpg";
        loading.value = false;
    }
};
</script>