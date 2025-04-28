<template>
    <div class="posts-container">
        <div class="posts-row">
            <div v-if="loading" class="loading-container">
                <LoadingOverlay message="Loading posts..." large />
            </div>
            <div v-else-if="error" class="error-container">
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    Error: {{ error }}
                </div>
            </div>
            <div v-else class="posts-column">
                <div v-if="posts.length === 0" class="empty-state">
                    <i class="fas fa-newspaper empty-icon"></i>
                    <p>No posts to display yet</p>
                </div>
                <div
                    v-else
                    v-for="post in posts"
                    :key="post"
                    class="post-wrapper"
                >
                    <post-item :postId="post" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import PostItem from "@/components/PostItem";
import LoadingOverlay from "@/components/LoadingOverlay";
import { getPosts } from "@/composables/getPost";
import { ref, onMounted, onUnmounted, watchEffect } from "vue";

const posts = ref([]);
const loading = ref(true);
const error = ref(null);
let unsubscribe = null;

onMounted(() => {
    const postsData = getPosts();

    // Use watchEffect to sync reactive references
    watchEffect(() => {
        posts.value = postsData.posts.value;
        error.value = postsData.error.value;
        loading.value = postsData.loading.value;
    });

    // Store unsubscribe function to clean up when component unmounts
    unsubscribe = postsData.unsubscribe;
});

onUnmounted(() => {
    // Cleanup subscription when component is destroyed
    if (unsubscribe) {
        unsubscribe();
        console.log("Unsubscribed from posts feed");
    }
});
</script>

<style scoped>
.posts-container {
    width: 100%;
}

.posts-row {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.posts-column {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.post-wrapper {
    width: 100%;
}

.loading-container {
    width: 100%;
    height: 300px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.error-container {
    margin: 20px 0;
    width: 100%;
}

.error-message {
    padding: 1rem;
    background-color: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.3);
    color: #e74c3c;
    border-radius: 6px;
    text-align: center;
}

.error-message i {
    margin-right: 0.5rem;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    background-color: rgba(13, 17, 23, 0.5);
    border-radius: 8px;
    border: 1px dashed #555d69;
    color: #cfd8dc;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #555d69;
}
</style>
