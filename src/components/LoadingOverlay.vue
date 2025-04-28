<template>
    <div
        class="loading-overlay"
        :class="{ 'full-page': props.fullPage, transparent: props.transparent }"
    >
        <div class="loading-content">
            <div
                class="spinner"
                :class="{ 'spinner-large': props.large }"
            ></div>
            <p v-if="props.message" class="loading-message">
                {{ props.message }}
            </p>
        </div>
    </div>
</template>

<script setup>
import defineProps from "vue";

const props = defineProps({
    fullPage: {
        type: Boolean,
        default: false,
    },
    large: {
        type: Boolean,
        default: false,
    },
    message: {
        type: String,
        default: "Loading...",
    },
    transparent: {
        type: Boolean,
        default: false,
    },
});
</script>

<style scoped>
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(13, 17, 23, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    border-radius: inherit;
    backdrop-filter: blur(4px);
}

.loading-overlay.transparent {
    background-color: rgba(13, 17, 23, 0.6);
}

.loading-overlay.full-page {
    position: fixed;
    z-index: 9999;
}

.loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 0.25rem solid rgba(52, 152, 219, 0.2);
    border-top-color: #3498db;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

.spinner-large {
    width: 3.5rem;
    height: 3.5rem;
    border-width: 0.35rem;
}

.loading-message {
    margin-top: 1rem;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 500;
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}
</style>
