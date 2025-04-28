<template>
    <div class="list-group-item list-group-item-action" :class="{ active: active }" @click="$emit('select', chat)">
        <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">{{ chat.otherUsername || "Chat" }}</h5>
            <small class="text-muted">
                {{ chat.lastUpdate?.toDate().toLocaleString() || "No activity" }}
            </small>
        </div>
        <p class="mb-1 text-truncate">{{ chat.lastMessage?.content || "No messages yet" }}</p>
    </div>
</template>

<script setup>
import {defineProps} from "vue";
defineProps({
    chat: { type: Object, required: true },
    active: { type: Boolean, default: false }
});
</script>